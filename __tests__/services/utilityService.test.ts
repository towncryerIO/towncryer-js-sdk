import { UtilityService } from '../../src/services/utilityService';
import { EventService } from '../../src/services/eventService';
import { ApiResponse } from '@towncryerio/towncryer-js-api-client';

describe('UtilityService', () => {
  let eventService: { publishEvent: jest.Mock };
  let service: UtilityService;
  const okResponse: ApiResponse = { code: '200', message: 'Success' };

  beforeEach(() => {
    eventService = { publishEvent: jest.fn().mockResolvedValue(okResponse) };
    service = new UtilityService(eventService as unknown as EventService);
  });

  describe('submitContactForm', () => {
    it('publishes a contact_form.submitted event built from the form data', async () => {
      const result = await service.submitContactForm({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        subject: 'Question',
        message: 'Hello there',
        metadata: { referrer: 'landing-page' },
      });

      expect(eventService.publishEvent).toHaveBeenCalledWith({
        name: 'contact_form.submitted',
        customer: {
          externalId: 'ada@example.com',
          email: 'ada@example.com',
          firstName: 'Ada',
          lastName: 'Lovelace',
        },
        data: {
          subject: 'Question',
          message: 'Hello there',
          referrer: 'landing-page',
        },
      });
      expect(result).toBe(okResponse);
    });

    it('handles a single-word name with an empty last name', async () => {
      await service.submitContactForm({
        name: 'Ada',
        email: 'ada@example.com',
        subject: 'Question',
        message: 'Hello there',
      });

      expect(eventService.publishEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: expect.objectContaining({ firstName: 'Ada', lastName: '' }),
        })
      );
    });
  });

  describe('subscribeToEmails', () => {
    it('publishes an email.subscription event using the provided options', async () => {
      const result = await service.subscribeToEmails('subscriber@example.com', {
        firstName: 'Jane',
        lastName: 'Smith',
        source: 'newsletter-popup',
        preferences: ['product-updates'],
        metadata: { campaign: 'fall-2026' },
      });

      expect(eventService.publishEvent).toHaveBeenCalledWith({
        name: 'email.subscription',
        customer: {
          externalId: 'subscriber@example.com',
          email: 'subscriber@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
        },
        data: expect.objectContaining({
          source: 'newsletter-popup',
          preferences: ['product-updates'],
          campaign: 'fall-2026',
          timestamp: expect.any(String),
        }),
      });
      expect(result).toBe(okResponse);
    });

    it('falls back to defaults when no options are provided', async () => {
      await service.subscribeToEmails('subscriber@example.com');

      expect(eventService.publishEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: expect.objectContaining({ firstName: '', lastName: '' }),
          data: expect.objectContaining({ source: 'website', preferences: ['all'] }),
        })
      );
    });
  });
});
