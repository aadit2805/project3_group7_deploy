'use client';

import React from 'react';
import LanguageSelector from '@/app/components/LanguageSelector';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Customer Kiosk</h1>
        <LanguageSelector showLabel={false} />
      </div>
      {children}
    </div>
  );
}
