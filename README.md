# Towncryer TypeScript SDK

A TypeScript SDK for integrating with the Towncryer API to manage customer communications in web applications. This SDK provides a developer-friendly interface for event publishing, customer management, message delivery, and push notification handling.

## Features

- **Customer Management**
  - Create and update customer profiles
  - Store customer preferences and metadata

- **Event Publishing**
  - Track user activities and behavior
  - Publish custom events with arbitrary data

- **Multi-channel Messaging**
  - Send emails with templates and personalization
  - Deliver SMS messages to registered phone numbers
  - Send push notifications to registered devices
  - Schedule messages for future delivery

- **Push Notification Handling**
  - Firebase Cloud Messaging (FCM) integration
  - Permission request and token management
  - Notification display and user interaction
  - Message history and read/unread status

- **Helper Utilities**
  - Contact form submission handling
  - Email subscription management
  - Common integration patterns for web apps

## Installation

```bash
npm install @volvlabs/towncryer-sdk
```

## Basic Usage

```typescript
import { Towncryer } from '@volvlabs/towncryer-sdk';

// Initialize the SDK with your API credentials
const towncryerClient = new Towncryer({
  organisationId: 'your-organisation-id',
  authConfig: {
    apiKey: 'your-api-key',
  },
  // Optional: base URL, timeout, and retry behavior (all have sane defaults)
  baseUrl: 'https://api.towncryer.io/api/v1',
  timeout: 30000,
  retryConfig: {
    maxRetries: 3,
    retryableStatusCodes: [429, 500, 502, 503, 504]
  },
  // Optional Firebase configuration for push notifications
  firebase: {
    apiKey: 'firebase-api-key',
    authDomain: 'your-app.firebaseapp.com',
    projectId: 'your-project-id',
    messagingSenderId: 'sender-id',
    appId: 'app-id',
    storageBucket: 'your-app.appspot.com',
    measurementId: 'measurement-id'
  }
});

// If a Firebase config was provided, initialize push notification support
towncryerClient.initialize();
```

Every request method (`createCustomer`, `publishEvent`, `sendMessages`, `submitContactForm`,
`subscribeToEmails`, `registerPushToken`) internally awaits any async setup started by the
constructor (such as exchanging an API key for an access token) before firing, so you don't
need to await anything between construction and your first call.

## Customer Management

Create or update a customer:

```typescript
const response = await towncryerClient.createCustomer({
  externalId: 'customer-123', // Your internal customer ID
  firstName: 'John',
  lastName: 'Doe',
  source: 'TowncryerAPI',
  identities: [
    { type: 'email', value: 'john.doe@example.com', isPrimary: true },
    { type: 'phone', value: '+1234567890' }
  ]
});
```

## Publishing Events

Track user activities with custom events:

```typescript
const response = await towncryerClient.publishEvent({
  name: 'product_viewed',
  customer: {
    externalId: 'customer-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com'
  },
  data: {
    productId: 'prod-456',
    productName: 'Awesome Product',
    price: 99.99
  }
});
```

## Sending Messages

Messages are sent in bulk through a single `sendMessages` call — pass whichever of
`emails`, `pushNotifications`, and `smses` you need. It returns a `ScheduleInfo` with the
job's `jobId` and `status`, since delivery happens asynchronously.

```typescript
const scheduleInfo = await towncryerClient.sendMessages({
  emails: [
    {
      title: 'Welcome to Our Service',
      content: '<h1>Welcome!</h1><p>Thank you for signing up.</p>',
      from: {
        name: 'Your Company',
        email: 'noreply@yourcompany.com'
      },
      recipients: [
        {
          email: 'john.doe@example.com',
          name: 'John Doe',
          context: {
            username: 'johndoe'
          }
        }
      ]
    }
  ],
  pushNotifications: [
    {
      title: 'New Message',
      content: 'You have a new message from Customer Support',
      recipients: [
        {
          token: 'firebase-fcm-token',
          context: {
            userId: '123'
          }
        }
      ]
    }
  ],
  smses: [
    {
      content: 'Your verification code is: 123456',
      from: '+15555550100',
      to: [
        {
          phoneNumber: '+1234567890',
          context: {
            code: '123456'
          }
        }
      ]
    }
  ]
});

console.log(scheduleInfo.jobId, scheduleInfo.status);
```

