'use client';

import React, { useState, useEffect } from 'react';
import { useEmployee } from '../../../context/EmployeeContext';
import { useRouter } from 'next/navigation';
import apiClient from '../../../utils/apiClient';

interface LoyaltyAnalytics {
  totalMembers: number;
  totalPoints: number;
  topMembers: { id: string; email: string; rewardPoints: number }[];
}

const LoyaltyAnalyticsPage: React.FC = () => {
  const { user } = useEmployee(); // Removed 'loading'
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState<LoyaltyAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<boolean>(true); // New loading state for analytics data

  useEffect(() => {
    // Redirect if not authenticated or not a manager
    // The previous 'loading' check is removed as useEmployee doesn't provide it
    if (!user || user.role !== 'manager') {
      router.push('/login'); // Redirect to login page
    }
  }, [user, router]); // Depend only on user and router

  useEffect(() => {
    const getAnalytics = async () => {
      setIsLoadingAnalytics(true); // Start loading
      try {
        const response = await apiClient('/api/loyalty-analytics');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        setError('Failed to fetch loyalty analytics.');
        console.error('Error fetching loyalty analytics:', err);
      } finally {
        setIsLoadingAnalytics(false); // End loading
      }
    };

    if (user && user.role === 'manager') {
      getAnalytics();
    } else {
      // If user is not manager or not available, stop loading analytics
      setIsLoadingAnalytics(false);
    }
  }, [user]);

  // Removed if (loading) { return <p>Loading authentication...</p>; }

  if (!user || user.role !== 'manager') {
    return <p>Access Denied</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (isLoadingAnalytics || !analyticsData) { // Use new loading state
    return <p>Loading loyalty analytics...</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Loyalty Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700">Total Loyalty Members</h2>
          <p className="text-3xl font-bold text-indigo-600">{analyticsData.totalMembers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700">Total Reward Points in Circulation</h2>
          <p className="text-3xl font-bold text-green-600">{analyticsData.totalPoints}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 incomprehensibletext-gray-800">Top Loyalty Members</h2>
        {analyticsData.topMembers.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reward Points
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.topMembers.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.rewardPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600">No top loyalty members to display yet.</p>
        )}
      </div>
    </div>
  );
};

export default LoyaltyAnalyticsPage;
