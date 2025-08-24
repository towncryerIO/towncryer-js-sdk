import { FirebaseConfig, PushNotification, PushNotificationStats } from '../types';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, Messaging, MessagePayload } from 'firebase/messaging';
import { getMessaging as getMessagingSw } from 'firebase/messaging/sw';
import { ApiResponse, ApiError, PublishEventPayload, MessagesApi, PaginatePage } from '@towncryerio/towncryer-js-api-client';
import { EventService } from './eventService';
import { apiService } from './api';
import { handleApiError } from '../utils/errorHandler';

const PUSH_NOTIFICATION_CHANNEL_NAME = 'PushNotification';

/**
 * Push Notification Service Interface
 */
export interface PushNotificationService {
  /**
   * Initialize the push notification service
   */
  initialize(): Promise<void>;

  /**
   * Request permission from the user to receive push notifications
   */
  requestPermission(): Promise<boolean>;

  /**
   * Set up handling for incoming notifications
   * @param callback Function to call when a notification is received
   */
  receiveNotifications(onNotificationReceived: (notification: PushNotification) => void): void;

  /**
   * Get the message history for a customer
   * @param customerId Customer ID
   * @param limit Maximum number of messages to return
   */
  getMessageHistory(page?: number, size?: number): Promise<PaginatePage>;

  /**
   * Get notification statistics for a customer
   * @param customerId Customer ID
   */
  getStats(): Promise<PushNotificationStats>;

  /**
   * Mark notifications as read
   * @param notificationId Notification ID to mark as read
   */
  markRead(notificationId: string): Promise<void>;

  /**
   * Register a push notification token for a customer
   * @param customerId Customer ID
   * @param token Push notification token
   */
  registerToken(customerId: string, token: string): Promise<ApiResponse | ApiError>;
}

/**
 * Firebase Push Notification Service Implementation
 */
export class FirebasePushNotificationService implements PushNotificationService {
  private firebaseApp?: FirebaseApp;
  private firebaseMessaging?: Messaging;
  private firebaseMessagingSw?: Messaging;
  private customerId?: string;
  private eventService: EventService;
  private messagesApi: MessagesApi;

  constructor(
    private firebaseConfig: FirebaseConfig,
    eventService: EventService,
    customerId?: string,
  ) {
    this.customerId = customerId;
    this.eventService = eventService;
    this.messagesApi = apiService.getApi('message');
  }

