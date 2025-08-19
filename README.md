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
  baseUrl: 'https://api.towncryer.io/api/v1',
  apiKey: 'your-api-key',
  secretKey: 'your-api-secret',
  // Optional Firebase configuration for push notifications
  firebase: {
    apiKey: 'firebase-api-key',
    authDomain: 'your-app.firebaseapp.com',
    projectId: 'your-project-id',
    messagingSenderId: 'sender-id',
    appId: 'app-id'
  }
});

// Initialize the SDK (sets up push notifications if Firebase config provided)
await towncryerClient.initialize();
```

## Customer Management

Create or update a customer:

```typescript
const response = await towncryerClient.createCustomer({
  customerId: 'customer-123', // Your internal customer ID
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phoneNumber: '+1234567890'
});
```

## Publishing Events

Track user activities with custom events:

```typescript
const response = await towncryerClient.publishEvent({
  name: 'product_viewed',
  customer: {
    customerId: 'customer-123',
    firstName: 'John',
    lastName: 'Doe'
  },
  data: {
    productId: 'prod-456',
    productName: 'Awesome Product',
    price: 99.99
  }
});
```

## Sending Messages

### Send an Email

```typescript
const response = await towncryerClient.sendEmail({
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
});
```

### Send a Push Notification

```typescript
const response = await towncryerClient.sendPushNotification({
  title: 'New Message',
  content: 'You have a new message from Customer Support',
  recipients: [
    {
      token: 'firebase-fcm-token',
      context: {
        userId: '123'
      }
    }
  ],
  data: {
    type: 'support_message',
    messageId: '456'
  }
});
```

### Send SMS

```typescript
const response = await towncryerClient.sendSMS({
  content: 'Your verification code is: 123456',
  recipients: [
    {
      phoneNumber: '+1234567890',
      context: {
        code: '123456'
      }
    }
  ]
});
```

### Send Multiple Message Types at Once

```typescript
const response = await towncryerClient.sendMessages({
  emails: [/* Email options */],
  pushNotifications: [/* Push notification options */],
  smses: [/* SMS options */]
});
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

## Modular Architecture

The Towncryer SDK is built with a modular architecture, allowing direct access to individual services if needed:

```typescript
// Access individual services directly for advanced usage
const eventService = towncryerClient.getEventService();
const customerService = towncryerClient.getCustomerService();
const messageService = towncryerClient.getMessageService();
const utilityService = towncryerClient.getUtilityService();
const pushNotificationService = towncryerClient.getPushNotificationService();

// Example of using a service directly
await eventService.publishEvent({
  name: 'custom_event',
  data: { /* your data */ }
});
```

## Firebase Push Notification Integration

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

### Bulk Message Sending

```typescript
// Send multiple types of messages in a single API call
const bulkResponse = await towncryerClient.sendMessages({
  emails: [{
    title: 'Your Order Confirmation',
    content: '<h1>Order Confirmed</h1><p>Your order #12345 has been confirmed.</p>',
    from: { name: 'Support', email: 'orders@example.com' },
    recipients: [{ email: 'customer@example.com' }]
  }],
  pushNotifications: [{
    title: 'Order Status',
    content: 'Your order has been confirmed!',
    recipients: [{ token: 'device-token-123' }]
  }],
  smses: [{
    content: 'Your order #12345 has been confirmed. Track delivery at: https://example.com/track/12345',
    recipients: [{ phoneNumber: '+1234567890' }]
  }]
});
```

## Type Definitions

This SDK provides TypeScript type definitions for all objects and parameters:

- `CustomerData`: Customer profile information
- `EventData`: Event data structure for tracking user actions
- `EmailOptions`, `SMSOptions`, `PushNotificationOptions`: Message configuration
- `ContactFormData`: Structure for contact form submissions
- `EmailSubscriptionOptions`: Options for email subscriptions

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
