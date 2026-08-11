import { AxiosError } from 'axios';
import { ApiError } from '@towncryerio/towncryer-js-api-client';
import { TowncryerAPIError } from '../errors';

function isAxiosError(error: unknown): error is AxiosError<ApiError> {
  return typeof error === 'object' && error !== null && (error as AxiosError).isAxiosError === true;
}

/**
 * Standard error handler for API calls. Normalizes any thrown value into a
 * `TowncryerAPIError` so callers only ever need to check against one type.
 * @param error The caught error
 * @returns A TowncryerAPIError instance
 */
export function handleApiError(error: unknown): TowncryerAPIError {
  if (error instanceof TowncryerAPIError) {
    return error;
  }

  if (isAxiosError(error)) {
    const apiError = error.response?.data;
    const status = error.response?.status ?? 500;
    const message = apiError?.message || error.message || 'An unknown error occurred';
    return new TowncryerAPIError(message, status, apiError?.code, apiError?.errors);
  }

  if (error instanceof Error) {
    return new TowncryerAPIError(error.message);
  }

  return new TowncryerAPIError(`Error processing API request: ${String(error)}`);
}
