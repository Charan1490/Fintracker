import React from 'react';

export default function Spinner({ size = 'md', color = 'blue' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4'
  };
  
  const colorClasses = {
    blue: 'border-blue-600',
    indigo: 'border-indigo-600',
    purple: 'border-purple-600',
    red: 'border-red-600',
    green: 'border-green-600',
    gray: 'border-gray-600'
  };
  
  const spinnerSize = sizeClasses[size] || sizeClasses.md;
  const spinnerColor = colorClasses[color] || colorClasses.blue;
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`animate-spin rounded-full ${spinnerSize} border-t-transparent ${spinnerColor}`}
        role="status"
        aria-label="Loading"
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
} 