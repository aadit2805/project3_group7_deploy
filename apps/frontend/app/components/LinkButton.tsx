import React from 'react';
import Link from 'next/link';

interface LinkButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export const LinkButton: React.FC<LinkButtonProps> = ({ href, children, className, ariaLabel }) => {
  return (
    <Link
      href={href}
      className={`inline-block bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded ${className}`}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
};