## Helper Utilities

### Contact Form Submission

```typescript
const response = await towncryerClient.submitContactForm({
  name: 'John Doe',
  email: 'john.doe@example.com',
  subject: 'Product Inquiry',
  message: 'I would like to learn more about your services.'
});
```

### Email Subscription

```typescript
const response = await towncryerClient.subscribeToEmails('subscriber@example.com', {
  source: 'newsletter_popup',
  preferences: ['product_updates', 'marketing']
});
```

### Register Firebase Push Token

```typescript
const response = await towncryerClient.registerPushToken(
  'customer-123',
  'firebase-fcm-token-xyz'
);
```

## Error Handling

```typescript
try {
  const response = await towncryerClient.publishEvent({
    // event details
  });
  console.log('Event published:', response);
} catch (error) {
  console.error('Failed to publish event:', error.message);
  // Handle specific error cases if needed
}
```

## Firebase Push Notification Integration

`getPushNotificationService()` exposes the push notification service directly for advanced
usage beyond `registerPushToken`. It throws if the SDK was constructed without a `firebase`
config.

### Setting Up Push Notifications

```typescript
// Request permission from the user
const permission = await towncryerClient.getPushNotificationService().requestPermission();
if (permission) {
  console.log('Notification permission granted');
} else {
  console.log('Notification permission denied');
}

// Listen for incoming notifications (when app is in foreground)
towncryerClient.getPushNotificationService().receiveNotifications((notification) => {
  console.log('Received notification:', notification);
  // Handle the notification in your UI
});

// Register a device token with a specific customer
await towncryerClient.registerPushToken('customer-123', 'device-token-from-fcm');
```

### Managing Notifications

```typescript
// Get notification history
const notifications = await towncryerClient.getPushNotificationService().getMessageHistory();

// Get notification statistics
const stats = await towncryerClient.getPushNotificationService().getStats();
console.log(`You have ${stats.unread} unread notifications`);

// Mark a notification as read
await towncryerClient.getPushNotificationService().markRead('notification-id');
```

## Advanced Examples

### Contact Form with Custom Fields

```typescript
await towncryerClient.submitContactForm({
  name: 'Jane Smith',
  email: 'jane@example.com',
  subject: 'Partnership Inquiry',
  message: 'I would like to discuss a potential partnership.',
  metadata: {
    company: 'ABC Corp',
    industry: 'Healthcare',
    employeeCount: 500,
    source: 'partner_page'
  }
});
```

### Email Subscription with Preferences

```typescript
await towncryerClient.subscribeToEmails('subscriber@example.com', {
  firstName: 'Alex',
  lastName: 'Johnson',
  source: 'blog_signup',
  preferences: ['product_updates', 'industry_news', 'webinars'],
  metadata: {
    interests: ['machine_learning', 'data_science'],
    referral: 'google'
  }
});
```

## Type Definitions

This SDK provides TypeScript type definitions for all objects and parameters, exported from
`src/types.ts` and re-exported from the package root:

- `Config`, `AuthConfig`, `RetryConfig`, `FirebaseConfig`: SDK setup and authentication
- `ApiResponse`, `ScheduleResponse`: Response shapes
- `ContactFormData`: Structure for contact form submissions
- `EmailSubscriptionOptions`: Options for email subscriptions
- `PushNotification`, `PushNotificationStats`: Push notification history and stats
- `SMSOptions`: Legacy SMS options shape (not used by `sendMessages`, which takes
  `SendSMSPayload` from `@towncryerio/towncryer-js-api-client` instead)

Request payload types for `createCustomer`, `publishEvent`, and `sendMessages`
(`CreateCustomerRequest`, `PublishEventPayload`, `SendBulkMessagesPayload`, `ScheduleInfo`,
and friends) come from the generated `@towncryerio/towncryer-js-api-client` package — a
dependency of this SDK, not re-exported from it — so import them directly from there if you
need to reference the types explicitly.

## Development

This SDK uses a generated API client based on the Towncryer OpenAPI specification. For local development:

1. Clone the repository
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Test: `npm test`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Commercial - Copyright (c) VolvLabs
