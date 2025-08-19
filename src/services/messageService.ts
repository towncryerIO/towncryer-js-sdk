import { ScheduleResponse } from '../types';
import { MessagesApi, SendBulkMessagesPayload } from '@towncryerio/towncryer-js-api-client';
import ApiService from './api';

/**
 * Message Service Interface
 */
export interface MessageService {
    /**
     * Send bulk messages (email, push, SMS)
     * @param messages Bulk message options
     */
    sendMessages(messages: SendBulkMessagesPayload): Promise<ScheduleResponse>;
}

/**
 * Message Service Implementation
 */
export class TowncryerMessageService implements MessageService {
    private messagesApi: MessagesApi;
    
    constructor() {
        this.messagesApi = ApiService.getApi("message");
    }
    
    /**
     * Send bulk messages
     * @param messages Bulk message options
     * @returns Response data from the message sending operation
     * @throws Error if message sending fails
     */
    async sendMessages(messages: SendBulkMessagesPayload): Promise<any> {
        try {
            const response = await this.messagesApi.sendMessage(messages);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to send messages: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}