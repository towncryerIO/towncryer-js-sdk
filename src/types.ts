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

// API Response interfaces
export interface ApiResponse {
    code?: string;
    message: string;
    data?: object;
}

export interface ScheduleResponse {
    id: string;
    status: string;
}

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
