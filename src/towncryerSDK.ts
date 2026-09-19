import {
  Config,
  ContactFormData,
  EmailSubscriptionOptions
} from './types';

import { EventService, TowncryerEventService } from './services/eventService';
import { CustomerService, TowncryerCustomerService } from './services/customerService';
import { MessageService, TowncryerMessageService } from './services/messageService';
import { UtilityService, TowncryerUtilityService } from './services/utilityService';
import { ApiResponse, SendBulkMessagesPayload, PublishEventPayload, CreateCustomerRequest, ScheduleInfo, MessagesApi } from '@towncryerio/towncryer-js-api-client';
import ApiService, { DefaultAxiosInstanceFactory } from './services/api';

const DEFAULT_BASE_URL = 'https://api.towncryer.io/api/v1';
const DEFAULT_TIMEOUT = 30000;

/**
 * Towncryer SDK Interface
 */
export interface TowncryerSDK {
    // Customer methods
    createCustomer(customer: CreateCustomerRequest): Promise<ApiResponse>;

    // Event methods
    publishEvent(event: PublishEventPayload): Promise<ApiResponse>;

    // Message methods
    sendMessages(messages: SendBulkMessagesPayload): Promise<ScheduleInfo>;

    // Utility methods
    submitContactForm(formData: ContactFormData): Promise<ApiResponse>;
    subscribeToEmails(email: string, options?: EmailSubscriptionOptions): Promise<ApiResponse>;

    // Token management
    setAccessToken(token: string): void;
    setRefreshToken(token: string): void;

    setCustomerId(customerId: string): void;

    // Accessors used by optional, environment-specific extensions (e.g. the
    // browser push notification support in @towncryerio/towncryer-react-sdk)
    // to build on top of the core SDK's services.
    getEventService(): EventService;
    getMessagesApi(): MessagesApi;
    getCustomerId(): string;
}

/**
 * Towncryer SDK - Main class for interacting with the Towncryer API
 */
export class Towncryer implements TowncryerSDK {
  private apiService: ApiService;
  private eventService: EventService;
  private customerService: CustomerService;
  private messageService: MessageService;
  private utilityService: UtilityService;
  private customerId: string;
  // Tracks constructor-kicked-off async setup (e.g. api-key exchange); every
  // public request method awaits this via ensureReady() before firing.
  private readyPromise: Promise<void> = Promise.resolve();

  /**
     * Initialize the Towncryer SDK
     * @param config Configuration options
     */
  constructor(config: Config) {
    this.apiService = new ApiService(new DefaultAxiosInstanceFactory());
    this.apiService.setBaseUrl(config.baseUrl ?? DEFAULT_BASE_URL);
    this.apiService.setTimeout(config.timeout ?? DEFAULT_TIMEOUT);
    this.apiService.setRetryConfig(config.retryConfig ?? {});

    if (config.authConfig.accessToken) {
      if (config.authConfig.apiKey) {
        console.warn('Both accessToken and apiKey provided. Using accessToken and ignoring apiKey.');
      }
      this.initializeWithToken(
        config.authConfig.accessToken,
        config.authConfig.refreshToken,
        config.organisationId
      );
    } else if (config.authConfig.apiKey) {
      this.readyPromise = this.initializeWithApiKey(
        config.authConfig.apiKey,
        config.organisationId
      );
    } else if (config.organisationId) {
      this.apiService.setOrganisationId(config.organisationId);
    }

    this.eventService = new TowncryerEventService(this.apiService);
    this.customerId = config.customerId ?? '';

    this.customerService = new TowncryerCustomerService(this.apiService);
    this.messageService = new TowncryerMessageService(this.apiService);
    this.utilityService = new TowncryerUtilityService(this.eventService);
  }

  private initializeWithToken(
    accessToken: string,
    refreshToken?: string,
    organisationId?: string
  ) {
    if (organisationId) {
      this.apiService.setTokenAndOrganisationId(accessToken, organisationId);
    } else {
      this.apiService.setToken(accessToken);
    }

    if (refreshToken) {
      this.apiService.setRefreshToken(refreshToken);
    }
  }

  private initializeWithApiKey(apiKey: string, organisationId?: string): Promise<void> {
    if (organisationId) {
      this.apiService.setOrganisationId(organisationId);
    }

    return this.apiService.setApiKey(apiKey)
      .catch((error: Error) => {
        console.error('Failed to initialize with API key:', error);
        throw error;
      });
  }

  /**
     * Waits for any async setup started by the constructor (e.g. exchanging
     * an API key for an access token) to finish before a request goes out.
     * Every public request method awaits this internally, so callers never
     * need to think about it.
     */
  private ensureReady(): Promise<void> {
    return this.readyPromise;
  }

  /**
     * Create a new customer
     * @param customer Customer data
     */
  async createCustomer(customer: CreateCustomerRequest): Promise<ApiResponse> {
    await this.ensureReady();
    return this.customerService.createCustomer(customer);
  }

  /**
     * Publish an event to Towncryer
     * @param event Event data
     */
  async publishEvent(event: PublishEventPayload): Promise<ApiResponse> {
    await this.ensureReady();
    return this.eventService.publishEvent(event);
  }

  /**
     * Send bulk messages (emails, push notifications, SMS)
     * @param messages Message options
     */
  async sendMessages(messages: SendBulkMessagesPayload): Promise<ScheduleInfo> {
    await this.ensureReady();
    return this.messageService.sendMessages(messages);
  }

  /**
     * Submit contact form data
     * @param formData Contact form data including name, email, subject, and message
     */
  async submitContactForm(formData: ContactFormData): Promise<ApiResponse> {
    await this.ensureReady();
    return this.utilityService.submitContactForm(formData);
  }

  /**
     * Subscribe an email address to communications
     * @param email Email address to subscribe
     * @param options Additional subscription options like preferences and source
     */
  async subscribeToEmails(email: string, options?: EmailSubscriptionOptions): Promise<ApiResponse> {
    await this.ensureReady();
    return this.utilityService.subscribeToEmails(email, options);
  }

  /**
     * Set or update the access token after initialization
     * @param token The access token to use for API requests
     */
  setAccessToken(token: string): void {
    this.apiService.setToken(token);
  }

  /**
     * Set or update the refresh token after initialization
     * @param token The refresh token to use for token refresh
     */
  setRefreshToken(token: string): void {
    this.apiService.setRefreshToken(token);
  }

  setCustomerId(customerId: string): void {
    this.customerId = customerId;
  }

  /**
     * Get the event service, for building environment-specific extensions
     * (e.g. browser push notification support) on top of the core SDK.
     */
  getEventService(): EventService {
    return this.eventService;
  }

  /**
     * Get the underlying messages API client, for building environment-specific
     * extensions (e.g. browser push notification support) on top of the core SDK.
     */
  getMessagesApi(): MessagesApi {
    return this.apiService.getApi('message');
  }

  /**
     * Get the currently configured customer ID.
     */
  getCustomerId(): string {
    return this.customerId;
  }
}
