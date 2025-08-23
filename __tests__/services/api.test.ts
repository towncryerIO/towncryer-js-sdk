import axios, { AxiosInstance, CreateAxiosDefaults } from 'axios';
import ApiService, { AxiosInstanceFactory } from '../../src/services/api';
import { AuthApi } from '@towncryerio/towncryer-js-api-client';

// Mock the external dependencies
// jest.mock('axios');
// const mockAxios = axios as jest.Mocked<typeof axios>;

// Create a mock Axios instance that implements AxiosInstance
const createMockAxiosInstance = (): any => ({
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
      clear: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
      clear: jest.fn(),
    },
  },
  defaults: { headers: {} },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  request: jest.fn(),
  head: jest.fn(),
  options: jest.fn(),
  getUri: jest.fn(),
  postForm: jest.fn(),
  putForm: jest.fn(),
  patchForm: jest.fn(),
  create: jest.fn(() => createMockAxiosInstance())
});

class MockAxiosInstanceFactory implements AxiosInstanceFactory {
    create(config?: CreateAxiosDefaults): AxiosInstance {
        const instance = createMockAxiosInstance();
        // Setup interceptors mock
        instance.interceptors = {
            request: {
                use: jest.fn(),
                eject: jest.fn(),
                clear: jest.fn(),
            },
            response: {
                use: jest.fn(),
                eject: jest.fn(),
                clear: jest.fn(),
            }
        };
        return instance as unknown as AxiosInstance;
    }
}

jest.mock('@towncryerio/towncryer-js-api-client', () => {
  const mockAuthApi = {
    clientAppLogin: jest.fn(),
    refreshShortLivedToken: jest.fn(),
  };

  return {
    AuthApi: jest.fn(() => mockAuthApi),
    EventsApi: jest.fn(),
    CustomersApi: jest.fn(),
    MessagesApi: jest.fn(),
    Configuration: jest.fn().mockImplementation(() => ({
      basePath: 'http://test-api',
      isJsonMime: jest.fn(),
    })),
  };
});

describe('ApiService', () => {
  let apiService: ApiService;
  
  let mockInstance: any;
  
  let createSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the singleton instance
    (ApiService as any).instance = undefined;
    
    // Create a new instance for each test
    mockInstance = new MockAxiosInstanceFactory();
    // Spy on the create method
    createSpy = jest.spyOn(mockInstance, 'create').mockImplementation((config?: any) => ({
      ...createMockAxiosInstance(),
      ...(config || {})
    }));
    
    apiService = ApiService.getInstance(mockInstance);
  });

  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      const factory = new MockAxiosInstanceFactory();
      const instance1 = ApiService.getInstance(factory);
      const instance2 = ApiService.getInstance(factory);
      expect(instance1).toBe(instance2);
    });
  });

  describe('setBaseUrl', () => {
    it('should update the base URL in the configuration', () => {
      const testUrl = 'http://new-test-api';
      
      apiService.setBaseUrl(testUrl);
      
      expect(mockInstance.create).toHaveBeenCalledWith(
        expect.objectContaining({
            headers: expect.any(Object)
        })
      );
    });
  });

  describe('setToken', () => {
    it('should update the token and recreate axios instance', () => {
      const testToken = 'test-token';
      
      apiService.setToken(testToken);
      
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining(
            {
                headers: expect.objectContaining({
                    Authorization: `Bearer ${testToken}`,
                }),
            }
        )
      )
    });
  });

  describe('setOrganisationId', () => {
    it('should update the tenant ID and recreate axios instance', () => {
      const orgId = 'test-org';
      
      apiService.setOrganisationId(orgId);
      
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Tenant-ID': orgId,
          }),
        })
      );
    });
  });

  describe('getApi', () => {
    it('should create and return an API instance if it does not exist', () => {
      const mockInstance = createMockAxiosInstance();
      
      const authApi = apiService.getApi('auth');
      
      expect(authApi).toBeDefined();
      expect(AuthApi).toHaveBeenCalled();
    });

    it('should return existing API instance if it exists', () => {
      const mockInstance = createMockAxiosInstance();
      
      const authApi1 = apiService.getApi('auth');
      const authApi2 = apiService.getApi('auth');
      
      expect(authApi1).toBe(authApi2);
      // Should only call AuthApi constructor once
      expect(AuthApi).toHaveBeenCalledTimes(1);
    });
  });

  describe('loginUsingApiKey', () => {
    it('should set token and refresh token on successful login', async () => {
      const mockResponse = {
        data: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
        },
      };
      
      // Mock the auth API response
      const mockAuthApi = {
        clientAppLogin: jest.fn().mockResolvedValue(mockResponse),
      };
      
      // Mock getApi to return our mock auth API
      jest.spyOn(apiService as any, 'getApi').mockReturnValue(mockAuthApi);
      
      // Mock setToken and setRefreshToken
      const setTokenSpy = jest.spyOn(apiService as any, 'setToken');
      const setRefreshTokenSpy = jest.spyOn(apiService as any, 'setRefreshToken');
      
      await (apiService as any).setApiKey('test-api-key');
      
      expect(mockAuthApi.clientAppLogin).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
      expect(setTokenSpy).toHaveBeenCalledWith('test-access-token');
      expect(setRefreshTokenSpy).toHaveBeenCalledWith('test-refresh-token');
    });
  });

  describe('refreshShortLivedToken', () => {
    it('should refresh the token using refresh token', async () => {
      const mockResponse = {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      };
      
      // Mock the auth API response
      const mockAuthApi = {
        refreshShortLivedToken: jest.fn().mockResolvedValue(mockResponse),
      };
      
      // Mock getApi to return our mock auth API
      jest.spyOn(apiService as any, 'getApi').mockReturnValue(mockAuthApi);
      
      // Set a refresh token
      (apiService as any).refreshToken = 'test-refresh-token';
      
      // Mock setToken and setRefreshToken
      const setTokenSpy = jest.spyOn(apiService as any, 'setToken');
      const setRefreshTokenSpy = jest.spyOn(apiService as any, 'setRefreshToken');
      
      await (apiService as any).refreshShortLivedToken();
      
      expect(mockAuthApi.refreshShortLivedToken).toHaveBeenCalledWith({ 
        refreshToken: 'test-refresh-token' 
      });
      expect(setTokenSpy).toHaveBeenCalledWith('new-access-token');
      expect(setRefreshTokenSpy).toHaveBeenCalledWith('new-refresh-token');
    });
  });
});
