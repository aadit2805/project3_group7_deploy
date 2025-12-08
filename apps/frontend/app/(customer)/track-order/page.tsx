'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslatedTexts } from '@/app/hooks/useTranslation';
import { useToast } from '@/app/hooks/useToast';

interface OrderStatus {
  order_id: number;
  order_status: string;
  datetime: string;
  price: number;
  estimated_prep_time: number;
  completed_at: string | null;
  elapsed_minutes: number;
  remaining_minutes: number;
}

/**
 * Track Order page - allows customers to track their order status
 * Displays real-time order status, estimated prep time, and time remaining
 */
const TrackOrderContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  // State for order tracking
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);

  const textLabels = [
    'Track Your Order',
    'Order Status',
    'Order Number',
    'Estimated Prep Time',
    'Time Remaining',
    'Time Elapsed',
    'Order Total',
    'Order Placed',
    'Status',
    'Pending',
    'In Progress',
    'Completed',
    'Ready for Pickup',
    'Order not found',
    'Loading order status...',
    'Failed to load order status',
    'minutes',
    'Back to Menu',
    'View Order Details',
    'Your order is being prepared',
    'Your order is ready for pickup!',
    'Order completed',
  ];

  const { translatedTexts } = useTranslatedTexts(textLabels);

  const t = {
    title: translatedTexts[0] || 'Track Your Order',
    orderStatus: translatedTexts[1] || 'Order Status',
    orderNumber: translatedTexts[2] || 'Order Number',
    estimatedTime: translatedTexts[3] || 'Estimated Prep Time',
    timeRemaining: translatedTexts[4] || 'Time Remaining',
    timeElapsed: translatedTexts[5] || 'Time Elapsed',
    orderTotal: translatedTexts[6] || 'Order Total',
    orderPlaced: translatedTexts[7] || 'Order Placed',
    status: translatedTexts[8] || 'Status',
    pending: translatedTexts[9] || 'Pending',
    inProgress: translatedTexts[10] || 'In Progress',
    completed: translatedTexts[11] || 'Completed',
    readyForPickup: translatedTexts[12] || 'Ready for Pickup',
    orderNotFound: translatedTexts[13] || 'Order not found',
    loading: translatedTexts[14] || 'Loading order status...',
    error: translatedTexts[15] || 'Failed to load order status',
    minutes: translatedTexts[16] || 'minutes',
    backToMenu: translatedTexts[17] || 'Back to Menu',
    viewDetails: translatedTexts[18] || 'View Order Details',
    beingPrepared: translatedTexts[19] || 'Your order is being prepared',
    readyMessage: translatedTexts[20] || 'Your order is ready for pickup!',
    completedMessage: translatedTexts[21] || 'Order completed',
  };

  // Get order ID from URL params or localStorage
  useEffect(() => {
    const urlOrderId = searchParams.get('orderId');
    const storedOrderId = localStorage.getItem('lastOrderId');
    const id = urlOrderId || storedOrderId;
    
    if (!id) {
      addToast({ message: t.orderNotFound, type: 'error' });
      router.push('/meal-type-selection');
      return;
    }

    setOrderId(id);
  }, [searchParams, router, addToast, t.orderNotFound]);

  // Poll for order status updates every 5 seconds
  useEffect(() => {
    if (!orderId) return;

    const fetchOrderStatus = async () => {
      try {
        const backendUrl = '';
        const customerToken = localStorage.getItem('customerToken');
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (customerToken) {
          headers['Authorization'] = `Bearer ${customerToken}`;
        }

        const response = await fetch(`${backendUrl}/api/orders/${orderId}/status`, {
          credentials: 'include',
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setOrderStatus(data.data);
            setLoading(false);
          } else {
            addToast({ message: t.orderNotFound, type: 'error' });
            setLoading(false);
          }
        } else if (response.status === 404) {
          addToast({ message: t.orderNotFound, type: 'error' });
          setLoading(false);
        } else {
          throw new Error('Failed to fetch order status');
        }
      } catch (error) {
        console.error('Error fetching order status:', error);
        addToast({ message: t.error, type: 'error' });
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchOrderStatus();

    // Poll every 5 seconds if order is not completed
    const interval = setInterval(() => {
      if (orderStatus && orderStatus.order_status !== 'completed' && orderStatus.order_status !== 'addressed') {
        fetchOrderStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId, orderStatus, addToast, t.orderNotFound, t.error]); // Added orderStatus to dependencies

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'in_progress':
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'addressed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return t.pending;
      case 'in_progress':
      case 'preparing':
        return t.inProgress;
      case 'completed':
        return t.readyForPickup;
      case 'addressed':
        return t.completed;
      default:
        return status || t.pending;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'in_progress':
      case 'preparing':
        return t.beingPrepared;
      case 'completed':
        return t.readyMessage;
      case 'addressed':
        return t.completedMessage;
      default:
        return t.beingPrepared;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-xl text-gray-600">{t.loading}</p>
      </div>
    );
  }

  if (!orderStatus) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-xl text-red-600 mb-4">{t.orderNotFound}</p>
        <Link
          href="/meal-type-selection"
          className="inline-block bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          aria-label={t.backToMenu}
        >
          {t.backToMenu}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">{t.title}</h1>

      <div className="max-w-2xl mx-auto">
        {/* Order Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="text-center mb-4 sm:mb-6">
            <div className={`inline-block px-4 sm:px-6 py-2 sm:py-3 rounded-full border-2 font-semibold text-base sm:text-lg ${getStatusColor(orderStatus.order_status)}`}>
              {getStatusText(orderStatus.order_status)}
            </div>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-700">{getStatusMessage(orderStatus.order_status)}</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-600">{t.timeElapsed}</span>
              <span className="text-sm font-semibold text-gray-600">{t.timeRemaining}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (orderStatus.elapsed_minutes / orderStatus.estimated_prep_time) * 100)}%`,
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
              <span>{orderStatus.elapsed_minutes} {t.minutes}</span>
              <span>{orderStatus.remaining_minutes} {t.minutes}</span>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">{t.orderNumber}:</span>
              <span className="text-lg font-bold">#{orderStatus.order_id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">{t.orderPlaced}:</span>
              <span className="text-gray-600">{formatDate(orderStatus.datetime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">{t.estimatedTime}:</span>
              <span className="text-gray-600">{orderStatus.estimated_prep_time} {t.minutes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">{t.orderTotal}:</span>
              <span className="text-lg font-bold text-green-600">${orderStatus.price.toFixed(2)}</span>
            </div>
            {orderStatus.completed_at && (
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">{t.completed}:</span>
                <span className="text-gray-600">{formatDate(orderStatus.completed_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t.orderStatus}</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-4 ${
                orderStatus.order_status === 'pending' || orderStatus.order_status === 'in_progress' || orderStatus.order_status === 'completed' || orderStatus.order_status === 'addressed'
                  ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div>
                <p className="font-semibold">{t.pending}</p>
                <p className="text-sm text-gray-600">{formatDate(orderStatus.datetime)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-4 ${
                orderStatus.order_status === 'in_progress' || orderStatus.order_status === 'completed' || orderStatus.order_status === 'addressed'
                  ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div>
                <p className="font-semibold">{t.inProgress}</p>
                <p className="text-sm text-gray-600">{t.beingPrepared}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-4 ${
                orderStatus.order_status === 'completed' || orderStatus.order_status === 'addressed'
                  ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div>
                <p className="font-semibold">{t.readyForPickup}</p>
                {orderStatus.completed_at && (
                  <p className="text-sm text-gray-600">{formatDate(orderStatus.completed_at)}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            href="/order-confirmation"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 sm:px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-center"
            aria-label={t.viewDetails}
          >
            {t.viewDetails}
          </Link>
          <Link
            href="/meal-type-selection"
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 sm:px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-center"
            aria-label={t.backToMenu}
          >
            {t.backToMenu}
          </Link>
        </div>
      </div>
    </div>
  );
};

const Loading = () => (
  <div className="container mx-auto px-4 py-8 text-center">
    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
    <p className="text-xl text-gray-600">Loading order status...</p>
  </div>
);

const TrackOrderPage = () => (
  <Suspense fallback={<Loading />}>
    <TrackOrderContent />
  </Suspense>
);

export default TrackOrderPage;

