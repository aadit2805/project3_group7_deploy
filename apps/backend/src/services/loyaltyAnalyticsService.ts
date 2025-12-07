import { db } from '../db';
import { Prisma } from '@prisma/client';

/**
 * Gets the total number of loyalty members.
 * @returns The total number of customers.
 */
async function getTotalLoyaltyMembers() {
  const totalMembers = await db.customer.count();
  return totalMembers;
}

/**
 * Gets the number of new loyalty members who signed up in the last X days.
 * @param days The number of days to look back.
 * @returns The number of new members.
 */
async function getNewMembersLastXDays(days: number = 30) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  const newMembersCount = await db.customer.count({
    where: {
      createdAt: {
        gte: date,
      },
    },
  });
  return newMembersCount;
}

/**
 * Gets the total number of reward points in circulation.
 * @returns The sum of all reward points.
 */
async function getTotalRewardPoints() {
  const totalPoints = await db.customer.aggregate({
    _sum: {
      rewards_points: true,
    },
  });
  return totalPoints._sum.rewards_points ?? 0;
}

/**
 * Gets the top loyalty members by reward points.
 * @param limit The number of top members to retrieve.
 * @returns A list of the top loyalty members.
 */
async function getTopLoyaltyMembers(limit: number = 10) {
  const topMembers = await db.customer.findMany({
    orderBy: {
      rewards_points: 'desc',
    },
    take: limit,
    select: {
      id: true,
      email: true,
      rewards_points: true,
      createdAt: true,
    },
  });
  return topMembers;
}

/**
 * Compares spending habits between loyalty and non-loyalty customers.
 * @returns An object with revenue and average order value for both groups.
 */
async function getSpendingComparison() {
  // Get all orders that have a price
  const orders = await db.order.findMany({
    where: {
      price: {
        not: null,
      },
    },
  });

  let loyaltyRevenue = new Prisma.Decimal(0);
  let nonLoyaltyRevenue = new Prisma.Decimal(0);
  let loyaltyOrderCount = 0;
  let nonLoyaltyOrderCount = 0;

  orders.forEach((order) => {
    // Ensure order.price is not null before using it, although the query should guarantee this.
    const orderTotal = new Prisma.Decimal(order.price || 0);

    if (order.customerId) {
      loyaltyRevenue = loyaltyRevenue.add(orderTotal);
      loyaltyOrderCount++;
    } else {
      nonLoyaltyRevenue = nonLoyaltyRevenue.add(orderTotal);
      nonLoyaltyOrderCount++;
    }
  });

  const loyaltyAOV =
    loyaltyOrderCount > 0 ? loyaltyRevenue.div(loyaltyOrderCount) : new Prisma.Decimal(0);
  const nonLoyaltyAOV =
    nonLoyaltyOrderCount > 0
      ? nonLoyaltyRevenue.div(nonLoyaltyOrderCount)
      : new Prisma.Decimal(0);

  return {
    loyalty: {
      totalRevenue: loyaltyRevenue.toNumber(),
      orderCount: loyaltyOrderCount,
      averageOrderValue: loyaltyAOV.toNumber(),
    },
    nonLoyalty: {
      totalRevenue: nonLoyaltyRevenue.toNumber(),
      orderCount: nonLoyaltyOrderCount,
      averageOrderValue: nonLoyaltyAOV.toNumber(),
    },
  };
}

/**
 * Gathers all loyalty analytics data.
 * @returns An object containing all loyalty analytics data.
 */
export async function getLoyaltyAnalytics() {
  const [totalMembers, totalPoints, topMembers, newMembers, spendingComparison] =
    await Promise.all([
      getTotalLoyaltyMembers(),
      getTotalRewardPoints(),
      getTopLoyaltyMembers(),
      getNewMembersLastXDays(),
      getSpendingComparison(),
    ]);

  return {
    totalMembers,
    totalPoints,
    topMembers,
    newMembersLast30Days: newMembers,
    spendingComparison,
  };
}
