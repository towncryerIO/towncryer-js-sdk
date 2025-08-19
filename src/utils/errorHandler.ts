import { ApiError, ApiResponse as ClientApiResponse } from '@towncryerio/towncryer-js-api-client';
import { ApiResponse as SdkApiResponse } from '../types';

/**
 * Standard error handler for API calls that converts any error to an ApiError format
 * @param error The caught error
 * @returns Standardized ApiError object
 */
export function handleApiError(error: unknown): ApiError {
    if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
        return error as ApiError;
    } else {
        return {
            status: 500,
            message: `Error processing API request: ${error instanceof Error ? error.message : String(error)}`,
            name: 'ApiError'
        } as ApiError;
    }
}

/**
 * Standardizes API responses to ensure they match the SDK's ApiResponse interface
 * This handles conversion between the API client's response format and the SDK's expected format
 * 
 * @param response Response from API client
 * @returns Standardized SDK ApiResponse
 */
export function standardizeApiResponse(response: any): SdkApiResponse {
    if (!response) {
        return {
            code: '500',
            message: 'Empty response received from API'
        };
    }
    
    if (typeof response === 'object' && response.code && response.message) {
        return response as SdkApiResponse;
    }
    
    if (typeof response === 'object' && 'data' in response) {
        const responseData = response.data;
        
        if (responseData && typeof responseData === 'object' && 'code' in responseData && 'message' in responseData) {
            return {
                code: responseData.code || '200',
                message: responseData.message || 'Success',
                data: 'data' in responseData ? responseData.data : undefined
            };
        } else {
            return {
                code: '200',
                message: 'Success',
                data: responseData
            };
        }
    }
    
    if (typeof response === 'object' && ('code' in response || 'message' in response)) {
        return {
            code: response.code || '200',
            message: response.message || 'Success',
            data: 'data' in response ? response.data : undefined
        };
    }
    
    return {
        code: '200',
        message: 'Success',
        data: response
    };
}
