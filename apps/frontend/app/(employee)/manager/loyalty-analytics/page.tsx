'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import apiClient from '../../../utils/apiClient';
import ClientOnly from '../../../components/ClientOnly';

// Define the types for the analytics data
interface TopMember {
  id: string;
  email: string;
  rewards_points: number;
  createdAt: string;
}

interface SpendingStats {
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
}

interface LoyaltyAnalyticsData {
  totalMembers: number;
  totalPoints: number;
  topMembers: TopMember[];
  newMembersLast30Days: number;
  spendingComparison: {
    loyalty: SpendingStats;
    nonLoyalty: SpendingStats;
  };
}

// A simple card component to display a stat
const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);

// Formatter for currency
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const LoyaltyAnalyticsPage = () => {
  const [data, setData] = useState<LoyaltyAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // apiClient is a fetch wrapper, not an axios-like object.
        const response = await apiClient('/api/analytics/loyalty');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to fetch analytics data.');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return <p>No data available.</p>;
  }

  const revenueChartData = [
    {
      name: 'Loyalty',
      Revenue: data.spendingComparison.loyalty.totalRevenue,
    },
    {
      name: 'Non-Loyalty',
      Revenue: data.spendingComparison.nonLoyalty.totalRevenue,
    },
  ];

  const aovChartData = [
    {
      name: 'Loyalty',
      'Avg. Order Value': data.spendingComparison.loyalty.averageOrderValue,
    },
    {
      name: 'Non-Loyalty',
      'Avg. Order Value': data.spendingComparison.nonLoyalty.averageOrderValue,
    },
  ];

  return (
    <ClientOnly>
      {() => (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
          <h1 className="text-3xl font-bold mb-6">Loyalty Program Analytics</h1>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Loyalty Members" value={data.totalMembers} />
            <StatCard title="New Members (Last 30d)" value={data.newMembersLast30Days} />
            <StatCard
              title="Total Points in Circulation"
              value={data.totalPoints.toLocaleString()}
            />
            <StatCard
              title="Avg. Loyalty Order Value"
              value={currencyFormatter.format(data.spendingComparison.loyalty.averageOrderValue)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Spending Comparison Charts */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Total Revenue Comparison</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData} margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => currencyFormatter.format(value)} />
                    <Tooltip formatter={(value) => currencyFormatter.format(Number(value))} />
                    <Legend />
                    <Bar dataKey="Revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Avg. Order Value Comparison</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={aovChartData} margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => currencyFormatter.format(value)} />
                    <Tooltip formatter={(value) => currencyFormatter.format(Number(value))} />
                    <Legend />
                    <Bar dataKey="Avg. Order Value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top 10 Members List */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Top 10 Loyalty Members</h2>
              <div className="overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  {data.topMembers.map((member, index) => (
                    <li key={member.id} className="py-3">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <span className="text-gray-500">{index + 1}.</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            Joined: {new Date(member.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-indigo-600">
                            {member.rewards_points.toLocaleString()} pts
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </ClientOnly>
  );
};

export default LoyaltyAnalyticsPage;