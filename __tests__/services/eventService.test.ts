import { EventService } from '../../src/services/eventService';
import ApiService from '../../src/services/api';
import { TowncryerAPIError } from '../../src/errors';
import { PublishEventPayload } from '@towncryerio/towncryer-js-api-client';

describe('EventService', () => {
  const accept = jest.fn();
  let apiService: ApiService;
  let service: EventService;

  const payload: PublishEventPayload = {
    name: 'signup',
    customer: { externalId: 'cust-1' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    apiService = {
      getApi: jest.fn().mockReturnValue({ accept }),
    } as unknown as ApiService;
    service = new EventService(apiService);
  });

  it('requests the event API from the api service', () => {
    expect(apiService.getApi).toHaveBeenCalledWith('event');
  });

  it('normalizes a successful response into a standard ApiResponse', async () => {
    accept.mockResolvedValue({ data: { eventId: 'evt-1' } });

    const result = await service.publishEvent(payload);

    expect(accept).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ code: '200', message: 'Success', data: { eventId: 'evt-1' } });
  });

  it('wraps a rejected request into a TowncryerAPIError', async () => {
    accept.mockRejectedValue({
      isAxiosError: true,
      message: 'Request failed',
      response: { status: 400, data: { message: 'Invalid event' } },
    });

    await expect(service.publishEvent(payload)).rejects.toMatchObject({
      name: 'TowncryerAPIError',
      status: 400,
      message: 'Invalid event',
    });
  });

  it('rejects with a TowncryerAPIError for non-axios failures', async () => {
    accept.mockRejectedValue('nope');

    await expect(service.publishEvent(payload)).rejects.toBeInstanceOf(TowncryerAPIError);
  });
});
