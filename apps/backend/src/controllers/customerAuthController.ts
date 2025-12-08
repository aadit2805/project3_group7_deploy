import { Request, Response } from 'express';
import { customerAuthService } from '../services/customerAuthService';

/**
 * Controller for customer authentication operations
 * Handles registration, login, profile retrieval, and allergen preferences
 */
export const customerAuthController = {
    /**
     * Register a new customer account
     * Creates a new customer with email, phone number, and password
     * Returns customer data and authentication token
     */
    async register(req: Request, res: Response) {
        const { email, phone_number, password } = req.body;

        try {
            const customer = await customerAuthService.registerCustomer(email, phone_number, password);
            const token = customerAuthService.generateToken(customer.id);
            return res.status(201).json({ message: 'Customer registered successfully', customer: { id: customer.id, email: customer.email, phone_number: customer.phone_number }, token });
        } catch (error: any) {
            // Handle duplicate email/phone conflicts
            if (error.message.includes('already exists')) {
                return res.status(409).json({ message: error.message });
            }
            return res.status(400).json({ message: error.message });
        }
    },

    /**
     * Authenticate and login a customer
     * Accepts email or phone number for login
     * Returns customer data and authentication token
     */
    async login(req: Request, res: Response) {
        const { emailOrPhone, password } = req.body;

        try {
            const { customer, token } = await customerAuthService.loginCustomer(emailOrPhone, password);
            return res.status(200).json({ message: 'Login successful', customer: { id: customer.id, email: customer.email, phone_number: customer.phone_number }, token });
        } catch (error: any) {
            return res.status(401).json({ message: error.message });
        }
    },

    /**
     * Get the authenticated customer's profile information
     * req.customer is set by the authenticateCustomer middleware
     */
    async getMe(req: Request, res: Response) {
        const customerId = req.customer?.id;

        if (!customerId) {
            return res.status(401).json({ message: 'Not authenticated as a customer.' });
        }

        try {
            const customerData = await customerAuthService.getCustomerById(customerId);
            return res.status(200).json({ success: true, ...customerData });
        } catch (error: any) {
            return res.status(404).json({ message: error.message });
        }
    },

    /**
     * Update allergen preferences for the authenticated customer
     * Allows customers to specify food allergies and dietary restrictions
     */
    async updateAllergenPreferences(req: Request, res: Response) {
        const customerId = req.customer?.id;
        const { allergen_preferences } = req.body;

        if (!customerId) {
            return res.status(401).json({ message: 'Not authenticated as a customer.' });
        }

        try {
            const customer = await customerAuthService.updateAllergenPreferences(customerId, allergen_preferences);
            return res.status(200).json({ 
                success: true, 
                message: 'Allergen preferences updated successfully',
                customer 
            });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }
};
