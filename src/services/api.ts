import {
  AuthApi,
  Configuration,
  EventsApi,
  CustomersApi,
  MessagesApi,
  ApiError,
} from '@towncryerio/towncryer-js-api-client';
import axios, { AxiosInstance, AxiosRequestConfig, CreateAxiosDefaults } from 'axios';
import { RetryConfig } from '../types';

enum AuthMethod {
  API_KEY = 'api_key',
  TOKEN = 'token'
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];
const DEFAULT_RETRY_BASE_DELAY_MS = 300;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type ApiTypes = {
    auth: AuthApi;
    event: EventsApi;
    customer: CustomersApi;
    message: MessagesApi;
};

export interface AxiosInstanceFactory {
    create(config?: CreateAxiosDefaults): AxiosInstance;
}

export class DefaultAxiosInstanceFactory implements AxiosInstanceFactory {
  create(config?: CreateAxiosDefaults): AxiosInstance {
    return axios.create(config);
  }
}

export default class ApiService {
  private static instance: ApiService;
  private apiInstances: Partial<ApiTypes> = {};
  private configuration: Configuration = {
    isJsonMime: (mime: string) => {
      return mime === 'application/json';
    }
  };
  private axiosInstance: AxiosInstance;
  private failedQueue: Array<{
        resolve: (token: string) => void;
        reject: (error: ApiError) => void;
    }> = [];
  private token?: string;
  private refreshToken?: string;
  private isRefreshing = false;
  private tenantId = '';
  private axiosInstanceFactory: AxiosInstanceFactory;
  private authMethod: AuthMethod = AuthMethod.TOKEN;
  private timeout: number = DEFAULT_TIMEOUT;
  private maxRetries: number = DEFAULT_MAX_RETRIES;
  private retryableStatusCodes: number[] = DEFAULT_RETRYABLE_STATUS_CODES;
  private constructor(axiosFactory: AxiosInstanceFactory) {
    this.axiosInstanceFactory = axiosFactory;
    this.axiosInstance = this.createAxiosInstance();
    this.setupAxiosInterceptors();
  }

