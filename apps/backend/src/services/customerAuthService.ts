import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use a strong secret from environment variables

class CustomerAuthService {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(customerId: string): string {
    return jwt.sign({ customerId }, JWT_SECRET, { expiresIn: '1h' });
  }

  async registerCustomer(email?: string, phone_number?: string, password?: string): Promise<any> {
    if (!email && !phone_number) {
      throw new Error('Either email or phone number is required for registration.');
    }
    if (!password) {
      throw new Error('Password is required for registration.');
    }

    // Check if email or phone_number already exists
    if (email) {
      const existingCustomer = await prisma.customer.findUnique({ where: { email } });
      if (existingCustomer) {
        throw new Error('Customer with this id already exists.');
      }
    }
    if (phone_number) {
      const existingCustomer = await prisma.customer.findUnique({ where: { phone_number } });
      if (existingCustomer) {
        throw new Error('Customer with this id already exists.');
      }
    }

    const password_hash = await this.hashPassword(password);

    const customer = await prisma.customer.create({
      data: {
        email,
        phone_number,
        password_hash,
      },
    });

    return customer;
  }

  async loginCustomer(
    emailOrPhone: string,
    password_input: string
  ): Promise<{ customer: any; token: string }> {
    let customer;

    // Try to find customer by email
    customer = await prisma.customer.findUnique({ where: { email: emailOrPhone } });

    // If not found by email, try by phone number
    if (!customer) {
      customer = await prisma.customer.findUnique({ where: { phone_number: emailOrPhone } });
    }

    if (!customer) {
      throw new Error('Invalid credentials: Customer not found.');
    }

    const isMatch = await this.comparePassword(password_input, customer.password_hash);
    if (!isMatch) {
      throw new Error('Invalid credentials: Password mismatch.');
    }

    const token = this.generateToken(customer.id);

    return { customer, token };
  }

  async getCustomerById(customerId: string): Promise<any> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        loyalty_tiers: true, // Include the full current tier object
      },
    });

    if (!customer) {
      throw new Error('Customer not found.');
    }

    const allTiers = await prisma.loyalty_tiers.findMany({
      orderBy: { min_points: 'asc' },
    });

    let nextTier = null;
    if (customer.loyalty_tiers) {
      const currentTierIndex = allTiers.findIndex(tier => tier.id === customer.loyalty_tiers!.id);
      if (currentTierIndex !== -1 && currentTierIndex < allTiers.length - 1) {
        nextTier = allTiers[currentTierIndex + 1];
      }
    } else {
      // If customer has no tier, the next tier is the first one
      if (allTiers.length > 0) {
        nextTier = allTiers[0];
      }
    }
    
    // Rename loyalty_tiers to currentTier to avoid confusion in the frontend
    const { loyalty_tiers: currentTier, ...customerData } = customer;

    return { customer: customerData, currentTier, nextTier };
  }

  async updateAllergenPreferences(customerId: string, allergen_preferences: string[]): Promise<any> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    
    if (!customer) {
      throw new Error('Customer not found.');
    }

    // Store allergen preferences as JSON string
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        allergen_preferences: JSON.stringify(allergen_preferences),
      },
      select: {
        id: true,
        email: true,
        phone_number: true,
        rewards_points: true,
        allergen_preferences: true,
        createdAt: true,
      },
    });

    return updatedCustomer;
  }
}

export const customerAuthService = new CustomerAuthService();
