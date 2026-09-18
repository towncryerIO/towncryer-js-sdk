import { TowncryerMessageService } from '../../src/services/messageService';
import ApiService from '../../src/services/api';
import { TowncryerAPIError } from '../../src/errors';
import { SendBulkMessagesPayload } from '@towncryerio/towncryer-js-api-client';

describe('TowncryerMessageService', () => {
  const sendMessage = jest.fn();
  let apiService: ApiService;
  let service: TowncryerMessageService;

  const payload: SendBulkMessagesPayload = {
    emails: [{ recipients: [{ name: 'A B', email: 'a@b.com' }] }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    apiService = {
      getApi: jest.fn().mockReturnValue({ sendMessage }),
    } as unknown as ApiService;
    service = new TowncryerMessageService(apiService);
  });

  it('requests the message API from the api service', () => {
    expect(apiService.getApi).toHaveBeenCalledWith('message');
  });

  it('resolves with the response data on success', async () => {
    const scheduleInfo = { jobId: 'job-1', status: 'queued' };
    sendMessage.mockResolvedValue({ data: scheduleInfo });

    const result = await service.sendMessages(payload);

    expect(sendMessage).toHaveBeenCalledWith(payload);
    expect(result).toBe(scheduleInfo);
  });

  it('wraps a rejected request into a TowncryerAPIError', async () => {
    sendMessage.mockRejectedValue({
      isAxiosError: true,
      message: 'Request failed',
      response: { status: 500, data: { message: 'Downstream failure' } },
    });

    await expect(service.sendMessages(payload)).rejects.toMatchObject({
      name: 'TowncryerAPIError',
      status: 500,
      message: 'Downstream failure',
    });
  });

  it('rejects with a TowncryerAPIError for non-axios failures', async () => {
    sendMessage.mockRejectedValue(new Error('boom'));

    await expect(service.sendMessages(payload)).rejects.toBeInstanceOf(TowncryerAPIError);
  });
});
