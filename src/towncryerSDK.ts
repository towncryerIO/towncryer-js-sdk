import { 
  Config, 
  ContactFormData,
  EmailSubscriptionOptions,
  FirebaseConfig
} from './types';

import { EventService, TowncryerEventService } from './services/eventService';
import { CustomerService, TowncryerCustomerService } from './services/customerService';
import { MessageService, TowncryerMessageService } from './services/messageService';
import { PushNotificationService, FirebasePushNotificationService } from './services/pushNotificationService';
import { UtilityService, TowncryerUtilityService } from './services/utilityService';
import { ApiResponse, ApiError, SendBulkMessagesPayload, PublishEventPayload, CreateCustomerRequest, ScheduleInfo } from '@towncryerio/towncryer-js-api-client';
import { apiService } from './services/api';

/**
 * Towncryer SDK Interface
 */
export interface TowncryerSDK {
    // Customer methods
    createCustomer(customer: CreateCustomerRequest): Promise<ApiResponse|ApiError>;
    
    // Event methods
    publishEvent(event: PublishEventPayload): Promise<ApiResponse|ApiError>;
    
    // Message methods
    sendMessages(messages: SendBulkMessagesPayload): Promise<ScheduleInfo>;
    
    // Utility methods
    submitContactForm(formData: ContactFormData): Promise<ApiResponse|ApiError>;
    subscribeToEmails(email: string, options?: EmailSubscriptionOptions): Promise<ApiResponse|ApiError>;
    
    // Token management
    setAccessToken(token: string): void;
    setRefreshToken(token: string): void;

    setCustomerId(customerId: string): void;
    
    // Push notification methods
    initialize(): void;
    registerPushToken(customerId: string, token: string): Promise<ApiResponse|ApiError>;
    getPushNotificationService(): PushNotificationService;
}

/**
 * Towncryer SDK - Main class for interacting with the Towncryer API
 */
export class Towncryer implements TowncryerSDK {
  private config: Config;
  private pushNotifications?: PushNotificationService;
  private eventService: EventService;
  private customerService: CustomerService;
  private messageService: MessageService;
  private utilityService: UtilityService;
  private customerId: string;

  /**
     * Initialize the Towncryer SDK
     * @param config Configuration options
     */
  constructor(config: Config) {
    this.config = config;

    apiService.setBaseUrl('https://staging-api.towncryer.io/api/v1');
        
    if (config.authConfig.accessToken) {
      apiService.setTokenAndOrganisationId(
        config.authConfig.accessToken,
        config.organisationId ?? '');
    } else if (config.authConfig.apiKey) {
      apiService.setApiKey(config.authConfig.apiKey)
        .catch((error: Error) => {
          console.error('Failed to login using API key', error);
        });
    }
    
    if (config.organisationId) {
      apiService.setOrganisationId(config.organisationId);
    }
        
    if (config.authConfig.refreshToken) {
      apiService.setRefreshToken(config.authConfig.refreshToken);
    }
        
    this.eventService = new TowncryerEventService();
    this.customerId = config.customerId ?? '';
        
    if (config.firebase !== null || Object.keys(config.firebase).length > 0) {
      this.pushNotifications = this.constructFirebase(
        config.firebase ?? {} as FirebaseConfig);
    }
        
    // Initialize the remaining services
    this.customerService = new TowncryerCustomerService();
    this.messageService = new TowncryerMessageService();
    this.utilityService = new TowncryerUtilityService(this.eventService);
  }

  constructFirebase(config: FirebaseConfig): FirebasePushNotificationService {
    return new FirebasePushNotificationService(
      config,
      this.eventService,
      this.customerId,
    );
  }

  /**
     * Create a new customer
     * @param customer Customer data
     */
  async createCustomer(customer: CreateCustomerRequest): Promise<ApiResponse|ApiError> {
    return this.customerService.createCustomer(customer);
  }

  /**
     * Initialize the SDK (mainly for Firebase setup)
     */
  initialize(): void {
    // Initialize Firebase for push notifications
    if (!this.pushNotifications) {
      throw new Error('Push notifications not initialized');
    }
    this.pushNotifications.initialize();
  }

  /**
     * Publish an event to Towncryer
     * @param event Event data
     */
  async publishEvent(event: PublishEventPayload): Promise<ApiResponse|ApiError> {
    return this.eventService.publishEvent(event);
  }

  /**
     * Register a push notification token for a customer
     * @param customerId Customer ID
     * @param token Push notification token
     */
  async registerPushToken(customerId: string, token: string): Promise<ApiResponse|ApiError> {
    // Delegate to the push notification service
    if (!this.pushNotifications) {
      throw new Error('Push notifications not initialized');
    }
    return this.pushNotifications.registerToken(customerId, token);
  }

  /**
     * Send bulk messages (emails, push notifications, SMS)
     * @param messages Message options
     */
  async sendMessages(messages: SendBulkMessagesPayload): Promise<ScheduleInfo> {
    return this.messageService.sendMessages(messages);
  }
    
  /**
     * Submit contact form data
     * @param formData Contact form data including name, email, subject, and message
     */
  async submitContactForm(formData: ContactFormData): Promise<ApiResponse|ApiError> {
    return this.utilityService.submitContactForm(formData);
  }
    
  /**
     * Subscribe an email address to communications
     * @param email Email address to subscribe
     * @param options Additional subscription options like preferences and source
     */
  async subscribeToEmails(email: string, options?: EmailSubscriptionOptions): Promise<ApiResponse|ApiError> {
    return this.utilityService.subscribeToEmails(email, options);
  }

  /**
     * Get access to the push notification service for more direct control
     */
  getPushNotificationService(): PushNotificationService {
    if (!this.pushNotifications) {
      throw new Error('Push notifications not initialized');
    }
    return this.pushNotifications;
  }

  /**
     * Set or update the access token after initialization
     * @param token The access token to use for API requests
     */
  setAccessToken(token: string): void {
    apiService.setToken(token);
  }

  /**
     * Set or update the refresh token after initialization
     * @param token The refresh token to use for token refresh
     */
  setRefreshToken(token: string): void {
    apiService.setRefreshToken(token);
  }

  setCustomerId(customerId: string): void {
    this.customerId = customerId;
    if (this.customerId !== '') {
      this.pushNotifications = this.constructFirebase(this.config.firebase ?? {} as FirebaseConfig);
    }
  }
}
