'use client';

import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OrderPane, { OrderPaneRef } from '@/app/components/OrderPane';
import LanguageSelector from '@/app/components/LanguageSelector';
import { ViewProvider, useView } from '@/app/context/ViewContext';

function CashierLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const orderPaneRef = useRef<OrderPaneRef>(null);
  const { viewMode, toggleView } = useView();
  
  const handleCashierOrderSubmitSuccess = () => {
    router.push('/cashier-interface');
  };

  // Added key bindings for submitting order and opening accessibility menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (e.key === 'Enter' && !isInputField && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        if (orderPaneRef.current) {
          orderPaneRef.current.submitOrder();
        }
      }

      if (e.key === 'Tab' && !isInputField && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        const accessibilityButton = document.querySelector(
          'button[aria-label="Accessibility settings"]'
        ) as HTMLButtonElement;
        if (accessibilityButton) {
          accessibilityButton.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Cashier Interface</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleView}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            aria-label={`Switch to ${viewMode === 'card' ? 'list' : 'card'} view`}
          >
            <svg
              className="w-5 h-5 mr-2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {viewMode === 'card' ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              )}
            </svg>
            {viewMode === 'card' ? 'List View' : 'Card View'}
          </button>
          <LanguageSelector showLabel={false} />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/3 overflow-y-auto">{children}</div>
        <OrderPane ref={orderPaneRef} onOrderSubmitSuccess={handleCashierOrderSubmitSuccess} />
      </div>
    </div>
  );
}

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  return (
    <ViewProvider>
      <CashierLayoutContent>{children}</CashierLayoutContent>
    </ViewProvider>
  );
}