  public static getInstance(factory: AxiosInstanceFactory): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService(factory);
    }

    return ApiService.instance;
  }

  private updateAxiosInstance() {
    this.axiosInstance = this.createAxiosInstance();
    this.setupAxiosInterceptors();
  }

  private createAxiosInstance(): AxiosInstance {
    const headers: Record<string, string> = {
      'Client': 'TowncryerCoreSDK',
    };

    if (this.tenantId) {
      headers['X-Tenant-ID'] = this.tenantId;
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return this.axiosInstanceFactory.create({
      baseURL: this.configuration.basePath,
      timeout: this.timeout,
      headers,
    });
  }

  public setBaseUrl(baseUrl: string) {
    this.configuration = new Configuration({
      ...this.configuration,
      basePath: baseUrl,
    });
    this.updateAxiosInstance();
  }

  public setTimeout(timeout: number) {
    this.timeout = timeout;
    this.updateAxiosInstance();
  }

  public setRetryConfig(retryConfig: RetryConfig) {
    this.maxRetries = retryConfig.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryableStatusCodes = retryConfig.retryableStatusCodes ?? DEFAULT_RETRYABLE_STATUS_CODES;
  }

  public setToken(token: string | undefined) {
    if (this.token === token) return;
    this.token = token;
    if (token) {
      this.authMethod = AuthMethod.TOKEN;
    }
    this.updateAxiosInstance();
  }

  public setOrganisationId(organisationId: string) {
    if (this.tenantId === organisationId) return;
    this.tenantId = organisationId;
    this.updateAxiosInstance();
  }

  public setTokenAndOrganisationId(token: string, organisationId: string) {
    const shouldUpdate = this.token !== token || this.tenantId !== organisationId;
    this.token = token;
    this.tenantId = organisationId;
    
    if (shouldUpdate) {
      this.updateAxiosInstance();
    }
  }

  public setRefreshToken(refreshToken: string | undefined) {
    this.refreshToken = refreshToken;
    if (refreshToken) {
      this.authMethod = AuthMethod.TOKEN;
    }
  }

  public async setApiKey(apiKey: string): Promise<void> {
    this.authMethod = AuthMethod.API_KEY;
    const response = await this.getApi('auth').clientAppLogin({ apiKey });
    this.token = response.data.accessToken;
    this.refreshToken = response.data.refreshToken;
  }

  public getApi<K extends keyof ApiTypes>(apiName: K): ApiTypes[K] {
    if (!this.apiInstances[apiName]) {
      this.apiInstances[apiName] = this.createApi(apiName);
    }
    return this.apiInstances[apiName] as ApiTypes[K];
  }

  private createApi<K extends keyof ApiTypes>(apiName: K): ApiTypes[K] {
    const apiMap: Record<keyof ApiTypes, new (config: Configuration, basePath?: string, axios?: AxiosInstance) => ApiTypes[keyof ApiTypes]> = {
      auth: AuthApi,
      event: EventsApi,
      customer: CustomersApi,
      message: MessagesApi
    };

    const ApiConstructor = apiMap[apiName];
    return new ApiConstructor(this.configuration, this.configuration.basePath, this.axiosInstance) as ApiTypes[K];
  }

  private processQueue(error: ApiError | null, token: string | null = null) {
    this.failedQueue.forEach(promise => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve(token as string);
      }
    });
    this.failedQueue = [];
  }

  private refreshShortLivedToken = async (): Promise<string> => {
    if (!this.refreshToken) {
      throw new Error('Refresh token is required to refresh short-lived token');
    }

    let response;
    if (this.authMethod === AuthMethod.API_KEY) {
      response = await this.getApi('auth').refreshClientAppToken({ refreshToken: this.refreshToken });
    } else {
      response = await this.getApi('auth').refreshShortLivedToken({ refreshToken: this.refreshToken });
    }

    this.token = response.data.accessToken;
    this.refreshToken = response.data.refreshToken;

    return response.data.accessToken || '';
  };

  private isRetryableError(error: { response?: { status?: number }; request?: unknown }): boolean {
    if (!error.response) {
      return Boolean(error.request);
    }
    return this.retryableStatusCodes.includes(error.response.status as number);
  }

  private async retryIfRetryable(
    originalRequest: AxiosRequestConfig & { _retryCount?: number },
    error: { response?: { status?: number }; request?: unknown }
  ) {
    if (!originalRequest || !this.isRetryableError(error)) {
      return Promise.reject(error);
    }

    originalRequest._retryCount = originalRequest._retryCount ?? 0;
    if (originalRequest._retryCount >= this.maxRetries) {
      return Promise.reject(error);
    }

    originalRequest._retryCount += 1;
    const delay = DEFAULT_RETRY_BASE_DELAY_MS * 2 ** (originalRequest._retryCount - 1);
    await sleep(delay);

    return this.axiosInstance(originalRequest);
  }

  private setupAxiosInterceptors() {
    this.axiosInstance.interceptors.request.use(
      request => {
        request.headers['Client'] = 'TowncryerCoreSDK';
        if (this.token) {
          request.headers['Authorization'] = `Bearer ${this.token}`;
        }
        return request;
      }
    );

    this.axiosInstance.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;

        if (
          !originalRequest ||
                    !originalRequest?.headers['Client'] ||
                    originalRequest?.headers['Client'] !== 'TowncryerCoreSDK'
        ) {
          return Promise.reject(error);
        }

        if (error.response?.status !== 401 || originalRequest._retry) {
          return this.retryIfRetryable(originalRequest, error);
        }

        originalRequest._retry = true;

        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return this.axiosInstance(originalRequest);
          }).catch(err => Promise.reject(err));
        }

        this.isRefreshing = true;

        try {
          const newToken = await this.refreshShortLivedToken();
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          this.processQueue(null, newToken);
          return this.axiosInstance(originalRequest)
            .catch(error => {
              this.processQueue(error as ApiError, null);
              return Promise.reject(error);
            })
            .finally(() => {
              this.isRefreshing = false;
            });
        } catch (error) {
          this.processQueue(error as ApiError, null);
          return Promise.reject(error);
        }
      }
    );
  }
}

export const apiService = ApiService.getInstance(new DefaultAxiosInstanceFactory());
