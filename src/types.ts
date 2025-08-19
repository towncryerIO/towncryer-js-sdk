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
    code: string;
    message: string;
    data?: any;
}

export interface ScheduleResponse {
    id: string;
    status: string;
}

export interface EventData {
    name: string;
    customer: {
        customerId: string;
        firstName: string;
        lastName: string;
    };
    data?: Record<string, any>;
}

// Message interfaces
export interface BulkMessageOptions {
    emails?: EmailOptions[];
    pushNotifications?: PushNotificationOptions[];
    smses?: SMSOptions[];
}

export interface EmailOptions {
    title: string;
    body: string;
    recipients: string[];
    templateId?: string;
    data?: Record<string, any>;
}

export interface PushNotificationOptions {
    title: string;
    body: string;
    recipients: string[];
    data?: Record<string, any>;
    imageUrl?: string;
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
    metadata?: Record<string, any>; // Additional custom fields
}

// Email Subscription Options Interface
export interface EmailSubscriptionOptions {
    firstName?: string;
    lastName?: string;
    source?: string; // Where the subscription came from e.g. 'newsletter_popup', 'footer_form'
    preferences?: string[]; // E.g. 'marketing', 'product_updates'
    metadata?: Record<string, any>; // Additional custom fields
}

// Push Notification Models
export interface PushNotification {
    id: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    imageUrl?: string;
    timestamp: number;
    read: boolean;
}

export interface PushNotificationStats {
    total: number;
    unread: number;
    lastUpdated: number;
}
