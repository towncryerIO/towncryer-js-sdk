import { ApiResponse, CreateCustomerRequest, CustomersApi } from '@towncryerio/towncryer-js-api-client';
import ApiService from './api';
import { handleApiError } from '../utils/errorHandler';

/**
 * Customer Service
 */
export class CustomerService {
  private customersApi: CustomersApi;
    
  constructor(apiService: ApiService) {
    this.customersApi = apiService.getApi('customer');
  }
    
  /**
     * Create a new customer
     * @param customer Customer data
     * @throws TowncryerAPIError if customer creation fails
     * @returns Created customer response
     */
  async createCustomer(customer: CreateCustomerRequest): Promise<ApiResponse> {
    try {
      const response = await this.customersApi.createCustomer(customer);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}
