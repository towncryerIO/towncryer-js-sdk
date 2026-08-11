jest.mock('../src/services/api', () => ({
  apiService: {
    setBaseUrl: jest.fn(),
    setOrganisationId: jest.fn(),
    setToken: jest.fn(),
    setTokenAndOrganisationId: jest.fn(),
    setRefreshToken: jest.fn(),
    setApiKey: jest.fn(),
    getApi: jest.fn(() => ({})),
  },
}));

import { Towncryer } from '../src/towncryerSDK';
import { apiService } from '../src/services/api';

const mockedSetApiKey = apiService.setApiKey as jest.Mock;

describe('Towncryer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ready()', () => {
    it('resolves immediately when constructed with an access token', async () => {
      const client = new Towncryer({
        authConfig: { accessToken: 'token-123' },
      });

      await expect(client.ready()).resolves.toBeUndefined();
    });

    it('resolves immediately when constructed without auth config', async () => {
      const client = new Towncryer({
        authConfig: {},
      });

      await expect(client.ready()).resolves.toBeUndefined();
    });

    it('does not resolve until the api key exchange completes', async () => {
      let resolveSetApiKey!: () => void;
      mockedSetApiKey.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveSetApiKey = resolve;
        })
      );

      const client = new Towncryer({
        authConfig: { apiKey: 'api-key-123' },
      });

      let resolved = false;
      client.ready().then(() => {
        resolved = true;
      });

      await Promise.resolve();
      await Promise.resolve();
      expect(resolved).toBe(false);

      resolveSetApiKey();
      await client.ready();
      expect(resolved).toBe(true);
    });

    it('rejects if the api key exchange fails', async () => {
      const error = new Error('boom');
      mockedSetApiKey.mockRejectedValue(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const client = new Towncryer({
        authConfig: { apiKey: 'api-key-123' },
      });

      await expect(client.ready()).rejects.toThrow('boom');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
