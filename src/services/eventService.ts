import { ApiResponse } from '../types';
import { ApiError, EventsApi, PublishEventPayload } from '@towncryerio/towncryer-js-api-client';
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
    publishEvent(eventPayload: PublishEventPayload): Promise<ApiResponse|ApiError>;
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
     * @throws ApiError if the request fails
     */
  async publishEvent(eventPayload: PublishEventPayload): Promise<ApiResponse> {
    try {
      const response = await this.eventsApi.accept(eventPayload);
      // Directly return the response data if it matches our ApiResponse interface
      if (response.data && typeof response.data === 'object' && 'message' in response.data) {
        return {
          code: '200',
          message: 'Success',
          data: response.data
        };
      }
      return {
        code: '200',
        message: 'Success',
        data: response.data
      };
    } catch (error) {
      const apiError = handleApiError(error);
      return {
        code: '500',
        message: apiError.message || 'An unknown error occurred'
      };
    }
  }
}
