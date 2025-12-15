'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEmployee } from '@/app/context/EmployeeContext';

interface ProductUsageItem {
  menu_item_id: number;
  name: string;
  item_type: string;
  count: number;
  inventory_id?: number;
  current_stock?: number;
}

interface ProductUsageData {
  startDate: string;
  endDate: string;
  totalItems: number;
  uniqueItems: number;
  usage: ProductUsageItem[];
}

/**
 * Product Usage Chart page - displays inventory item usage over a selected time period
 * Helps managers track which items are being used most frequently
 */
export default function ProductUsagePage() {
  const { user } = useEmployee();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [data, setData] = useState<ProductUsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default dates to last 7 days
  const setDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Fetch product usage data from API
  const fetchProductUsage = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/product-usage?startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch product usage data');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Export data to CSV
  const exportToCSV = () => {
    if (!data) return;

    const headers = ['Menu Item ID', 'Name', 'Type', 'Count Used', 'Current Stock'];
    const rows = data.usage.map((item) => [
      item.menu_item_id,
      item.name,
      item.item_type,
      item.count,
      item.current_stock ?? 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product-usage-${startDate}-to-${endDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Get color for item type
  const getItemTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'entree':
        return 'bg-red-100 text-red-800';
      case 'side':
        return 'bg-yellow-100 text-yellow-800';
      case 'drink':
        return 'bg-blue-100 text-blue-800';
      case 'appetizer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.role !== 'MANAGER') {
    return (
      <div className="text-center text-red-600 max-w-md mx-auto mt-10">
        <p className="text-xl font-semibold mb-2">Access Denied</p>
        <p>You must be a manager to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <Link href="/dashboard">
          <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 inline-flex items-center min-h-[44px]">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              ></path>
            </svg>
            Back to Dashboard
          </button>
        </Link>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Product Usage Chart</h1>

      {/* Date Range Selection */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Date Range</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchProductUsage}
              disabled={loading}
              className={`w-full px-4 py-2 rounded-md text-white font-semibold min-h-[44px] ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-blue-700'
              }`}
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={setDefaultDates}
              className="w-full px-4 py-2 rounded-md bg-gray-500 hover:bg-gray-600 text-white font-semibold min-h-[44px]"
            >
              Last 7 Days
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Summary Statistics */}
      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Items Used</h3>
              <p className="text-3xl font-bold text-blue-600">{data.totalItems}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Unique Items</h3>
              <p className="text-3xl font-bold text-green-600">{data.uniqueItems}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Date Range</h3>
              <p className="text-sm font-semibold text-gray-700">
                {new Date(data.startDate).toLocaleDateString()} -{' '}
                {new Date(data.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={exportToCSV}
              className="bg-success hover:bg-green-600 text-white px-4 py-2 rounded-md font-semibold min-h-[44px] inline-flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              Export to CSV
            </button>
          </div>

          {/* Product Usage Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Times Used
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.usage.map((item, index) => {
                    const usagePercent = ((item.count / data.totalItems) * 100).toFixed(1);
                    return (
                      <tr key={item.menu_item_id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{index + 1}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getItemTypeColor(item.item_type)}`}
                          >
                            {item.item_type}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {item.count}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.current_stock ?? 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 mr-2">
                              <div className="bg-gray-200 rounded-full h-2 w-24">
                                <div
                                  className="bg-blue-600 rounded-full h-2"
                                  style={{ width: `${usagePercent}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-sm text-gray-700">{usagePercent}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!data && !loading && !error && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            ></path>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select a date range and click &quot;Generate Report&quot; to view product usage.
          </p>
        </div>
      )}
    </div>
  );
}

