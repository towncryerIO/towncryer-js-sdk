import { ContactFormData, EmailSubscriptionOptions } from '../types';
import { EventService } from './eventService';
import { ApiResponse, EventCustomerRequest, PublishEventPayload } from '@towncryerio/towncryer-js-api-client';

/**
 * Utility Service
 *
 * Provides utility operations for common tasks in the Towncryer SDK, such as
 * handling contact form submissions and email subscriptions, by publishing
 * events to the Towncryer platform through the EventService.
 */
export class UtilityService {
  constructor(
        private eventService: EventService,
  ) {}

  /**
     * Submit a contact form to Towncryer
     *
     * Processes a contact form submission by creating an event with the form data
     * and publishing it via the EventService. This allows the Towncryer platform
     * to process the submission according to configured workflows.
     *
     * @param formData - Object containing contact form data
     * @returns Promise resolving to an ApiResponse
     * @throws TowncryerAPIError if the event publishing fails
     */
  async submitContactForm(formData: ContactFormData): Promise<ApiResponse> {
    const customer: EventCustomerRequest = {
      externalId: formData.email,
      email: formData.email,
      firstName: formData.name.split(' ')[0] || '',
      lastName: formData.name.split(' ').slice(1).join(' ') || ''
    };

    const event: PublishEventPayload = {
      name: 'contact_form.submitted',
      customer: customer,
      data: {
        subject: formData.subject,
        message: formData.message,
        ...formData.metadata
      }
    };

    return this.eventService.publishEvent(event);
  }

  /**
     * Subscribe an email address to communications
     *
     * Creates and publishes an email subscription event to the Towncryer platform.
     * The event includes customer data derived from the provided email and options,
     * along with subscription preferences and metadata.
     *
     * @param email - Email address to subscribe
     * @param options - Optional subscription configuration with additional details
     * @returns Promise resolving to an ApiResponse
     * @throws TowncryerAPIError if the event publishing fails
     */
  async subscribeToEmails(email: string, options: EmailSubscriptionOptions = {}): Promise<ApiResponse> {
    const customer: EventCustomerRequest = {
      externalId: email,
      email: email,
      firstName: options.firstName || '',
      lastName: options.lastName || ''
    };

    const event: PublishEventPayload = {
      name: 'email.subscription',
      customer: customer,
      data: {
        source: options.source || 'website',
        preferences: options.preferences || ['all'],
        timestamp: new Date().toISOString(),
        ...options.metadata
      }
    };

    return this.eventService.publishEvent(event);
  }
}
