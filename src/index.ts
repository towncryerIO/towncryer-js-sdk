/**
 * Towncryer TypeScript SDK
 *
 * This SDK provides a developer-friendly interface to the Towncryer API,
 * allowing for easy integration of event publishing, customer management,
 * and message sending. It has no browser-global dependencies, so it can be
 * used in any JS environment (Node, React Native, server-side, etc.).
 *
 * Browser push notification support (Firebase Cloud Messaging) lives in
 * @towncryerio/towncryer-react-sdk, which builds on top of this SDK's
 * `getEventService()` / `getMessagesApi()` / `getCustomerId()` accessors.
 */

// Export all types
export * from './types';

// Export error types
export * from './errors';

// Export error handling utility, used by environment-specific extensions
// (e.g. @towncryerio/towncryer-react-sdk) to normalize errors the same way
export * from './utils/errorHandler';

// Export all services
export * from './services/eventService';
export * from './services/customerService';
export * from './services/messageService';
export * from './services/utilityService';

// Export the main SDK
export * from './towncryerSDK';

// Re-export default
import { Towncryer } from './towncryerSDK';
export default Towncryer;
