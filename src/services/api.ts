import {
    AuthApi,
    Configuration,
    EventsApi,
    CustomersApi,
    MessagesApi,
} from "@towncryerio/towncryer-js-api-client";
import axios, { AxiosInstance } from "axios";

type ApiTypes = {
    auth: AuthApi;
    event: EventsApi;
    customer: CustomersApi;
    message: MessagesApi;
};

class ApiService {
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
        reject: (error: any) => void;
    }> = [];
    private token?: string;
    private refreshToken?: string;
    private isRefreshing = false;
    private tenantId: string = "";
    private constructor() {
        // Private constructor to prevent direct construction calls with 'new'
        this.axiosInstance = this.createAxiosInstance();
        this.setupAxiosInterceptors();
    }

    public static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }

    private createAxiosInstance(): AxiosInstance {
        let axiosInstance = axios.create({
            baseURL: this.configuration.basePath,
            headers: {
                "X-Tenant-ID": this.tenantId,
                "Client": "TowncryerCoreSDK",
                Authorization: `Bearer ${this.token}`,
            }
        });

        return axiosInstance;
    }

    public setBaseUrl(baseUrl: string) {
        this.configuration = new Configuration({
            ...this.configuration,
            basePath: baseUrl,
        });
        this.axiosInstance = this.createAxiosInstance();
    }

    public setToken(token: string | undefined) {
        this.token = token;
        this.axiosInstance = this.createAxiosInstance();
        this.setupAxiosInterceptors();
    }
    
    public setOrganisationId(organisationId: string) {
        this.tenantId = organisationId;
        this.axiosInstance = this.createAxiosInstance();
        this.setupAxiosInterceptors();
    }

    public setTokenAndOrganisationId(token: string, organisationId: string) {
        this.token = token;
        this.tenantId = organisationId;
        this.axiosInstance = this.createAxiosInstance();
        this.setupAxiosInterceptors();
    }
    
    public setRefreshToken(refreshToken: string | undefined) {
        this.refreshToken = refreshToken;
    }

    public setApiKey(apiKey: string) {
        this.loginUsingApiKey(apiKey);
    }

    public getApi<K extends keyof ApiTypes>(apiName: K): ApiTypes[K] {
        if (!this.apiInstances[apiName]) {
            this.apiInstances[apiName] = this.createApi(apiName);
        }
        return this.apiInstances[apiName] as ApiTypes[K];
    }

    private loginUsingApiKey(apiKey: string) {
        const api = this.getApi("auth");
        api.clientAppLogin({ apiKey })
        .then((response: any) => {
            this.setToken(response.data.accessToken);
            this.setRefreshToken(response.data.refreshToken);
        })
        .catch((error) => {
            console.error("Failed to login using API key", error);
        });
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

    private processQueue(error: any, token: string | null = null) {
        this.failedQueue.forEach(promise => {
            if (error) {
                promise.reject(error);
            } else {
                promise.resolve(token as string);
            }
        });
        this.failedQueue = [];
    };

    private refreshShortLivedToken = async (): Promise<string> => {
        try {
            if (!this.refreshToken) {
                throw new Error("Refresh token is required to refresh short-lived token");
            }

            const response = await this.getApi("auth").
                refreshShortLivedToken({ refreshToken: this.refreshToken });

            this.setToken(response.data.accessToken);
            this.setRefreshToken(response.data.refreshToken);

            return response.data.accessToken || "";
        } catch (error) {
            throw error;
        }
    };

    private setupAxiosInterceptors() {
        this.axiosInstance.interceptors.response.use(
            response => response,
            async error => {
                const originalRequest = error.config;

                if (
                    !originalRequest || 
                    !originalRequest?.headers["Client"] || 
                    originalRequest?.headers["Client"] !== "TowncryerCoreSDK"
                ) {
                    return Promise.reject(error);
                }

                if (error.response?.status !== 401 || originalRequest._retry) {
                    return Promise.reject(error);
                }

                originalRequest._retry = true;

                if (this.isRefreshing) {
                    return new Promise((resolve, reject) => {
                        this.failedQueue.push({ resolve, reject });
                    }).then(token => {
                        originalRequest.headers["Authorization"] = `Bearer ${token}`;
                        return this.axiosInstance(originalRequest);
                    }).catch(err => Promise.reject(err));
                }

                this.isRefreshing = true;

                try {
                    const newToken = await this.refreshShortLivedToken();
                    originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                    this.processQueue(null, newToken);
                    return this.axiosInstance(originalRequest);
                } catch (refreshError) {
                    this.processQueue(refreshError, null);
                    return Promise.reject(refreshError);
                } finally {
                    this.isRefreshing = false;
                }
            }
        );
    };
}

export default ApiService.getInstance();
