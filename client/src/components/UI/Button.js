import React from 'react';

const Button = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary', 
    size = 'md', 
    className = '',
    disabled = false,
    isLoading = false,
    iconLeft,
    iconRight,
    ...props
}) => {
    const baseStyles = `
        inline-flex items-center justify-center font-medium focus:outline-none
        focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-apple-gray-950
        transition-all duration-150 ease-apple disabled:opacity-50 disabled:cursor-not-allowed
        rounded-apple
    `;
    const variantStyles = {
        primary: "bg-apple-blue text-white hover:bg-apple-blue-dark focus-visible:ring-apple-blue dark:bg-apple-blue-dark dark:hover:bg-apple-blue",
        secondary: "bg-apple-gray-200 text-apple-gray-800 hover:bg-apple-gray-300 dark:bg-apple-gray-700 dark:text-apple-gray-100 dark:hover:bg-apple-gray-600 focus-visible:ring-apple-gray-500 border border-transparent",
        danger: "bg-apple-red text-white hover:bg-red-600 focus-visible:ring-apple-red dark:hover:bg-red-500",
        ghost: "bg-transparent text-apple-blue hover:bg-apple-blue/10 dark:text-apple-blue-light dark:hover:bg-apple-blue-light/10 focus-visible:ring-apple-blue",
        link: "bg-transparent text-apple-blue hover:underline p-0 h-auto dark:text-apple-blue-light focus-visible:ring-apple-blue",
        success: "bg-apple-green text-white hover:bg-green-600 focus-visible:ring-apple-green dark:hover:bg-green-500" // <<<< NEW VARIANT
    };
    const sizeStyles = {
        sm: "px-3 py-1.5 text-xs leading-5",
        md: "px-4 py-2 text-sm leading-5",
        lg: "px-5 py-2.5 text-base leading-6",
    };

    const combinedClassName = `
        ${baseStyles}
        ${variantStyles[variant] || variantStyles.primary}
        ${sizeStyles[size] || sizeStyles.md}
        ${className}
    `;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={combinedClassName.trim().replace(/\s+/g, ' ')}
            {...props}
        >
            {isLoading && (
                <svg className={`animate-spin h-4 w-4 ${iconLeft || iconRight || children ? 'mr-2' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {iconLeft && !isLoading && <span className="mr-2 -ml-1">{iconLeft}</span>}
            {children}
            {iconRight && !isLoading && <span className="ml-2 -mr-1">{iconRight}</span>}
        </button>
    );
};

export default Button;