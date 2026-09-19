import { createMockTowncryerClient } from '../src/testing';
import { ITowncryer } from '../src/towncryerSDK';

describe('createMockTowncryerClient', () => {
  it('returns an ITowncryer-shaped object usable in place of a real client', async () => {
    const client: ITowncryer = createMockTowncryerClient();

    await expect(
      client.createCustomer({
        source: 'TowncryerAPI',
        identities: [{ type: 'email', value: 'jane@example.com', isPrimary: true }]
      })
    ).resolves.toEqual(expect.objectContaining({ code: '200' }));
    await expect(
      client.publishEvent({
        name: 'user.signed_up',
        customer: { externalId: 'customer-1' }
      })
    ).resolves.toEqual(expect.objectContaining({ code: '200' }));
    await expect(client.sendMessages({ emails: [] })).resolves.toEqual(
      expect.objectContaining({ jobId: expect.any(String) })
    );
    await expect(
      client.submitContactForm({
        name: 'Jane',
        email: 'jane@example.com',
        subject: 'Hi',
        message: 'Hello'
      })
    ).resolves.toEqual(expect.objectContaining({ code: '200' }));
    await expect(client.subscribeToEmails('jane@example.com')).resolves.toEqual(
      expect.objectContaining({ code: '200' })
    );

    expect(() => client.setAccessToken('token')).not.toThrow();
    expect(() => client.setRefreshToken('token')).not.toThrow();
    expect(() => client.setCustomerId('customer-1')).not.toThrow();
    expect(client.getCustomerId()).toBe('');
    expect(client.getEventService()).toBeDefined();
    expect(client.getMessagesApi()).toBeDefined();
  });

  it('lets callers override individual methods for their own assertions', async () => {
    const publishEvent = jest.fn().mockResolvedValue({ code: '200', message: 'stubbed' });

    const client = createMockTowncryerClient({ publishEvent, getCustomerId: () => 'customer-1' });

    const payload = { name: 'user.signed_up', customer: { externalId: 'customer-1' } };
    await client.publishEvent(payload);

    expect(publishEvent).toHaveBeenCalledWith(payload);
    expect(client.getCustomerId()).toBe('customer-1');
  });
});
