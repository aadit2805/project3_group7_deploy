import React from 'react';

interface AccessibleSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const AccessibleSearchInput: React.FC<AccessibleSearchInputProps> = ({ label, ...props }) => {
  const id = props.id || 'search-input';
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input type="search" id={id} {...props} />
    </div>
  );
};
