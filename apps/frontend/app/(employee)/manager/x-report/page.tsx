'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, DollarSign, ShoppingCart, TrendingUp, Users, CreditCard, Clock, Printer } from 'lucide-react';
import { useToast } from '@/app/hooks/useToast';
import { safeJsonParse } from '@/app/utils/jsonHelper';

interface XReportData {
  report_type: string;
  report_date: string;
  report_time: string;
  is_closing_report: boolean;
  summary: {
    total_sales: number;
    order_count: number;
    average_order_value: number;
    total_tax: number;
    net_sales: number;
    first_transaction: string | null;
    last_transaction: string | null;
  };
  order_status_breakdown: Array<{
    status: string;
    count: number;
    total: number;
  }>;
  staff_breakdown: Array<{
    staff_id: number;
    username: string;
    order_count: number;
    total_sales: number;
  }>;
  payment_breakdown: Array<{
    payment_method: string;
    count: number;
    total: number;
  }>;
  recent_orders: Array<{
    order_id: number;
    datetime: string;
    price: number;
    order_status: string;
    customer_name: string;
    staff_username: string;
  }>;
}

/**
 * X Report Page (Manager only)
 * Mid-day sales report that shows current sales without closing the register
 */
export default function XReportPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [reportData, setReportData] = useState<XReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchXReport = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports/x-report', {
        credentials: 'include',
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch X Report');
      }

      const result = await safeJsonParse(response);
      if (result.success) {
        setReportData(result.data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error fetching X Report:', error);
      addToast({ message: 'Failed to load X Report', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchXReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-xl text-gray-600">Loading X Report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">No report data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 print:mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="h-8 w-8" />
                X Report (Mid-Day)
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Non-closing sales report for {reportData.report_date}
              </p>
            </div>
            <div className="flex gap-2 print:hidden">
              <button
                onClick={fetchXReport}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Total Sales</h3>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(reportData.summary.total_sales)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Orders</h3>
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{reportData.summary.order_count}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Avg Order</h3>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(reportData.summary.average_order_value)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Tax Collected</h3>
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {formatCurrency(reportData.summary.total_tax)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Net Sales</h3>
              <DollarSign className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-indigo-600">
              {formatCurrency(reportData.summary.net_sales)}
            </p>
          </div>
        </div>

        {/* Transaction Times */}
        {reportData.summary.first_transaction && reportData.summary.last_transaction && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Transaction Times
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">First Transaction</p>
                <p className="text-lg font-semibold">{formatDateTime(reportData.summary.first_transaction)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Transaction</p>
                <p className="text-lg font-semibold">{formatDateTime(reportData.summary.last_transaction)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Status Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Count</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {reportData.order_status_breakdown.map((status) => (
                  <tr key={status.status} className="border-t">
                    <td className="px-4 py-2 capitalize">{status.status}</td>
                    <td className="px-4 py-2 text-right">{status.count}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatCurrency(status.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Staff Member</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Orders</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {reportData.staff_breakdown.map((staff) => (
                  <tr key={staff.staff_id} className="border-t">
                    <td className="px-4 py-2">{staff.username}</td>
                    <td className="px-4 py-2 text-right">{staff.order_count}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatCurrency(staff.total_sales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Method</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Transactions</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {reportData.payment_breakdown.map((payment) => (
                  <tr key={payment.payment_method} className="border-t">
                    <td className="px-4 py-2 capitalize">{payment.payment_method}</td>
                    <td className="px-4 py-2 text-right">{payment.count}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatCurrency(payment.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Orders (Last 10)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Order ID</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Time</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Staff</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {reportData.recent_orders.map((order) => (
                  <tr key={order.order_id} className="border-t">
                    <td className="px-4 py-2">#{order.order_id}</td>
                    <td className="px-4 py-2">{formatDateTime(order.datetime)}</td>
                    <td className="px-4 py-2">{order.customer_name}</td>
                    <td className="px-4 py-2">{order.staff_username}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          order.order_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.order_status === 'addressed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.order_status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">{formatCurrency(order.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            body {
              background: white;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:mb-4 {
              margin-bottom: 1rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

