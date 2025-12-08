'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

type ViewMode = 'card' | 'list';

interface ViewContextType {
  viewMode: ViewMode;
  toggleView: () => void;
}

export const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider = ({ children }: { children: ReactNode }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  const toggleView = () => {
    setViewMode((prev) => (prev === 'card' ? 'list' : 'card'));
  };

  return (
    <ViewContext.Provider value={{ viewMode, toggleView }}>
      {children}
    </ViewContext.Provider>
  );
};

export const useView = () => {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
};

