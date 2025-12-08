'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, DollarSign, ShoppingCart, TrendingUp, Users, CreditCard, Clock, Printer, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/app/hooks/useToast';
import { safeJsonParse } from '@/app/utils/jsonHelper';
import ConfirmationModal from '@/app/components/ConfirmationModal';

interface ZReportData {
  report_type: string;
  report_date: string;
  report_time: string;
  is_closing_report: boolean;
  status: string;
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
}

interface ZReportHistoryItem {
  summary_id: number;
  business_date: string;
  total_sales: number;
  total_tax: number;
  net_sales: number;
  order_count: number;
  status: string;
  opened_at: string;
  closed_at: string;
}

/**
 * Z Report Page (Manager only)
 * End-of-day closing report that closes the register
 */
export default function ZReportPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [reportData, setReportData] = useState<ZReportData | null>(null);
  const [history, setHistory] = useState<ZReportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/reports/z-report/history?limit=10', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await safeJsonParse(response);
        if (result.success) {
          setHistory(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching Z Report history:', error);
    }
  };

  useEffect(() => {
    const checkExistingReport = async () => {
      try {
        setLoading(true);
        
        // Check if Z Report already exists for today
        const response = await fetch('/api/reports/z-report/today', {
          credentials: 'include',
        });

        if (response.ok) {
          const result = await safeJsonParse(response);
          if (result.success && result.data) {
            // Z Report already generated for today, display it
            setReportData(result.data);
            addToast({ 
              message: 'Displaying today\'s Z Report', 
              type: 'success' 
            });
          }
        }

        // Fetch history
        await fetchHistory();
      } catch (error) {
        console.error('Error checking Z Report:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingReport();
  }, [addToast]);

  const generateZReport = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/reports/z-report', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const result = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate Z Report');
      }

      if (result.success) {
        setReportData(result.data);
        addToast({ message: result.message || 'Z Report generated successfully', type: 'success' });
        // Refresh history
        await fetchHistory();
      }
    } catch (error: any) {
      console.error('Error generating Z Report:', error);
      addToast({ message: error.message || 'Failed to generate Z Report', type: 'error' });
    } finally {
      setGenerating(false);
      setShowConfirmModal(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
          <p className="text-xl text-gray-600">Loading Z Report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="h-8 w-8 text-red-600" />
                Z Report (End-of-Day)
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Final sales report - closes the register for the day
              </p>
            </div>
            <div className="flex gap-2 print:hidden">
              <button
                onClick={() => setShowHistoryModal(true)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                View History
              </button>
              {!reportData && (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={generating}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  {generating ? 'Generating...' : 'Generate Z Report & Close Day'}
                </button>
              )}
              {reportData && (
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
              )}
            </div>
          </div>

          {!reportData && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                <div>
                  <p className="text-sm text-yellow-700">
                    <strong>Warning:</strong> Generating a Z Report will close the day and cannot be undone. 
                    This should only be done at the end of business day.
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Use X Report for mid-day sales summaries.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Report Display */}
        {reportData ? (
          <>
            {/* Success Banner */}
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 print:hidden">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <p className="text-sm text-green-700">
                  <strong>Day Closed:</strong> Z Report generated successfully for {reportData.report_date}
                </p>
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
                  Business Hours
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
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.staff_breakdown.map((staff) => (
                      <tr key={staff.staff_id} className="border-t">
                        <td className="px-4 py-2">{staff.username}</td>
                        <td className="px-4 py-2 text-right">{staff.order_count}</td>
                        <td className="px-4 py-2 text-right font-semibold">{formatCurrency(staff.total_sales)}</td>
                        <td className="px-4 py-2 text-right text-sm text-gray-600">
                          {reportData.summary.total_sales > 0
                            ? `${((staff.total_sales / reportData.summary.total_sales) * 100).toFixed(1)}%`
                            : '0%'}
                        </td>
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
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.payment_breakdown.map((payment) => (
                      <tr key={payment.payment_method} className="border-t">
                        <td className="px-4 py-2 capitalize">{payment.payment_method}</td>
                        <td className="px-4 py-2 text-right">{payment.count}</td>
                        <td className="px-4 py-2 text-right font-semibold">{formatCurrency(payment.total)}</td>
                        <td className="px-4 py-2 text-right text-sm text-gray-600">
                          {reportData.summary.total_sales > 0
                            ? `${((payment.total / reportData.summary.total_sales) * 100).toFixed(1)}%`
                            : '0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Z Report Generated Yet</h2>
            <p className="text-gray-600 mb-6">
              Click the button above to generate the end-of-day report and close the register.
            </p>
            <p className="text-sm text-gray-500">
              This action will finalize today&apos;s sales and create a permanent record.
            </p>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">Z Report History</h2>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {history.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No historical Z Reports found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Date</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Orders</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Total Sales</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Tax</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Net Sales</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Closed At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((report) => (
                          <tr key={report.summary_id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2">{formatDate(report.business_date)}</td>
                            <td className="px-4 py-2 text-right">{report.order_count}</td>
                            <td className="px-4 py-2 text-right font-semibold">{formatCurrency(report.total_sales)}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(report.total_tax)}</td>
                            <td className="px-4 py-2 text-right font-semibold">{formatCurrency(report.net_sales)}</td>
                            <td className="px-4 py-2">{formatDateTime(report.closed_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="p-6 border-t flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          title="Generate Z Report & Close Day?"
          message="This will close the register for today and create a final sales report. This action cannot be undone. Are you sure you want to continue?"
          onConfirm={generateZReport}
          onClose={() => setShowConfirmModal(false)}
          confirmText="Yes, Close Day"
          cancelText="Cancel"
        />

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            body {
              background: white;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

