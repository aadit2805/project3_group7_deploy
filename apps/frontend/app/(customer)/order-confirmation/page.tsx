'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslatedTexts } from '@/app/hooks/useTranslation';
import { useToast } from '@/app/hooks/useToast';

interface OrderData {
  orderId: number;
  date: string;
  total: number;
  status: string;
  customerName: string;
}

const OrderConfirmation = () => {
  const router = useRouter();
  const { addToast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [estimatedPrepTime, setEstimatedPrepTime] = useState<number | null>(null);

  const textLabels = [
    'Order Confirmation',
    'Thank you for your order!',
    'Order Number',
    'Estimated Prep Time',
    'minutes',
    'Total',
    'Your Receipt QR Code',
    'Download QR Code',
    'Rate Your Experience',
    'Submit Feedback',
    'Additional Comments (Optional)',
    'Back to Menu',
    'Feedback submitted successfully!',
    'Failed to submit feedback.',
    'Please select a rating.',
    'Loading...',
    'Reorder',
  ];

  const { translatedTexts } = useTranslatedTexts(textLabels);

  const t = {
    title: translatedTexts[0] || 'Order Confirmation',
    thankYou: translatedTexts[1] || 'Thank you for your order!',
    orderNumber: translatedTexts[2] || 'Order Number',
    estimatedTime: translatedTexts[3] || 'Estimated Prep Time',
    minutes: translatedTexts[4] || 'minutes',
    total: translatedTexts[5] || 'Total',
    qrCode: translatedTexts[6] || 'Your Receipt QR Code',
    downloadQR: translatedTexts[7] || 'Download QR Code',
    rateExperience: translatedTexts[8] || 'Rate Your Experience',
    submitFeedback: translatedTexts[9] || 'Submit Feedback',
    comments: translatedTexts[10] || 'Additional Comments (Optional)',
    backToMenu: translatedTexts[11] || 'Back to Menu',
    feedbackSuccess: translatedTexts[12] || 'Feedback submitted successfully!',
    feedbackFailed: translatedTexts[13] || 'Failed to submit feedback.',
    selectRating: translatedTexts[14] || 'Please select a rating.',
    loading: translatedTexts[15] || 'Loading...',
    reorder: translatedTexts[16] || 'Reorder',
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const lastOrderId = localStorage.getItem('lastOrderId');
      const prepTime = localStorage.getItem('estimatedPrepTime');
      
      if (!lastOrderId) {
        router.push('/meal-type-selection');
        return;
      }

      if (prepTime) {
        setEstimatedPrepTime(parseInt(prepTime));
      }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/orders/${lastOrderId}/qrcode`);

        if (response.ok) {
          const data = await response.json();
          setQrCodeUrl(data.data.qrCode);
          setOrderData(data.data.receiptData);
        } else {
          addToast({ message: 'Failed to load order details', type: 'error' });
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        addToast({ message: 'Error loading order details', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [router, addToast]);

  const handleDownloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `receipt-order-${orderData?.orderId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      addToast({ message: t.selectRating, type: 'error' });
      return;
    }

    const customerToken = localStorage.getItem('customerToken');
    if (!customerToken) {
      addToast({ message: 'Please log in to submit feedback', type: 'error' });
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          order_id: orderData?.orderId,
          rating,
          comment: feedbackComment.trim() || null,
        }),
      });

      if (response.ok) {
        addToast({ message: t.feedbackSuccess, type: 'success' });
        setFeedbackSubmitted(true);
      } else {
        addToast({ message: t.feedbackFailed, type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      addToast({ message: t.feedbackFailed, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-xl">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center text-green-600">{t.title}</h1>
        <p className="text-xl mb-6 text-center">{t.thankYou}</p>

        {orderData && (
          <div className="mb-6 space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-semibold">{t.orderNumber}:</span>
              <span className="text-lg">#{orderData.orderId}</span>
            </div>
            {estimatedPrepTime && (
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded border border-blue-200">
                <span className="font-semibold">{t.estimatedTime}:</span>
                <span className="text-lg font-bold text-blue-700">{estimatedPrepTime} {t.minutes}</span>
              </div>
            )}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-semibold">{t.total}:</span>
              <span className="text-lg">${orderData.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {qrCodeUrl && (
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold mb-3">{t.qrCode}</h2>
            <div className="flex justify-center mb-4">
              <img src={qrCodeUrl} alt="Order Receipt QR Code" className="border-4 border-gray-200 rounded" />
            </div>
            <button
              onClick={handleDownloadQRCode}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
            >
              {t.downloadQR}
            </button>
          </div>
        )}

        {/* Feedback Section */}
        {localStorage.getItem('customerToken') && !feedbackSubmitted && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h2 className="text-xl font-semibold mb-3">{t.rateExperience}</h2>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-4xl transition-all ${
                    star <= rating ? 'text-yellow-500' : 'text-gray-300'
                  } hover:text-yellow-400`}
                  aria-label={`Rate ${star} stars`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder={t.comments}
              className="w-full p-3 border border-gray-300 rounded-md mb-3"
              rows={3}
            />
            <button
              onClick={handleSubmitFeedback}
              className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              {t.submitFeedback}
            </button>
          </div>
        )}

        {feedbackSubmitted && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <p className="text-green-700 font-semibold">{t.feedbackSuccess}</p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Link
            href="/meal-type-selection"
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            {t.backToMenu}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default OrderConfirmation;

