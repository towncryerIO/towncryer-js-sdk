import { ApiResponse } from '../types';
import { EventsApi, PublishEventPayload } from '@towncryerio/towncryer-js-api-client';
import { handleApiError } from '../utils/errorHandler';
import { apiService } from './api';

/**
 * Event Service Interface
 */
export interface EventService {
    /**
     * Publish an event to Towncryer
     * @param eventPayload Event payload data
     */
    publishEvent(eventPayload: PublishEventPayload): Promise<ApiResponse>;
}


/**
 * Event implementation using Towncryer API
 */
export class TowncryerEventService implements EventService {
  private eventsApi: EventsApi;

  constructor() {
    this.eventsApi = apiService.getApi('event');
  }

  /**
     * Publish an event to Towncryer
     * @param eventPayload Event payload data
     * @returns Standardized API response
     * @throws TowncryerAPIError if the request fails
     */
  async publishEvent(eventPayload: PublishEventPayload): Promise<ApiResponse> {
    try {
      const response = await this.eventsApi.accept(eventPayload);
      return {
        code: '200',
        message: 'Success',
        data: response.data
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }
}
