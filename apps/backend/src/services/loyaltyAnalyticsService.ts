
import { db } from '../db';

/**
 * Gets the total number of loyalty members.
 * @returns The total number of customers.
 */
async function getTotalLoyaltyMembers() {
  const totalMembers = await db.customer.count();
  return totalMembers;
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
    },
  });
  return topMembers;
}

/**
 * Gathers all loyalty analytics data.
 * @returns An object containing all loyalty analytics data.
 */
export async function getLoyaltyAnalytics() {
  const [totalMembers, totalPoints, topMembers] = await Promise.all([
    getTotalLoyaltyMembers(),
    getTotalRewardPoints(),
    getTopLoyaltyMembers(),
  ]);

  return {
    totalMembers,
    totalPoints,
    topMembers,
  };
}
