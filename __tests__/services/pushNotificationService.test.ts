import { FirebasePushNotificationService } from '../../src/services/pushNotificationService';
import ApiService from '../../src/services/api';
import { EventService } from '../../src/services/eventService';
import { TowncryerAPIError } from '../../src/errors';
import { FirebaseConfig } from '../../src/types';

const initializeApp = jest.fn();
const getMessaging = jest.fn();
const getToken = jest.fn();
const onMessage = jest.fn();
const isSupported = jest.fn();
const getMessagingSw = jest.fn();

jest.mock('firebase/app', () => ({
  initializeApp: (...args: unknown[]) => initializeApp(...args),
}));

jest.mock('firebase/messaging', () => ({
  getMessaging: (...args: unknown[]) => getMessaging(...args),
  getToken: (...args: unknown[]) => getToken(...args),
  onMessage: (...args: unknown[]) => onMessage(...args),
  isSupported: (...args: unknown[]) => isSupported(...args),
}));

jest.mock('firebase/messaging/sw', () => ({
  getMessaging: (...args: unknown[]) => getMessagingSw(...args),
}));

const firebaseConfig: FirebaseConfig = {
  apiKey: 'key',
  authDomain: 'domain',
  projectId: 'project',
  messagingSenderId: 'sender',
  appId: 'app',
  storageBucket: 'bucket',
  measurementId: 'measurement',
  vapidKey: 'vapid-key',
};

