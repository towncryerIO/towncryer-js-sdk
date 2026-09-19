# Towncryer TypeScript SDK

A TypeScript SDK for integrating with the Towncryer API to manage customer communications. This
SDK provides a developer-friendly interface for event publishing, customer management, and
message delivery. It has no browser-global dependencies, so it can be used anywhere JS runs —
Node, React Native, server-side, or the browser.

Looking for browser push notifications (Firebase Cloud Messaging)? That support lives in
[`@towncryerio/towncryer-react-sdk`](https://github.com/towncryerIO/towncryer-react-sdk), which
builds on top of this SDK.

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
  }
});
```

Every request method (`createCustomer`, `publishEvent`, `sendMessages`, `submitContactForm`,
`subscribeToEmails`) internally awaits any async setup started by the constructor (such as
exchanging an API key for an access token) before firing, so you don't need to await anything
between construction and your first call.

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

## Browser Push Notifications

This SDK is environment-agnostic and has no browser-global dependencies, so Firebase Cloud
Messaging (FCM) integration — permission requests, token registration, receiving notifications,
and notification history — lives in
[`@towncryerio/towncryer-react-sdk`](https://github.com/towncryerIO/towncryer-react-sdk)
instead. That package builds on top of this SDK's `getEventService()`, `getMessagesApi()`, and
`getCustomerId()` accessors; see its README for setup.

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

- `Config`, `AuthConfig`, `RetryConfig`: SDK setup and authentication
- `ApiResponse`: Response shape, re-exported from `@towncryerio/towncryer-js-api-client` so
  there is a single definition of it in use
- `ContactFormData`: Structure for contact form submissions
- `EmailSubscriptionOptions`: Options for email subscriptions
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
