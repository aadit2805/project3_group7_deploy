'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployee } from '@/app/context/EmployeeContext';
import { useToast } from '@/app/hooks/useToast';
import { safeJsonParse } from '@/app/utils/jsonHelper';

interface DailySalesData {
  total_sales: number;
  order_count: number;
  average_order_value: number;
  total_tax: number;
  net_sales: number;
  orders: Array<{
    order_id: number;
    datetime: string;
    price: number;
    order_status: string;
    customer_name: string | null;
  }>;
}

/**
 * Daily Sales page - displays daily sales summary for employees
 * Shows total sales, order count, average order value, and individual orders
 */
export default function DailySalesPage() {
  const router = useRouter();
  const { user } = useEmployee();
  const { addToast } = useToast();
  // State for sales data
  const [salesData, setSalesData] = useState<DailySalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch sales data when date or user changes
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        const backendUrl = '';
        const params = new URLSearchParams();
        params.append('date', selectedDate);
        if (user?.id) {
          params.append('staff_id', user.id.toString());
        }

        const response = await fetch(`${backendUrl}/api/sales/daily?${params.toString()}`, {
          credentials: 'include',
        });

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch sales data');
        }

        const result = await safeJsonParse(response);
        if (result.success) {
          setSalesData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch sales data');
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
        addToast({ message: 'Failed to load daily sales summary', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [selectedDate, user, router, addToast]);

  // Format currency values for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date and time for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-xl text-gray-600">Loading daily sales summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Daily Sales Summary</h1>
          <div className="flex items-center gap-4">
            <label htmlFor="date-select" className="text-sm font-semibold text-gray-700">
              Date:
            </label>
            <input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Select date for sales summary"
            />
          </div>
        </div>

        {salesData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Sales</h3>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(salesData.total_sales)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Orders</h3>
                <p className="text-3xl font-bold text-green-600">{salesData.order_count}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Avg Order Value</h3>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(salesData.average_order_value)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Tax</h3>
                <p className="text-3xl font-bold text-orange-600">{formatCurrency(salesData.total_tax)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Net Sales</h3>
                <p className="text-3xl font-bold text-indigo-600">{formatCurrency(salesData.net_sales)}</p>
              </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Order Details</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesData.orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No orders found for this date
                        </td>
                      </tr>
                    ) : (
                      salesData.orders.map((order) => (
                        <tr key={order.order_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.order_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(order.datetime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.customer_name || 'Guest'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                order.order_status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : order.order_status === 'addressed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {order.order_status || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                            {formatCurrency(order.price)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {salesData.orders.length > 0 && (
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                          Total:
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                          {formatCurrency(salesData.total_sales)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">No sales data available for the selected date.</p>
          </div>
        )}
      </div>
    </div>
  );
}