  /**
     * Initialize Firebase and prepare for push notifications
     * @throws Error if Firebase initialization fails or if messaging is not supported
     */
  async initialize(): Promise<void> {
    try {
      this.firebaseApp = initializeApp(this.firebaseConfig);

      const isMessagingSupported = await isSupported();
      if (isMessagingSupported) {
        this.firebaseMessaging = getMessaging(this.firebaseApp);
        this.firebaseMessagingSw = getMessagingSw(this.firebaseApp);
      } else {
        throw new Error('Firebase messaging is not supported in this environment');
      }
    } catch (error) {
      throw new Error(`Failed to initialize Firebase: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
     * Request notification permission from the user
     */
  async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        throw new Error('This browser does not support desktop notifications');
      }

      const permission = await Notification.requestPermission();
      const permissionGranted = permission === 'granted';

      if (permissionGranted && this.firebaseMessaging && this.customerId) {
        await this.getAndRegisterToken();
      }

      return permissionGranted;
    } catch (error) {
      throw new Error(`Failed to request notification permission: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
     * Get the Firebase token and register it
     * @private
     */
  private async getAndRegisterToken(): Promise<string | null> {
    if (!this.firebaseMessaging) {
      throw new Error('Firebase messaging not initialized');
    }

    const currentToken = await getToken(this.firebaseMessaging, {
      vapidKey: this.firebaseConfig.vapidKey
    });

    if (currentToken && this.customerId) {
      await this.registerToken(this.customerId, currentToken);
      return currentToken;
    } else {
      return null;
    }
  }

  /**
     * Set up handling for incoming notifications
     * @param onNotificationReceived Function to call when a notification is received
     * @throws Error if Firebase messaging is not initialized or if notification setup fails
     */
  receiveNotifications(onNotificationReceived: (notification: PushNotification) => void): void {
    if (!this.firebaseMessaging) {
      throw new Error('Firebase messaging not initialized, notifications will not be received');
    }

    try {
      onMessage(this.firebaseMessaging, (payload) => {
        const notification = this.mapFirebaseMessageToNotification(payload);

        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }

        if ('Notification' in window && Notification.permission === 'granted') {
          const notificationOptions = {
            body: notification.body,
            icon: notification.imageUrl,
            data: notification.data,
            tag: notification.id
          };

          new Notification(notification.title, notificationOptions);
        }
      });
    } catch (error) {
      throw new Error(`Failed to set up notification receiver: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
     * Get message history
     * @param page Page number (default: 0)
     * @param size Page size (default: 10)
     */
  getMessageHistory(page = 0, size = 10): Promise<PaginatePage> {
    if (!this.customerId) {
      throw new Error('Customer ID is required to get message history');
    }

    return this.messagesApi.listMessagesByCustomerAndChannel(
      this.customerId,
      PUSH_NOTIFICATION_CHANNEL_NAME,
      page,
      size
    ).then((response) => response.data);
  }

  /**
     * Get notification statistics
     */
  async getStats(): Promise<PushNotificationStats> {
    try {
      if (!this.customerId) {
        throw new Error('Customer ID is required to get notification stats');
      }

      const response = await this.messagesApi.getCustomerMessagesStats(this.customerId, PUSH_NOTIFICATION_CHANNEL_NAME);

      if (!response || !response.data) {
        return {
          total: 0,
          unread: 0,
          lastUpdated: Date.now()
        };
      }

      return {
        total: response.data.total || 0,
        unread: (response.data.total || 0) - (response.data.read || 0),
        lastUpdated: Date.now()
      };

    } catch (error) {
      throw new Error(`Failed to get notification statistics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
     * Mark notification as read
     * @param notificationId Notification ID to mark as read
     * @throws Error if customer ID or notification ID is missing, or if API call fails
     */
  async markRead(notificationId: string): Promise<void> {
    try {
      if (!this.customerId) {
        throw new Error('Customer ID is required to mark a notification as read');
      }

      if (!notificationId) {
        throw new Error('Notification ID is required');
      }

      await this.messagesApi.markMessageAsRead(notificationId);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
     * Register a push notification token for a customer
     * @param customerId Customer ID
     * @param token Push notification token
     */
  async registerToken(customerId: string, token: string): Promise<ApiResponse> {
    if (!customerId) {
      throw new Error('Customer ID is required to register a push token');
    }

    if (!token) {
      throw new Error('Push notification token is required');
    }

    this.customerId = customerId;

    const eventPayload: PublishEventPayload = {
      name: 'PushNotificationTokenRegisteredEvent',
      customer: {
        externalId: customerId,
        firstName: '',
        lastName: '',
        email: '',
        pushNotificationToken: token,
      },
      data: {
        platform: typeof navigator !== 'undefined' ?
          (navigator.userAgent.indexOf('Android') > -1 ? 'android' : 'ios') : 'unknown',
        timestamp: new Date().toISOString()
      }
    };
    try {
      const response = await this.eventService.publishEvent(eventPayload);
      if ('code' in response && 'message' in response) {
        return response as ApiResponse;
      }
      return {
        code: '200',
        message: 'Success',
        data: response
      };
    } catch (error) {
      const apiError = handleApiError(error);
      const errorResponse: ApiResponse = {
        code: '500',
        message: apiError.message || 'Failed to register token'
      };
      return errorResponse;
    }
  }

  /**
     * Map a Firebase message payload to our notification format
     * @param payload Firebase message payload
     * @private
     */
  private mapFirebaseMessageToNotification(payload: MessagePayload): PushNotification {
    const notification: PushNotification = {
      id: payload.messageId || `notification-${Date.now()}`,
      title: payload.notification?.title || '',
      body: payload.notification?.body || '',
      data: payload.data || {},
      imageUrl: payload.notification?.image,
      timestamp: payload.data?.timestamp ? parseInt(payload.data.timestamp) : Date.now(),
      read: false
    };

    if (this.customerId) {
      try {
        const storageKey = `${this.customerId}_notifications`;
        const existingNotifications = localStorage.getItem(storageKey);
        const notifications = existingNotifications ?
          JSON.parse(existingNotifications) : [];

        notifications.unshift(notification);

        if (notifications.length > 50) {
          notifications.pop();
        }

        localStorage.setItem(storageKey, JSON.stringify(notifications));
      } catch (e) {
        console.warn('Failed to cache notification in local storage', e);
      }
    }

    return notification;
  }
}