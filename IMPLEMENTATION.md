# Towncryer SDK Implementation Plan

## API Endpoints to Support

Based on the OpenAPI specification in `docs/api-swagger.yaml`, the SDK will support these endpoints:

1. **POST /customers**
   - Purpose: Create a new customer
   - Security: ApiKeyAuth + ApiSecretAuth
   - Request: CreateCustomerPayload
   - Response: CreateCustomerResponse (ApiResponse with Customer data)

2. **POST /events**
   - Purpose: Publish a new event
   - Security: ApiKeyAuth + ApiSecretAuth
   - Request: EventPayload (includes customer data)
   - Response: ApiResponse

3. **POST /messages**
   - Purpose: Send bulk messages (emails, SMS, push notifications)
   - Security: ApiKeyAuth + ApiSecretAuth
   - Request: SendBulkMessagePayload
   - Response: ScheduleResponse

## Data Models

The SDK will include TypeScript interfaces for:

1. **Core Models**
   - CustomerData (CreateCustomerPayload)
   - EventData (EventPayload)
   - BulkMessageOptions (SendBulkMessagePayload)

2. **Message-Related Models**
   - EmailOptions (SendEmailPayload)
   - PushNotificationOptions (SendPushNotificationPayload)
   - SMSOptions (SendSMSPayload)
   - Email/Push/SMS Recipient models

3. **Response Models**
   - ApiResponse
   - ScheduleResponse

## Implementation Steps

1. **Generate API Client**
   - Use OpenAPI Generator to create a TypeScript client from the API spec
   - Command: `npm run generate-client` (defined in package.json)

2. **Integrate API Client with SDK**
   - Create wrapper methods in the Towncryer class for each endpoint
   - Expose developer-friendly methods with clear interfaces
   - Implement proper error handling

3. **Implement Helper Utilities**
   - Contact form submission helper (creates customer + event)
   - Email subscription helper (creates customer + event)
   - Firebase push notification token registration (updates customer)

4. **Testing**
   - Create unit tests for all SDK methods
   - Create integration tests with API mocks

5. **Documentation**
   - Update README.md with detailed usage examples
   - Add JSDoc comments to all methods and interfaces

## Next Steps

1. Install dependencies:
   ```
   cd typescript-core-sdk
   npm install
   ```

2. Generate the API client:
   ```
   npm run generate-client
   ```

3. Implement the SDK methods using the generated client

4. Build and test the SDK:
   ```
   npm run build
   npm test
   ```

## Known Requirements from Other Systems

- Support for the `query` parameter for event name search (ILIKE)
- Support for pagination parameters (`page`, `size`) for event listing
- Support for date filtering (`dateFilter`) for events
