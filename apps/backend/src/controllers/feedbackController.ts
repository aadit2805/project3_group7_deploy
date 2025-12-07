import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const submitFeedback = async (req: Request, res: Response) => {
  const { order_id, rating, comment } = req.body;
  const customer_id = req.customer?.id; // From customerAuth middleware

  if (!customer_id) {
    return res.status(401).json({ success: false, error: 'Customer not authenticated' });
  }

  if (!order_id || !rating) {
    return res.status(400).json({ success: false, error: 'Order ID and rating are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
  }

  try {
    // Verify the order belongs to the customer
    const order = await prisma.order.findFirst({
      where: {
        order_id: parseInt(order_id),
        customerId: customer_id,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found or does not belong to customer' });
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.orderFeedback.findUnique({
      where: { order_id: parseInt(order_id) },
    });

    if (existingFeedback) {
      // Update existing feedback
      const updatedFeedback = await prisma.orderFeedback.update({
        where: { order_id: parseInt(order_id) },
        data: {
          rating,
          comment: comment || null,
        },
      });

      return res.status(200).json({
        success: true,
        data: updatedFeedback,
        message: 'Feedback updated successfully',
      });
    } else {
      // Create new feedback
      const feedback = await prisma.orderFeedback.create({
        data: {
          order_id: parseInt(order_id),
          customer_id,
          rating,
          comment: comment || null,
        },
      });

      return res.status(201).json({
        success: true,
        data: feedback,
        message: 'Feedback submitted successfully',
      });
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getOrderFeedback = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const customer_id = req.customer?.id;

  if (!customer_id) {
    return res.status(401).json({ success: false, error: 'Customer not authenticated' });
  }

  try {
    const feedback = await prisma.orderFeedback.findUnique({
      where: { order_id: parseInt(orderId) },
    });

    if (!feedback) {
      return res.status(404).json({ success: false, error: 'Feedback not found' });
    }

    // Verify the feedback belongs to the customer
    if (feedback.customer_id !== customer_id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    return res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getCustomerFeedbackHistory = async (req: Request, res: Response) => {
  const customer_id = req.customer?.id;

  if (!customer_id) {
    return res.status(401).json({ success: false, error: 'Customer not authenticated' });
  }

  try {
    const feedbackList = await prisma.orderFeedback.findMany({
      where: { customer_id },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: feedbackList,
    });
  } catch (error) {
    console.error('Error fetching feedback history:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// For managers to view all feedback
export const getAllFeedback = async (req: Request, res: Response) => {
  const { minRating, maxRating, startDate, endDate } = req.query;

  try {
    const where: any = {};

    if (minRating) {
      where.rating = { ...where.rating, gte: parseInt(minRating as string) };
    }

    if (maxRating) {
      where.rating = { ...where.rating, lte: parseInt(maxRating as string) };
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.created_at.lte = new Date(endDate as string);
      }
    }

    const feedbackList = await prisma.orderFeedback.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        customer: {
          select: {
            email: true,
            phone_number: true,
          },
        },
      },
    });

    // Calculate average rating
    const avgRating = feedbackList.length > 0
      ? feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        feedback: feedbackList,
        averageRating: avgRating.toFixed(2),
        totalCount: feedbackList.length,
      },
    });
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
};

