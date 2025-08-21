export interface AuthConfig {
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
}

export interface Config {
    organisationId?: string;
    customerId?: string;
    authConfig: AuthConfig;
    firebase?: FirebaseConfig;
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
