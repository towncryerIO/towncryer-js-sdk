# Towncryer SDK Data Models

This document provides a detailed reference of the data models used in the Towncryer TypeScript SDK.

## Table of Contents
- [Authentication](#authentication)
- [Configuration](#configuration)
- [Customer Data](#customer-data)
- [Event Data](#event-data)
- [Messaging](#messaging)
  - [Email](#email)
  - [Push Notifications](#push-notifications)
  - [SMS](#sms)
- [Contact Forms](#contact-forms)
- [Email Subscriptions](#email-subscriptions)

## Authentication

```typescript
interface AuthConfig {
    // API Key for service-to-service authentication
    apiKey?: string;
    // Access token for authenticated requests
    accessToken?: string;
    // Refresh token for obtaining new access tokens
    refreshToken?: string;
}
```

## Configuration

```typescript
interface Config {
    // Organization ID for multi-tenant applications
    organisationId?: string;
    // Current customer ID for user-specific operations
    customerId?: string;
    // Authentication configuration
    authConfig: AuthConfig;
    // Firebase configuration for push notifications
    firebase?: FirebaseConfig;
}

interface FirebaseConfig {
    // Firebase API key
    apiKey: string;
    // Firebase auth domain
    authDomain: string;
    // Firebase project ID
    projectId: string;
    // Firebase messaging sender ID
    messagingSenderId: string;
    // Firebase app ID
    appId: string;
    // Firebase storage bucket
    storageBucket: string;
    // Optional: Firebase measurement ID
    measurementId?: string;
    // Optional: VAPID key for web push
    vapidKey?: string;
}
```

## API Response

```typescript
interface ApiResponse {
    // Response status code
    code: string;
    // Human-readable response message
    message: string;
    // Response data (type varies by endpoint)
    data?: any;
}

interface ScheduleResponse {
    // Unique identifier for the scheduled operation
    id: string;
    // Current status of the operation
    status: string;
}
```

## Customer Data

```typescript
interface CreateCustomerRequest {
    // Required customer information
    customerId: string;        // Your internal customer ID
    firstName: string;         // Customer's first name
    lastName: string;          // Customer's last name
    
    // Optional contact information
    email?: string;            // Customer's email address
    phoneNumber?: string;      // Customer's phone number (E.164 format)
    
    // Additional metadata
    metadata?: Record<string, any>; // Custom key-value pairs
}
```

## Event Data

```typescript
interface EventData {
    // Required fields
    name: string;              // Event name/type (e.g., 'user.login', 'purchase.completed')
    customer: {
        customerId: string;    // Your internal customer ID
        firstName: string;     // Customer's first name
        lastName: string;      // Customer's last name
    };
    
    // Optional event-specific data
    data?: Record<string, any>; // Additional event data as key-value pairs
}
```

## Messaging

### Email

```typescript
interface EmailOptions {
    // Required fields
    title: string;            // Email subject line
    body: string;             // Email body content (HTML supported)
    recipients: string[];      // Array of recipient email addresses
    
    // Optional fields
    templateId?: string;      // ID of email template to use
    data?: Record<string, any>; // Template variables and additional data
}
```

### Push Notifications

```typescript
interface PushNotificationOptions {
    // Required fields
    title: string;            // Notification title
    body: string;             // Notification message body
    recipients: string[];      // Array of recipient user IDs or push tokens
    
    // Optional fields
    data?: Record<string, any>; // Additional data payload
    imageUrl?: string;         // URL of an image to display in the notification
}

interface PushNotification {
    id: string;               // Unique notification ID
    title: string;            // Notification title
    body: string;             // Notification message body
    data?: Record<string, any>; // Additional data payload
    imageUrl?: string;        // URL of an image to display
    timestamp: number;        // Unix timestamp of when the notification was sent
    read: boolean;            // Whether the notification has been read
}

interface PushNotificationStats {
    total: number;            // Total number of notifications
    unread: number;           // Number of unread notifications
    lastUpdated: number;      // Unix timestamp of last update
}
```

### SMS

```typescript
interface SMSOptions {
    // Required fields
    body: string;             // SMS message content
    recipients: string[];      // Array of recipient phone numbers (E.164 format)
}
```

## Contact Forms

```typescript
interface ContactFormData {
    // Required fields
    name: string;             // Contact's full name
    email: string;            // Contact's email address
    subject: string;          // Subject of the contact form
    message: string;          // Message content
    
    // Optional metadata
    metadata?: Record<string, any>; // Additional custom fields
}
```

## Email Subscriptions

```typescript
interface EmailSubscriptionOptions {
    // Optional subscriber information
    firstName?: string;       // Subscriber's first name
    lastName?: string;        // Subscriber's last name
    
    // Subscription details
    source?: string;          // Source of the subscription (e.g., 'newsletter_popup')
    preferences?: string[];   // Subscription preferences (e.g., ['marketing', 'product_updates'])
    
    // Additional metadata
    metadata?: Record<string, any>; // Custom key-value pairs
}
```

## Error Handling

All API methods return either an `ApiResponse` or an `ApiError`:

```typescript
interface ApiError {
    // Error code (e.g., 'UNAUTHORIZED', 'VALIDATION_ERROR')
    code: string;
    // Human-readable error message
    message: string;
    // Optional additional error details
    details?: any;
}
```
```typescript
export interface PushNotificationOptions {
    // Fields
    title: string;            // Notification title
    content: string;          // Notification body
    templateId?: string;      // Optional template ID
    data?: Record<string, any>; // Additional data payload
    
    // Recipients
    recipients: PushNotificationRecipient[];
}

export interface PushNotificationRecipient {
    token: string;           // Firebase FCM token
    context?: Record<string, any>; // Template variables
}
```

### SMS

**OpenAPI Schema: `SendSMSPayload`**

```typescript
export interface SMSOptions {
    // Fields
    content: string;         // SMS content
    from?: string;           // Sender phone number or identity
    templateId?: string;     // Optional template ID
    
    // Recipients
    recipients: SMSRecipient[];
}

export interface SMSRecipient {
    phoneNumber: string;
    context?: Record<string, any>; // Template variables
}
```

## Response Models

### API Response

**OpenAPI Schema: `ApiResponse`**

```typescript
export interface ApiResponse<T = any> {
    code: string;
    message: string;
    data?: T;
}
```

### Schedule Response

**OpenAPI Schema: `ScheduleResponse`**

```typescript
export interface ScheduleResponse {
    id: string;              // Job ID
    status: JobStatus;       // Job status
}

export type JobStatus = 'pending' | 'queued' | 'processing' | 'completed';
```

## Additional Considerations

### EventsAPI with Query Parameters

Based on the provided memory, the backend now supports additional parameters for listing events:

```typescript
export interface EventListParams {
    page?: number;           // Page number for pagination
    size?: number;           // Page size for pagination
    query?: string;          // Event name search (ILIKE)
    dateFilter?: string;     // Date filter for events
}
```

These parameters should be considered when implementing the events-related methods in the SDK, even though they may not be directly visible in the current OpenAPI specification.

## Implementation Notes

1. All customer-facing SDK methods should use these interfaces for type safety
2. The SDK should convert between these models and the auto-generated API client models
3. Helper methods should compose these models to provide an easy-to-use developer experience
