import { TowncryerCustomerService } from '../../src/services/customerService';
import ApiService from '../../src/services/api';
import { TowncryerAPIError } from '../../src/errors';
import { CreateCustomerRequest } from '@towncryerio/towncryer-js-api-client';

describe('TowncryerCustomerService', () => {
  const createCustomer = jest.fn();
  let apiService: ApiService;
  let service: TowncryerCustomerService;

  beforeEach(() => {
    jest.clearAllMocks();
    apiService = {
      getApi: jest.fn().mockReturnValue({ createCustomer }),
    } as unknown as ApiService;
    service = new TowncryerCustomerService(apiService);
  });

  it('requests the customer API from the api service', () => {
    expect(apiService.getApi).toHaveBeenCalledWith('customer');
  });

  it('resolves with the response body from the generated client on success', async () => {
    const apiResponseBody = { code: '200', message: 'Success', data: { id: 'cust-1' } };
    createCustomer.mockResolvedValue({ data: apiResponseBody });

    const payload: CreateCustomerRequest = {
      identities: [{ type: 'email', value: 'a@b.com' }],
      source: 'TowncryerAPI',
    };
    const result = await service.createCustomer(payload);

    expect(createCustomer).toHaveBeenCalledWith(payload);
    expect(result).toBe(apiResponseBody);
  });

  it('wraps a rejected request into a TowncryerAPIError', async () => {
    const axiosError = {
      isAxiosError: true,
      message: 'Request failed',
      response: {
        status: 422,
        data: { code: 'VALIDATION_ERROR', message: 'Invalid customer payload' },
      },
    };
    createCustomer.mockRejectedValue(axiosError);

    await expect(
      service.createCustomer({
        identities: [{ type: 'email', value: 'a@b.com' }],
        source: 'TowncryerAPI',
      })
    ).rejects.toMatchObject({
      name: 'TowncryerAPIError',
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Invalid customer payload',
    });
  });

  it('rejects with a TowncryerAPIError for non-axios failures', async () => {
    createCustomer.mockRejectedValue(new Error('boom'));

    await expect(
      service.createCustomer({
        identities: [{ type: 'email', value: 'a@b.com' }],
        source: 'TowncryerAPI',
      })
    ).rejects.toBeInstanceOf(TowncryerAPIError);
  });
});
