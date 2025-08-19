/**
 * Towncryer TypeScript SDK
 * 
 * This SDK provides a developer-friendly interface to the Towncryer API,
 * allowing for easy integration of event publishing, customer management,
 * message sending, and push notifications.
 */

// Export all types
export * from './types';

// Export all services
export * from './services/eventService';
export * from './services/customerService';
export * from './services/messageService';
export * from './services/pushNotificationService';
export * from './services/utilityService';

// Export the main SDK
export * from './towncryerSDK';

// Re-export default
import { Towncryer } from './towncryerSDK';
export default Towncryer;
