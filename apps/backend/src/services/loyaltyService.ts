import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class LoyaltyService {
  async updateCustomerTier(customerId: string): Promise<any> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { rewards_points: true, current_tier_id: true },
    });

    if (!customer) {
      throw new Error('Customer not found.');
    }

    const tiers = await prisma.loyalty_tiers.findMany({
      orderBy: { min_points: 'desc' },
    });

    let newTierId: number | null = null;
    for (const tier of tiers) {
      if (customer.rewards_points >= tier.min_points) {
        newTierId = tier.id;
        break;
      }
    }

    if (newTierId !== null && customer.current_tier_id !== newTierId) {
      // Update customer's tier
      const updatedCustomer = await prisma.customer.update({
        where: { id: customerId },
        data: { current_tier_id: newTierId },
      });

      // Log the tier change in history
      await prisma.customer_tier_history.create({
        data: {
          customer_id: customerId,
          tier_id: newTierId,
        },
      });

      return updatedCustomer;
    }

    return customer; // Return original customer if no tier change
  }
}

export const loyaltyService = new LoyaltyService();
