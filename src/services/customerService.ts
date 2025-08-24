import { ApiResponse, CreateCustomerRequest, CustomersApi } from '@towncryerio/towncryer-js-api-client';
import { apiService } from './api';

/**
 * Customer Service Interface
 */
export interface CustomerService {
    /**
     * Create a new customer or update existing one
     * @param customer Customer data
     */
    createCustomer(customer: CreateCustomerRequest): Promise<ApiResponse>;
}

/**
 * Customer Service Implementation
 */
export class TowncryerCustomerService implements CustomerService {
  private customersApi: CustomersApi;
    
  constructor() {
    this.customersApi = apiService.getApi('customer');
  }
    
  /**
     * Create a new customer
     * @param customer Customer data
     * @throws Error if customer creation fails
     * @returns Created customer response
     */
  async createCustomer(customer: CreateCustomerRequest): Promise<ApiResponse> {
    try {
      const response = await this.customersApi.createCustomer(customer);
      return response;
    } catch (error) {
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
