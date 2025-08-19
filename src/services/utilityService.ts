import { ApiResponse, ContactFormData, EmailSubscriptionOptions } from '../types';
import { EventService } from './eventService';
import { ApiError, CreateCustomerRequest, EventCustomerRequest, PublishEventPayload } from '@towncryerio/towncryer-js-api-client';
import { handleApiError, standardizeApiResponse } from '../utils/errorHandler';

/**
 * Utility Service Interface
 * 
 * This interface defines utility operations for common tasks in the Towncryer SDK,
 * such as handling contact form submissions and email subscriptions.
 * The utility service leverages the EventService to publish events to the Towncryer platform.
 */
export interface UtilityService {
    /**
     * Submit a contact form to Towncryer
     * 
     * This method sends the contact form data as an event to the Towncryer platform,
     * which can then trigger workflows, notifications, or other actions based on the submission.
     * 
     * @param formData - Object containing contact form data
     * @param formData.name - Full name of the contact
     * @param formData.email - Email address of the contact
     * @param formData.subject - Subject line of the contact form
     * @param formData.message - Message body content
     * @param formData.metadata - Optional additional metadata for the contact submission
     * @returns Promise resolving to an ApiResponse with result details
     * @example
     * ```typescript
     * const result = await utilityService.submitContactForm({
     *   name: 'John Doe',
     *   email: 'john@example.com',
     *   subject: 'Product Inquiry',
     *   message: 'I would like more information about your services.'
     * });
     * ```
     */
    submitContactForm(formData: ContactFormData): Promise<ApiResponse|ApiError>;
    
    /**
     * Subscribe an email address to communications
     * 
     * This method registers an email address for subscription to newsletters or other
     * communications. It sends the subscription as an event to the Towncryer platform,
     * which can then add the subscriber to appropriate lists and send confirmation emails.
     * 
     * @param email - Email address to subscribe
     * @param options - Optional subscription configuration
     * @param options.firstName - Subscriber's first name
     * @param options.lastName - Subscriber's last name
     * @param options.source - Source of the subscription (e.g., 'website', 'landing-page')
     * @param options.preferences - Array of subscription preferences/topics
     * @param options.metadata - Any additional custom data for the subscription
     * @returns Promise resolving to an ApiResponse with result details
     * @example
     * ```typescript
     * const result = await utilityService.subscribeToEmails('user@example.com', {
     *   firstName: 'Jane',
     *   lastName: 'Smith',
     *   source: 'newsletter-popup',
     *   preferences: ['product-updates', 'marketing']
     * });
     * ```
     */
    subscribeToEmails(email: string, options?: EmailSubscriptionOptions): Promise<ApiResponse|ApiError>;
}

/**
 * Towncryer Utility Service Implementation
 * 
 * This class implements the UtilityService interface using the Towncryer event system.
 * It provides functionality for common user interactions like contact form submissions
 * and email subscriptions by publishing events to the Towncryer platform through
 * the EventService.
 */
export class TowncryerUtilityService implements UtilityService {
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
     * @throws ApiError if the event publishing fails
     */
    async submitContactForm(formData: ContactFormData): Promise<ApiResponse> {
        try {
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
            
            const response = await this.eventService.publishEvent(event);
            return standardizeApiResponse(response);
        } catch (error) {
            throw handleApiError(error);
        }
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
     * @throws ApiError if the event publishing fails
     */
    async subscribeToEmails(email: string, options: EmailSubscriptionOptions = {}): Promise<ApiResponse> {
        try {
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
            
            const response = await this.eventService.publishEvent(event); 
            return standardizeApiResponse(response);
        } catch (error) {
            throw handleApiError(error);
        }
    }
}