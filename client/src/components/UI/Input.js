// client/src/components/UI/Input.js
import React from 'react';

const Input = ({
    label,
    id,
    type = "text",
    value,
    onChange,
    placeholder,
    error,
    required,
    className = '',
    inputClassName = '',
    disabled = false,
    prefix, // For text prefix like '$'
    prefixIcon,
    suffixIcon, // Can be a JSX element like an icon or a button with an icon
    helperText,
    containerStyle, // For custom styling on the outer div
    ...props
}) => {
    return (
        
        <div className={`mb-4 ${className}`} style={containerStyle}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">
                    {label}
                </label>
            )}
            <div className="relative rounded-apple shadow-apple-sm">
                {prefix && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-apple-gray-500 sm:text-sm">{prefix}</span>
                    </div>
                )}
                {prefixIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {React.cloneElement(prefixIcon, { className: "h-5 w-5 text-apple-gray-500 dark:text-apple-gray-400"})}
                    </div>
                )}
                <input
                    type={type}
                    id={id}
                    name={id || props.name}
                    value={value === null || value === undefined ? '' : value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className={`
                        form-input block w-full sm:text-sm
                        border-apple-gray-300 focus:border-apple-blue focus:ring-apple-blue
                        dark:bg-apple-gray-800 dark:border-apple-gray-700 dark:text-apple-gray-100
                        dark:placeholder-apple-gray-500 dark:focus:border-apple-blue
                        rounded-apple shadow-apple-sm
                        ${error ? 'border-apple-red focus:border-apple-red focus:ring-apple-red' : ''}
                        ${prefix || prefixIcon ? 'pl-10' : 'px-3'}
                        ${suffixIcon ? 'pr-10' : 'px-3'}
                        ${inputClassName}
                    `.trim().replace(/\s+/g, ' ')}
                    {...props}
                />
                {/* THIS IS THE CORRECTED LOGIC FOR THE SUFFIX ICON */}
                {suffixIcon && (
                     <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {/* This will render whatever JSX element is passed, e.g., a button */}
                        {suffixIcon}
                    </div>
                )}
            </div>
            {error && <p className="mt-1.5 text-xs text-apple-red">{error}</p>}
            {helperText && !error && <p className="mt-1.5 text-xs text-apple-gray-500 dark:text-apple-gray-400">{helperText}</p>}
        </div>
    );
};

export default Input;