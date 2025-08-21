import { MessagesApi, ScheduleInfo, SendBulkMessagesPayload } from '@towncryerio/towncryer-js-api-client';
import { apiService } from './api';

/**
 * Message Service Interface
 */
export interface MessageService {
    /**
     * Send bulk messages (email, push, SMS)
     * @param messages Bulk message options
     */
    sendMessages(messages: SendBulkMessagesPayload): Promise<ScheduleInfo>;
}

/**
 * Message Service Implementation
 */
export class TowncryerMessageService implements MessageService {
  private messagesApi: MessagesApi;
    
  constructor() {
    this.messagesApi = apiService.getApi('message');
  }
    
  /**
     * Send bulk messages
     * @param messages Bulk message options
     * @returns Response data from the message sending operation
     * @throws Error if message sending fails
     */
  async sendMessages(messages: SendBulkMessagesPayload): Promise<ScheduleInfo> {
    try {
      const response = await this.messagesApi.sendMessage(messages);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send messages: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}