import { MessagesApi, ScheduleInfo, SendBulkMessagesPayload } from '@towncryerio/towncryer-js-api-client';
import ApiService from './api';
import { handleApiError } from '../utils/errorHandler';

/**
 * Message Service
 */
export class MessageService {
  private messagesApi: MessagesApi;
    
  constructor(apiService: ApiService) {
    this.messagesApi = apiService.getApi('message');
  }
    
  /**
     * Send bulk messages
     * @param messages Bulk message options
     * @returns Response data from the message sending operation
     * @throws TowncryerAPIError if message sending fails
     */
  async sendMessages(messages: SendBulkMessagesPayload): Promise<ScheduleInfo> {
    try {
      const response = await this.messagesApi.sendMessage(messages);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}