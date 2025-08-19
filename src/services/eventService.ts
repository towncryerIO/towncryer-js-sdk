import { ApiResponse } from '../types';
import { ApiError, EventsApi, PublishEventPayload } from '@towncryerio/towncryer-js-api-client';
import { handleApiError, standardizeApiResponse } from '../utils/errorHandler';
import ApiService from './api';
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
        this.eventsApi = ApiService.getApi("event");
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
            // Use standardized response handler to ensure type compatibility
            return standardizeApiResponse(response.data);
        } catch (error) {
            throw handleApiError(error);
        }
    }
}
