import { ApiError } from '@towncryerio/towncryer-js-api-client';

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