describe('FirebasePushNotificationService', () => {
  const listMessagesByCustomerAndChannel = jest.fn();
  const getCustomerMessagesStats = jest.fn();
  const markMessageAsRead = jest.fn();
  let apiService: ApiService;
  let eventService: jest.Mocked<EventService>;
  let service: FirebasePushNotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    apiService = {
      getApi: jest.fn().mockReturnValue({
        listMessagesByCustomerAndChannel,
        getCustomerMessagesStats,
        markMessageAsRead,
      }),
    } as unknown as ApiService;
    eventService = { publishEvent: jest.fn().mockResolvedValue({ code: '200', message: 'Success' }) };
    service = new FirebasePushNotificationService(firebaseConfig, eventService, apiService, undefined);
  });

  it('requests the message API from the api service', () => {
    expect(apiService.getApi).toHaveBeenCalledWith('message');
  });

  describe('initialize', () => {
    it('sets up firebase messaging when messaging is supported', async () => {
      isSupported.mockResolvedValue(true);
      const app = { name: 'app' };
      initializeApp.mockReturnValue(app);
      const messaging = { name: 'messaging' };
      const messagingSw = { name: 'messaging-sw' };
      getMessaging.mockReturnValue(messaging);
      getMessagingSw.mockReturnValue(messagingSw);

      await service.initialize();

      expect(initializeApp).toHaveBeenCalledWith(firebaseConfig);
      expect(getMessaging).toHaveBeenCalledWith(app);
      expect(getMessagingSw).toHaveBeenCalledWith(app);
    });

    it('throws when messaging is not supported', async () => {
      isSupported.mockResolvedValue(false);
      initializeApp.mockReturnValue({});

      await expect(service.initialize()).rejects.toMatchObject({
        name: 'TowncryerAPIError',
        message: 'Firebase messaging is not supported in this environment',
        status: 400,
      });
    });

    it('wraps unexpected initialization failures', async () => {
      initializeApp.mockImplementation(() => {
        throw new Error('bad config');
      });

      await expect(service.initialize()).rejects.toBeInstanceOf(TowncryerAPIError);
    });
  });

  describe('requestPermission', () => {
    afterEach(() => {
      delete (global as unknown as { Notification?: unknown }).Notification;
    });

    it('throws when the browser does not support notifications', async () => {
      delete (global as unknown as { Notification?: unknown }).Notification;

      await expect(service.requestPermission()).rejects.toMatchObject({
        message: 'This browser does not support desktop notifications',
      });
    });

    it('returns false when permission is denied', async () => {
      (global as unknown as { Notification: unknown }).Notification = {
        requestPermission: jest.fn().mockResolvedValue('denied'),
      };

      await expect(service.requestPermission()).resolves.toBe(false);
    });

    it('registers the token when permission is granted and messaging is ready', async () => {
      isSupported.mockResolvedValue(true);
      initializeApp.mockReturnValue({});
      getMessaging.mockReturnValue({});
      getMessagingSw.mockReturnValue({});
      await service.initialize();

      (global as unknown as { Notification: unknown }).Notification = {
        requestPermission: jest.fn().mockResolvedValue('granted'),
      };
      getToken.mockResolvedValue('device-token');

      const withCustomer = new FirebasePushNotificationService(firebaseConfig, eventService, apiService, 'cust-1');
      await withCustomer.initialize();

      const granted = await withCustomer.requestPermission();

      expect(granted).toBe(true);
      expect(getToken).toHaveBeenCalledWith(expect.anything(), { vapidKey: firebaseConfig.vapidKey });
      expect(eventService.publishEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PushNotificationTokenRegisteredEvent',
          customer: expect.objectContaining({ externalId: 'cust-1', pushNotificationToken: 'device-token' }),
        })
      );
    });

    it('does not register a token when no device token is available', async () => {
      isSupported.mockResolvedValue(true);
      initializeApp.mockReturnValue({});
      getMessaging.mockReturnValue({});
      getMessagingSw.mockReturnValue({});
      getToken.mockResolvedValue(undefined);
      (global as unknown as { Notification: unknown }).Notification = {
        requestPermission: jest.fn().mockResolvedValue('granted'),
      };

      const withCustomer = new FirebasePushNotificationService(firebaseConfig, eventService, apiService, 'cust-1');
      await withCustomer.initialize();

      const granted = await withCustomer.requestPermission();

      expect(granted).toBe(true);
      expect(eventService.publishEvent).not.toHaveBeenCalled();
    });
  });

  describe('receiveNotifications', () => {
    it('throws when messaging has not been initialized', () => {
      expect(() => service.receiveNotifications(jest.fn())).toThrow(TowncryerAPIError);
    });

    it('maps incoming payloads and invokes the callback', async () => {
      isSupported.mockResolvedValue(true);
      initializeApp.mockReturnValue({});
      getMessaging.mockReturnValue({});
      getMessagingSw.mockReturnValue({});
      await service.initialize();

      const onNotificationReceived = jest.fn();
      service.receiveNotifications(onNotificationReceived);

      expect(onMessage).toHaveBeenCalled();
      const handler = onMessage.mock.calls[0][1];

      handler({
        messageId: 'msg-1',
        notification: { title: 'Hi', body: 'There', image: 'img.png' },
        data: { timestamp: '123' },
      });

      expect(onNotificationReceived).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'msg-1', title: 'Hi', body: 'There', imageUrl: 'img.png', timestamp: 123 })
      );
    });

    it('wraps a failure to register the message listener', async () => {
      isSupported.mockResolvedValue(true);
      initializeApp.mockReturnValue({});
      getMessaging.mockReturnValue({});
      getMessagingSw.mockReturnValue({});
      await service.initialize();
      onMessage.mockImplementationOnce(() => {
        throw new Error('listener registration failed');
      });

      expect(() => service.receiveNotifications(jest.fn())).toThrow(TowncryerAPIError);
    });

    it('shows a browser notification and caches it for the tracked customer when permission is granted', async () => {
      isSupported.mockResolvedValue(true);
      initializeApp.mockReturnValue({});
      getMessaging.mockReturnValue({});
      getMessagingSw.mockReturnValue({});
      await service.registerToken('cust-1', 'token-1');
      await service.initialize();

      const notificationConstructor = jest.fn();
      class MockNotification {
        static permission = 'granted';
        constructor(...args: unknown[]) {
          notificationConstructor(...args);
        }
      }
      (global as unknown as { Notification: unknown }).Notification = MockNotification;

      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => undefined);

      service.receiveNotifications(jest.fn());
      const handler = onMessage.mock.calls[0][1];
      handler({ messageId: 'msg-1', notification: { title: 'Hi', body: 'There' }, data: {} });

      expect(notificationConstructor).toHaveBeenCalledWith('Hi', expect.objectContaining({ body: 'There' }));
      expect(setItemSpy).toHaveBeenCalledWith('cust-1_notifications', expect.any(String));

      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
      delete (global as unknown as { Notification?: unknown }).Notification;
    });

    it('warns instead of throwing when caching the notification fails', async () => {
      isSupported.mockResolvedValue(true);
      initializeApp.mockReturnValue({});
      getMessaging.mockReturnValue({});
      getMessagingSw.mockReturnValue({});
      await service.registerToken('cust-1', 'token-1');
      await service.initialize();

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage unavailable');
      });

      const onNotificationReceived = jest.fn();
      service.receiveNotifications(onNotificationReceived);
      const handler = onMessage.mock.calls[0][1];

      expect(() =>
        handler({ messageId: 'msg-1', notification: { title: 'Hi', body: 'There' }, data: {} })
      ).not.toThrow();
      expect(onNotificationReceived).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();

      getItemSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getMessageHistory', () => {
    it('throws when no customer id has been set', () => {
      expect(() => service.getMessageHistory()).toThrow(
        'Customer ID is required to get message history'
      );
    });

    it('fetches message history for the registered customer with defaults', async () => {
      await service.registerToken('cust-1', 'token-1');
      const page = { content: [], totalElements: 0 };
      listMessagesByCustomerAndChannel.mockResolvedValue({ data: page });

      const result = await service.getMessageHistory();

      expect(listMessagesByCustomerAndChannel).toHaveBeenCalledWith('cust-1', 'PushNotification', 0, 10);
      expect(result).toBe(page);
    });

    it('wraps failures into a TowncryerAPIError', async () => {
      await service.registerToken('cust-1', 'token-1');
      listMessagesByCustomerAndChannel.mockRejectedValue(new Error('boom'));

      await expect(service.getMessageHistory(1, 5)).rejects.toBeInstanceOf(TowncryerAPIError);
      expect(listMessagesByCustomerAndChannel).toHaveBeenCalledWith('cust-1', 'PushNotification', 1, 5);
    });
  });

  describe('getStats', () => {
    it('throws when no customer id has been set', async () => {
      await expect(service.getStats()).rejects.toMatchObject({
        message: 'Customer ID is required to get notification stats',
      });
    });

    it('computes unread count from the response', async () => {
      await service.registerToken('cust-1', 'token-1');
      getCustomerMessagesStats.mockResolvedValue({ data: { total: 10, read: 4 } });

      const stats = await service.getStats();

      expect(stats).toEqual(expect.objectContaining({ total: 10, unread: 6 }));
    });

    it('defaults to zeroed stats when the response has no data', async () => {
      await service.registerToken('cust-1', 'token-1');
      getCustomerMessagesStats.mockResolvedValue({ data: undefined });

      const stats = await service.getStats();

      expect(stats).toEqual(expect.objectContaining({ total: 0, unread: 0 }));
    });

    it('wraps failures into a TowncryerAPIError', async () => {
      await service.registerToken('cust-1', 'token-1');
      getCustomerMessagesStats.mockRejectedValue(new Error('boom'));

      await expect(service.getStats()).rejects.toBeInstanceOf(TowncryerAPIError);
    });
  });

  describe('markRead', () => {
    it('throws when no customer id has been set', async () => {
      await expect(service.markRead('notif-1')).rejects.toMatchObject({
        message: 'Customer ID is required to mark a notification as read',
      });
    });

    it('throws when no notification id is provided', async () => {
      await service.registerToken('cust-1', 'token-1');

      await expect(service.markRead('')).rejects.toMatchObject({
        message: 'Notification ID is required',
      });
    });

    it('marks the notification as read', async () => {
      await service.registerToken('cust-1', 'token-1');
      markMessageAsRead.mockResolvedValue(undefined);

      await service.markRead('notif-1');

      expect(markMessageAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('wraps failures into a TowncryerAPIError', async () => {
      await service.registerToken('cust-1', 'token-1');
      markMessageAsRead.mockRejectedValue(new Error('boom'));

      await expect(service.markRead('notif-1')).rejects.toBeInstanceOf(TowncryerAPIError);
    });
  });

  describe('registerToken', () => {
    it('throws when no customer id is provided', async () => {
      await expect(service.registerToken('', 'token-1')).rejects.toMatchObject({
        message: 'Customer ID is required to register a push token',
      });
    });

    it('throws when no token is provided', async () => {
      await expect(service.registerToken('cust-1', '')).rejects.toMatchObject({
        message: 'Push notification token is required',
      });
    });

    it('publishes a registration event and updates the tracked customer id', async () => {
      const response = await service.registerToken('cust-1', 'token-1');

      expect(eventService.publishEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PushNotificationTokenRegisteredEvent',
          customer: expect.objectContaining({ externalId: 'cust-1', pushNotificationToken: 'token-1' }),
        })
      );
      expect(response).toEqual({ code: '200', message: 'Success' });
    });
  });
});
