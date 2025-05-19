import React from 'react';

// Utility Components
export const SectionHeader = ({ title, children }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="font-semibold text-lg text-blue-900">{title}</h2>
    {children}
  </div>
);

export const ContentBox = ({ children, dir }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-h-[250px] overflow-y-auto [&::-webkit-scrollbar]:hidden" dir={dir}>
    {children}
  </div>
);

// Updated IconButton to handle onClick, disabled, title, and add styling
export const IconButton = ({ icon, color = 'gray', onClick, disabled, title }) => (
  <button
    type="button" // Add type="button" to prevent potential form submission issues
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1 rounded text-${color}-500 hover:bg-gray-100 hover:text-${color === 'gray' ? 'red-500' : color}-700 transition disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {icon}
  </button>
); 