import React from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ children, ...props }) => {
  return (
    <button
      {...props}
      className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded"
    >
      {children}
    </button>
  );
};
