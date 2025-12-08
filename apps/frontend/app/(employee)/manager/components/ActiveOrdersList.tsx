'use client';

import { useEffect, useState, useCallback } from 'react';

interface Order {
  order_id: number;
  staff_id?: number | null;
  staff_username: string | null;
  datetime: string;
  price: number;
  order_status?: string;
  meal_count?: number;
  customer_name?: string;
  completed_at?: string | null;
}

interface ActiveOrdersListProps {
  variant?: 'active' | 'past';
}

export default function ActiveOrdersList({ variant = 'active' }: ActiveOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kitchenOrderCount, setKitchenOrderCount] = useState<number>(0);

  const fetchOrders = useCallback(async () => {
    try {
      const backendUrl = '';
      const url = variant === 'past' 
        ? `${backendUrl}/api/orders/active?status=addressed&limit=20`
        : `${backendUrl}/api/orders/active`;
      
      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Access denied. Manager role required.');
        }
        throw new Error(`Failed to fetch ${variant === 'past' ? 'past' : 'active'} orders`);
      }

      const result = await response.json();
      if (result.success) {
        setOrders(result.data);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to load orders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${variant === 'past' ? 'past' : 'active'} orders`);
      console.error(`Error fetching ${variant === 'past' ? 'past' : 'active'} orders:`, err);
    } finally {
      setLoading(false);
    }
  }, [variant]);

  const fetchKitchenOrderCount = useCallback(async () => {
    if (variant === 'past') return;
    try {
      const backendUrl = '';
      const response = await fetch(`${backendUrl}/api/orders/kitchen`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setKitchenOrderCount(result.data.length);
        }
      }
    } catch (err) {
      console.error('Error fetching kitchen order count:', err);
    }
  }, [variant]);

  useEffect(() => {
    fetchOrders();
    fetchKitchenOrderCount();
    // Refresh orders every 10 seconds to keep data current
    const interval = setInterval(() => {
      fetchOrders();
      fetchKitchenOrderCount();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchKitchenOrderCount]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Subtract 6 hours to correct for the observed offset in backend stored times
    date.setHours(date.getHours() - 6);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Chicago', // Specify CST
    });
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || 'pending';
    switch (statusLower) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {variant === 'past' ? 'past' : 'active'} orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-semibold">Error</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={fetchOrders}
          className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const isPastOrders = variant === 'past';

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{isPastOrders ? 'Past Orders' : 'Active Orders'}</h2>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      {isPastOrders && (
        <div className="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-blue-800 text-sm">
            Showing the latest 20 addressed orders.
          </p>
        </div>
      )}

      {kitchenOrderCount > 12 && !isPastOrders && (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-yellow-800 font-semibold">
            There is an unusually high ticket count in the kitchen. Staffing shifts might be recommended.
          </p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No {isPastOrders ? 'past' : 'active'} orders found</p>
          <p className="text-gray-500 text-sm mt-2">
            {isPastOrders 
              ? 'Orders marked as addressed on the Prepared Orders page will appear here.'
              : 'All orders are completed or there are no orders in the system.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                {isPastOrders && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                {isPastOrders && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed At
                  </th>
                )}
                {!isPastOrders && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff
                </th>
                {!isPastOrders && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meals
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">#{order.order_id}</span>
                  </td>
                  {isPastOrders && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{order.customer_name || 'Guest'}</span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{formatDate(order.datetime)}</span>
                  </td>
                  {isPastOrders && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {order.completed_at ? formatDate(order.completed_at) : 'N/A'}
                      </span>
                    </td>
                  )}
                  {!isPastOrders && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          order.order_status || 'pending'
                        )}`}
                      >
                        {order.order_status || 'pending'}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {order.staff_username || (isPastOrders ? 'N/A' : `Staff #${order.staff_id || 'N/A'}`)}
                    </span>
                  </td>
                  {!isPastOrders && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{order.meal_count || 0}</span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(order.price)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>Total {isPastOrders ? 'past' : 'active'} orders: {orders.length}{isPastOrders ? ' (showing latest 20)' : ''}</p>
        <p className="text-xs mt-1">Orders refresh automatically every 10 seconds</p>
      </div>
    </div>
  );
}

