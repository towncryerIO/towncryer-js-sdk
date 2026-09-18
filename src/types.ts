export interface AuthConfig {
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
}

export interface RetryConfig {
    /** Maximum number of retry attempts for retryable errors. Defaults to 3. */
    maxRetries?: number;
    /** HTTP status codes that should trigger a retry. Defaults to [429, 500, 502, 503, 504]. */
    retryableStatusCodes?: number[];
}

export interface Config {
    organisationId?: string;
    customerId?: string;
    authConfig: AuthConfig;
    firebase?: FirebaseConfig;
    /** Base URL for the Towncryer API. Defaults to the production API URL. */
    baseUrl?: string;
    /** Request timeout in milliseconds. Defaults to 30000. */
    timeout?: number;
    /** Retry behavior for failed requests (5xx, 429, network errors). */
    retryConfig?: RetryConfig;
}

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    messagingSenderId: string;
    appId: string;
    storageBucket: string;
    measurementId: string;
    vapidKey?: string;
}

// `ApiResponse` is defined by the generated API client, not hand-maintained
// here, so there is a single source of truth for the shape of a response.
export type { ApiResponse } from '@towncryerio/towncryer-js-api-client';

/**
 * @deprecated Predates the current bulk-message API and is not used by `sendMessages`
 * (which takes `SendSMSPayload` from `@towncryerio/towncryer-js-api-client` instead). Kept
 * only for backward compatibility with existing imports.
 */
export interface SMSOptions {
    body: string;
    recipients: string[];
}

// Contact Form Data Interface
export interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
    metadata?: object;
}

// Email Subscription Options Interface
export interface EmailSubscriptionOptions {
    firstName?: string;
    lastName?: string;
    source?: string;
    preferences?: string[];
    metadata?: object;
}

// Push Notification Models
export interface PushNotification {
    id: string;
    title: string;
    body: string;
    data?: object;
    imageUrl?: string;
    timestamp: number;
    read: boolean;
}

export interface PushNotificationStats {
    total: number;
    unread: number;
    lastUpdated: number;
}
