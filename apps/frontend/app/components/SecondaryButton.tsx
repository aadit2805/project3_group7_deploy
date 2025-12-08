import React from 'react';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({ children, ...props }) => {
  return (
    <button
      {...props}
      className="bg-secondary hover:bg-secondary-hover text-white font-bold py-2 px-4 rounded"
    >
      {children}
    </button>
  );
};
