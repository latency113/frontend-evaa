import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:ring-4 focus:outline-none";
  
  const variants = {
    primary: "text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300",
    secondary: "text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 focus:ring-gray-200",
    danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-300",
    outline: "text-blue-700 border border-blue-700 hover:bg-blue-800 hover:text-white"
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-5 py-3 text-base"
  };

  const isDisabled = disabled || isLoading;
  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`;

  return (
    <button className={classes} disabled={isDisabled} {...props}>
      {isLoading ? (
        <svg className="w-5 h-5 mr-2 text-white animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
};
