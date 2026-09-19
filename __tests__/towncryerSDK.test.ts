const callOrder: string[] = [];
let resolveSetApiKey!: () => void;
let rejectSetApiKey!: (error: Error) => void;
let acceptMock!: jest.Mock;
const apiServiceInstances: MockApiService[] = [];

class MockApiService {
  setBaseUrl = jest.fn();
  setTimeout = jest.fn();
  setRetryConfig = jest.fn();
  setOrganisationId = jest.fn();
  setToken = jest.fn();
  setTokenAndOrganisationId = jest.fn();
  setRefreshToken = jest.fn();
  setApiKey = jest.fn(
    () =>
      new Promise<void>((resolve, reject) => {
        resolveSetApiKey = () => {
          callOrder.push('setApiKey');
          resolve();
        };
        rejectSetApiKey = (error: Error) => {
          callOrder.push('setApiKey:error');
          reject(error);
        };
      })
  );

  getApi = jest.fn((name: string) => {
    if (name === 'event') {
      return {
        accept: (...args: unknown[]) => {
          callOrder.push('accept');
          return acceptMock(...args);
        },
      };
    }
    return {};
  });
}

jest.mock('../src/services/api', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    const instance = new MockApiService();
    apiServiceInstances.push(instance);
    return instance;
  }),
  DefaultAxiosInstanceFactory: jest.fn(),
}));

const createCustomerMock = jest.fn();
const sendMessagesMock = jest.fn();
const submitContactFormMock = jest.fn();
const subscribeToEmailsMock = jest.fn();

jest.mock('../src/services/customerService', () => ({
  __esModule: true,
  CustomerService: jest.fn().mockImplementation(() => ({
    createCustomer: createCustomerMock,
  })),
}));

jest.mock('../src/services/messageService', () => ({
  __esModule: true,
  MessageService: jest.fn().mockImplementation(() => ({
    sendMessages: sendMessagesMock,
  })),
}));

jest.mock('../src/services/utilityService', () => ({
  __esModule: true,
  UtilityService: jest.fn().mockImplementation(() => ({
    submitContactForm: submitContactFormMock,
    subscribeToEmails: subscribeToEmailsMock,
  })),
}));

import { Towncryer } from '../src/towncryerSDK';

