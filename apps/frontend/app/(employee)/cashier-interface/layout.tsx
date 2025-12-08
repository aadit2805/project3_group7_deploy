'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import OrderPane from '@/app/components/OrderPane';
import LanguageSelector from '@/app/components/LanguageSelector';
import { ChevronsRight, ChevronsLeft } from 'lucide-react';

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPaneOpen, setIsPaneOpen] = useState(true);

  const handleCashierOrderSubmitSuccess = () => {
    router.push('/cashier-interface');
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-2 flex-shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Cashier Interface</h1>
        <LanguageSelector showLabel={false} />
      </div>
      <div className="flex flex-1 min-h-0 relative">
        <div
          className={`overflow-y-auto transition-all duration-300 ease-in-out ${
            isPaneOpen ? 'lg:w-2/3' : 'lg:w-full'
          }`}
        >
          {children}
        </div>
        <div
          className={`transition-all duration-300 ease-in-out ${
            isPaneOpen ? 'w-full lg:w-1/3' : 'w-0'
          } overflow-hidden`}
        >
          <OrderPane onOrderSubmitSuccess={handleCashierOrderSubmitSuccess} />
        </div>
        <button
          onClick={() => setIsPaneOpen(!isPaneOpen)}
          className="absolute top-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors z-10"
          style={{ right: isPaneOpen ? 'calc(33.33% - 1.5rem)' : '1rem' }}
        >
          {isPaneOpen ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
        </button>
      </div>
    </div>
  );
}
