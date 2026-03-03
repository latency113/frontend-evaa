import React from "react";

interface CardProps {
  title: string;
  value: string | number;
  description?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, value, description, onClick, icon, className = "" }) => {
  return (
    <div 
      onClick={onClick}
      className={`block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow ${onClick ? 'hover:bg-gray-100 cursor-pointer' : ''} dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors ${className}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          {title}
        </h5>
        {icon && <div className="text-blue-600 dark:text-blue-400 text-3xl">{icon}</div>}
      </div>
      <p className="font-normal text-gray-700 dark:text-gray-400 mb-2">
        <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-500">{value}</span>
      </p>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
  );
};
