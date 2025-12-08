'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import OrderPane from '@/app/components/OrderPane';
import LanguageSelector from '@/app/components/LanguageSelector';

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const handleCashierOrderSubmitSuccess = () => {
    router.push('/cashier-interface');
  };
  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-2 flex-shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Cashier Interface</h1>
        <LanguageSelector showLabel={false} />
      </div>
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        <div className="w-full lg:w-2/3 overflow-y-auto">{children}</div>
        <div className="w-full lg:w-1/3 overflow-y-auto">
          <OrderPane onOrderSubmitSuccess={handleCashierOrderSubmitSuccess} />
        </div>
      </div>
    </div>
  );
}

