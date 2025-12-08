import React from 'react';

interface DangerBadgeProps {
  children: React.ReactNode;
}

export const DangerBadge: React.FC<DangerBadgeProps> = ({ children }) => {
  return (
    <span className="bg-danger text-white font-bold py-1 px-2 rounded">
      {children}
    </span>
  );
};
