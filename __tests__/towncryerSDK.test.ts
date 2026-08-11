const callOrder: string[] = [];
let resolveSetApiKey!: () => void;
let rejectSetApiKey!: (error: Error) => void;
let acceptMock!: jest.Mock;

class MockApiService {
  setBaseUrl = jest.fn();
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
  default: jest.fn().mockImplementation(() => new MockApiService()),
  DefaultAxiosInstanceFactory: jest.fn(),
}));

import { Towncryer } from '../src/towncryerSDK';

describe('Towncryer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    callOrder.length = 0;
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
});
