# Towncryer SDK Data Models

This document provides a detailed reference of the data models used in the Towncryer TypeScript SDK.

Types in this document come from two places:

- **`src/types.ts`** — SDK-specific types, exported directly from the package root.
- **`@towncryerio/towncryer-js-api-client`** — the generated API client package (a dependency
  of this SDK, not re-exported by it). Request/response payloads for `createCustomer`,
  `publishEvent`, and `sendMessages` come from here; import them directly from
  `@towncryerio/towncryer-js-api-client` if you need to reference the types explicitly.

## Table of Contents
- [Authentication & Configuration](#authentication--configuration)
- [API Response](#api-response)
- [Customer Data](#customer-data)
- [Event Data](#event-data)
- [Messaging](#messaging)
  - [Email](#email)
  - [Push Notifications](#push-notifications)
  - [SMS](#sms)
- [Contact Forms](#contact-forms)
- [Email Subscriptions](#email-subscriptions)

## Authentication & Configuration

`src/types.ts`

```typescript
interface AuthConfig {
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
}

interface RetryConfig {
    // Maximum number of retry attempts for retryable errors. Defaults to 3.
    maxRetries?: number;
    // HTTP status codes that should trigger a retry. Defaults to [429, 500, 502, 503, 504].
    retryableStatusCodes?: number[];
}

interface Config {
    organisationId?: string;
    customerId?: string;
    authConfig: AuthConfig;
    // Base URL for the Towncryer API. Defaults to https://api.towncryer.io/api/v1.
    baseUrl?: string;
    // Request timeout in milliseconds. Defaults to 30000.
    timeout?: number;
    // Retry behavior for failed requests (5xx, 429, network errors).
    retryConfig?: RetryConfig;
}
```

## API Response

`ApiResponse` is re-exported from `src/types.ts`, but defined by
`@towncryerio/towncryer-js-api-client` — there is a single definition of it in use, rather
than a hand-maintained copy that can drift from the generated one:

```typescript
interface ApiResponse {
    code?: string;
    message?: string;
    data?: object;
}
```

`ScheduleInfo`, returned by `sendMessages`, also comes from
`@towncryerio/towncryer-js-api-client`:

```typescript
interface ScheduleInfo {
    jobId?: string;
    status?: TypesJobStatus; // 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
}
```

## Customer Data

`CreateCustomerRequest`, from `@towncryerio/towncryer-js-api-client`, is the payload for
`towncryerClient.createCustomer(...)`:

```typescript
interface CreateCustomerRequest {
    externalId?: string;        // Your internal customer ID
    firstName?: string;
    lastName?: string;
    identities: CustomerIdentityRequest[];
    source: TypesChannelCustomerCreatedFrom; // 'WhatsApp' | 'Event' | 'CSVUpload' | 'TowncryerWebappForm' | 'TowncryerAPI'
}

interface CustomerIdentityRequest {
    type: 'email' | 'phone' | 'push_token' | 'external_id';
    value: string;
    isPrimary?: boolean;
}
```

## Event Data

`PublishEventPayload`, from `@towncryerio/towncryer-js-api-client`, is the payload for
`towncryerClient.publishEvent(...)`:

```typescript
interface PublishEventPayload {
    name: string;                    // Event name/type (e.g., 'product_viewed')
    customer: EventCustomerRequest;
    description?: string;
    data?: object;                   // Additional event data as key-value pairs
}

interface EventCustomerRequest {
    externalId: string;              // Your internal customer ID
    email?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    pushNotificationToken?: string;
}
```

## Messaging

`sendMessages(payload: SendBulkMessagesPayload): Promise<ScheduleInfo>` sends emails, push
notifications, and SMS in a single call. All model types below come from
`@towncryerio/towncryer-js-api-client`.

```typescript
interface SendBulkMessagesPayload {
    emails?: SendEmailPayload[];
    pushNotifications?: SendPushNotificationPayload[];
    smses?: SendSMSPayload[];
}
```

### Email

```typescript
interface SendEmailPayload {
    title?: string;
    content?: string;
    from?: EmailFrom;
    templateId?: string;
    recipients: EmailRecipient[];
}

interface EmailFrom {
    name: string;
    email: string;
}

interface EmailRecipient {
    email: string;
    name: string;
    context?: object; // Template variables
}
```

### Push Notifications

```typescript
interface SendPushNotificationPayload {
    title?: string;
    content?: string;
    templateId?: string;
    data?: object;
    recipients: SendPushNotificationRecipient[];
}

interface SendPushNotificationRecipient {
    token: string; // Firebase FCM token
    context?: object; // Template variables
}
```

These cover sending push notifications through `sendMessages`. Receiving/tracking notifications
on the client (permission requests, Firebase Cloud Messaging setup, notification history) is not
part of this SDK — see `@towncryerio/towncryer-react-sdk`, which has its own `PushNotification`
and `PushNotificationStats` types for that.

### SMS

```typescript
interface SendSMSPayload {
    content?: string;
    from: string;          // Sender phone number or identity
    templateId?: string;
    to: SendSMSRecipient[];
}

interface SendSMSRecipient {
    phoneNumber: string;
    context?: object; // Template variables
}
```

`src/types.ts` also exports a standalone `SMSOptions` interface (`{ body, recipients }`), but
it is not used by `sendMessages` — it predates the current bulk-message API and is kept only
for backward compatibility with existing imports.

## Contact Forms

`src/types.ts` — payload for `towncryerClient.submitContactForm(...)`:

```typescript
interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
    metadata?: object;
}
```

## Email Subscriptions

`src/types.ts` — options for `towncryerClient.subscribeToEmails(email, options)`:

```typescript
interface EmailSubscriptionOptions {
    firstName?: string;
    lastName?: string;
    source?: string;
    preferences?: string[];
    metadata?: object;
}
```

## Error Handling

Every public SDK method rejects with a single `TowncryerAPIError` on failure, exported from
`src/errors.ts`:

```typescript
class TowncryerAPIError extends Error {
    readonly status: number;
    readonly code?: string | number;
    readonly errors?: object;
}
```