describe('Towncryer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    callOrder.length = 0;
    apiServiceInstances.length = 0;
    acceptMock = jest.fn().mockResolvedValue({ data: { message: 'ok' } });
  });

  it('does not require callers to await any readiness call for token-based auth', async () => {
    const client = new Towncryer({
      authConfig: { accessToken: 'token-123' },
    });

    const response = await client.publishEvent({ name: 'signup' } as never);

    expect(response).toEqual({ code: '200', message: 'Success', data: { message: 'ok' } });
  });

  it('waits for the api key exchange to finish before firing a request, with no explicit call needed', async () => {
    const client = new Towncryer({
      authConfig: { apiKey: 'api-key-123' },
    });

    const publishPromise = client.publishEvent({ name: 'signup' } as never);

    // The exchange hasn't resolved yet, so the request must not have fired.
    await Promise.resolve();
    await Promise.resolve();
    expect(callOrder).toEqual([]);

    resolveSetApiKey();
    await publishPromise;

    expect(callOrder).toEqual(['setApiKey', 'accept']);
  });

  it('rejects the request if the api key exchange fails, without needing an explicit readiness check', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error('boom');

    const client = new Towncryer({
      authConfig: { apiKey: 'api-key-123' },
    });

    const publishPromise = client.publishEvent({ name: 'signup' } as never);
    rejectSetApiKey(error);

    await expect(publishPromise).rejects.toThrow('boom');
    expect(acceptMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  describe('constructor auth branches', () => {
    it('applies base URL, timeout and retry defaults when none are configured', () => {
      new Towncryer({ authConfig: {} });
      const [apiService] = apiServiceInstances;

      expect(apiService.setBaseUrl).toHaveBeenCalledWith('https://api.towncryer.io/api/v1');
      expect(apiService.setTimeout).toHaveBeenCalledWith(30000);
      expect(apiService.setRetryConfig).toHaveBeenCalledWith({});
    });

    it('forwards custom base URL, timeout and retry config', () => {
      const retryConfig = { maxRetries: 5 };
      new Towncryer({
        authConfig: {},
        baseUrl: 'https://custom.example.com',
        timeout: 5000,
        retryConfig,
      });
      const [apiService] = apiServiceInstances;

      expect(apiService.setBaseUrl).toHaveBeenCalledWith('https://custom.example.com');
      expect(apiService.setTimeout).toHaveBeenCalledWith(5000);
      expect(apiService.setRetryConfig).toHaveBeenCalledWith(retryConfig);
    });

    it('uses setToken for an access token without an organisation id', () => {
      new Towncryer({ authConfig: { accessToken: 'token-123' } });
      const [apiService] = apiServiceInstances;

      expect(apiService.setToken).toHaveBeenCalledWith('token-123');
      expect(apiService.setTokenAndOrganisationId).not.toHaveBeenCalled();
      expect(apiService.setRefreshToken).not.toHaveBeenCalled();
      expect(apiService.setApiKey).not.toHaveBeenCalled();
    });

    it('uses setTokenAndOrganisationId when an access token and organisation id are both provided', () => {
      new Towncryer({
        authConfig: { accessToken: 'token-123', refreshToken: 'refresh-123' },
        organisationId: 'org-1',
      });
      const [apiService] = apiServiceInstances;

      expect(apiService.setTokenAndOrganisationId).toHaveBeenCalledWith('token-123', 'org-1');
      expect(apiService.setToken).not.toHaveBeenCalled();
      expect(apiService.setRefreshToken).toHaveBeenCalledWith('refresh-123');
    });

    it('warns and prefers the access token when both an access token and api key are provided', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      new Towncryer({
        authConfig: { accessToken: 'token-123', apiKey: 'api-key-123' },
      });
      const [apiService] = apiServiceInstances;

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Both accessToken and apiKey provided. Using accessToken and ignoring apiKey.'
      );
      expect(apiService.setToken).toHaveBeenCalledWith('token-123');
      expect(apiService.setApiKey).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('sets the organisation id before exchanging the api key', () => {
      new Towncryer({
        authConfig: { apiKey: 'api-key-123' },
        organisationId: 'org-1',
      });
      const [apiService] = apiServiceInstances;

      expect(apiService.setOrganisationId).toHaveBeenCalledWith('org-1');
      expect(apiService.setApiKey).toHaveBeenCalledWith('api-key-123');
    });

    it('exchanges the api key without an organisation id when none is provided', () => {
      new Towncryer({ authConfig: { apiKey: 'api-key-123' } });
      const [apiService] = apiServiceInstances;

      expect(apiService.setOrganisationId).not.toHaveBeenCalled();
      expect(apiService.setApiKey).toHaveBeenCalledWith('api-key-123');
    });

    it('sets only the organisation id when no access token or api key is provided', () => {
      new Towncryer({ authConfig: {}, organisationId: 'org-1' });
      const [apiService] = apiServiceInstances;

      expect(apiService.setOrganisationId).toHaveBeenCalledWith('org-1');
      expect(apiService.setToken).not.toHaveBeenCalled();
      expect(apiService.setApiKey).not.toHaveBeenCalled();
    });

    it('sets none of the auth methods when the auth config is empty', () => {
      new Towncryer({ authConfig: {} });
      const [apiService] = apiServiceInstances;

      expect(apiService.setOrganisationId).not.toHaveBeenCalled();
      expect(apiService.setToken).not.toHaveBeenCalled();
      expect(apiService.setTokenAndOrganisationId).not.toHaveBeenCalled();
      expect(apiService.setApiKey).not.toHaveBeenCalled();
    });
  });

  describe('method delegation', () => {
    const client = () =>
      new Towncryer({
        authConfig: { accessToken: 'token-123' },
      });

    it('delegates createCustomer to the customer service', async () => {
      const response = { code: '200', message: 'Success' };
      createCustomerMock.mockResolvedValue(response);
      const payload = { identities: [], source: 'TowncryerAPI' } as never;

      await expect(client().createCustomer(payload)).resolves.toBe(response);
      expect(createCustomerMock).toHaveBeenCalledWith(payload);
    });

    it('delegates sendMessages to the message service', async () => {
      const scheduleInfo = { jobId: 'job-1', status: 'queued' };
      sendMessagesMock.mockResolvedValue(scheduleInfo);
      const payload = { emails: [] } as never;

      await expect(client().sendMessages(payload)).resolves.toBe(scheduleInfo);
      expect(sendMessagesMock).toHaveBeenCalledWith(payload);
    });

    it('delegates submitContactForm to the utility service', async () => {
      const response = { code: '200', message: 'Success' };
      submitContactFormMock.mockResolvedValue(response);
      const formData = { name: 'A', email: 'a@b.com', subject: 's', message: 'm' };

      await expect(client().submitContactForm(formData)).resolves.toBe(response);
      expect(submitContactFormMock).toHaveBeenCalledWith(formData);
    });

    it('delegates subscribeToEmails to the utility service', async () => {
      const response = { code: '200', message: 'Success' };
      subscribeToEmailsMock.mockResolvedValue(response);

      await expect(client().subscribeToEmails('a@b.com', { source: 'blog' })).resolves.toBe(response);
      expect(subscribeToEmailsMock).toHaveBeenCalledWith('a@b.com', { source: 'blog' });
    });

    it('sets the access token directly on the api service', () => {
      const sdk = client();
      const apiService = apiServiceInstances[apiServiceInstances.length - 1];

      sdk.setAccessToken('new-token');

      expect(apiService.setToken).toHaveBeenCalledWith('new-token');
    });

    it('sets the refresh token directly on the api service', () => {
      const sdk = client();
      const apiService = apiServiceInstances[apiServiceInstances.length - 1];

      sdk.setRefreshToken('new-refresh-token');

      expect(apiService.setRefreshToken).toHaveBeenCalledWith('new-refresh-token');
    });

    it('updates the tracked customer id', () => {
      const sdk = client();
      expect(() => sdk.setCustomerId('cust-1')).not.toThrow();
    });
  });

  describe('service accessors', () => {
    it('exposes the underlying event service', () => {
      const sdk = new Towncryer({ authConfig: { accessToken: 'token-123' } });

      expect(sdk.getEventService()).toEqual(
        expect.objectContaining({ publishEvent: expect.any(Function) })
      );
    });

    it('exposes the underlying messages api client', () => {
      const sdk = new Towncryer({ authConfig: { accessToken: 'token-123' } });
      const apiService = apiServiceInstances[apiServiceInstances.length - 1];

      const messagesApi = sdk.getMessagesApi();

      expect(apiService.getApi).toHaveBeenCalledWith('message');
      expect(messagesApi).toBeDefined();
    });

    it('defaults the customer id to an empty string when none is configured', () => {
      const sdk = new Towncryer({ authConfig: { accessToken: 'token-123' } });

      expect(sdk.getCustomerId()).toBe('');
    });

    it('returns the configured customer id', () => {
      const sdk = new Towncryer({
        authConfig: { accessToken: 'token-123' },
        customerId: 'cust-1',
      });

      expect(sdk.getCustomerId()).toBe('cust-1');
    });

    it('reflects an updated customer id after setCustomerId', () => {
      const sdk = new Towncryer({ authConfig: { accessToken: 'token-123' } });

      sdk.setCustomerId('cust-2');

      expect(sdk.getCustomerId()).toBe('cust-2');
    });
  });
});
