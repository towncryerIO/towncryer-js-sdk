/**
 * Testing utilities for consumers of this SDK.
 *
 * These live in the package so a consumer application testing its own code
 * against `ITowncryer` doesn't have to reverse-engineer the SDK's internal
 * shape (including the generated API client types it wraps) or hand-write
 * `jest.mock('@towncryerio/towncryer-js-sdk', ...)` against undocumented
 * internals.
 */

import { ApiResponse, ScheduleInfo } from '@towncryerio/towncryer-js-api-client';
import { EventService } from './services/eventService';
import { ITowncryer } from './towncryerSDK';

const DEFAULT_API_RESPONSE: ApiResponse = { code: '200', message: 'OK', data: {} };
const DEFAULT_SCHEDULE_INFO: ScheduleInfo = { jobId: 'mock-job-id' };

/**
 * Per-method overrides for {@link createMockTowncryerClient}. Every field is
 * optional; anything not provided falls back to a stub that resolves with a
 * benign default value (or, for synchronous void methods, does nothing).
 *
 * Pass plain functions to stub return values, or `jest.fn()`-wrapped
 * functions (e.g. `jest.fn().mockResolvedValue(...)`) if you want to make
 * assertions like `toHaveBeenCalledWith` on the mock.
 */
export type MockTowncryerClientOverrides = Partial<ITowncryer>;

/**
 * Create a fake, `ITowncryer`-shaped client for use in a consumer's own test
 * suite, in place of a real `Towncryer` instance.
 *
 * Every method has a working default (see {@link MockTowncryerClientOverrides}),
 * so you only need to override the methods your test actually exercises.
 *
 * @example
 * ```ts
 * const client = createMockTowncryerClient({
 *   publishEvent: jest.fn().mockResolvedValue({ code: '200', message: 'OK' }),
 * });
 *
 * await myFeatureThatTakesAClient(client);
 *
 * expect(client.publishEvent).toHaveBeenCalledWith(
 *   expect.objectContaining({ name: 'user.signed_up' })
 * );
 * ```
 */
export function createMockTowncryerClient(
  overrides: MockTowncryerClientOverrides = {}
): ITowncryer {
  return {
    createCustomer: async () => ({ ...DEFAULT_API_RESPONSE }),
    publishEvent: async () => ({ ...DEFAULT_API_RESPONSE }),
    sendMessages: async () => ({ ...DEFAULT_SCHEDULE_INFO }),
    submitContactForm: async () => ({ ...DEFAULT_API_RESPONSE }),
    subscribeToEmails: async () => ({ ...DEFAULT_API_RESPONSE }),
    setAccessToken: () => undefined,
    setRefreshToken: () => undefined,
    setCustomerId: () => undefined,
    getEventService: () => ({} as EventService),
    getMessagesApi: () => ({} as ReturnType<ITowncryer['getMessagesApi']>),
    getCustomerId: () => '',
    ...overrides
  };
}
