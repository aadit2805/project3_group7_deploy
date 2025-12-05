
import { Request, Response } from 'express';
import * as loyaltyAnalyticsService from '../services/loyaltyAnalyticsService';

/**
 * Handles the request to get loyalty analytics data.
 * @param req The Express request object.
 * @param res The Express response object.
 */
export async function getLoyaltyAnalytics(_req: Request, res: Response) {
  try {
    const analyticsData = await loyaltyAnalyticsService.getLoyaltyAnalytics();
    res.status(200).json(analyticsData);
  } catch (error) {
    console.error('Error fetching loyalty analytics:', error);
    res.status(500).json({ message: 'Error fetching loyalty analytics' });
  }
}
