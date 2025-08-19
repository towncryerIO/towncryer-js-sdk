import { CreateCustomerRequest, CustomersApi } from '@towncryerio/towncryer-js-api-client';
import ApiService from "./api";

/**
 * Customer Service Interface
 */
export interface CustomerService {
    /**
     * Create a new customer or update existing one
     * @param customer Customer data
     */
    createCustomer(customer: CreateCustomerRequest): Promise<any>;
}

/**
 * Customer Service Implementation
 */
export class TowncryerCustomerService implements CustomerService {
    private customersApi: CustomersApi;
    
    constructor() {
        this.customersApi = ApiService.getApi("customer");
    }
    
    /**
     * Create a new customer
     * @param customer Customer data
     * @throws Error if customer creation fails
     * @returns Created customer response
     */
    async createCustomer(customer: CreateCustomerRequest): Promise<any> {
        try {
            const response = await this.customersApi.createCustomer(customer);
            return response;
        } catch (error) {
            throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
