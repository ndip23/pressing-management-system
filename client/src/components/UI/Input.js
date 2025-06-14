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
    prefixIcon,
    suffixIcon,
    helperText, // <--- ADDED HELPER TEXT PROP
    ...props
}) => {
    const baseInputClasses = `
        form-input block w-full sm:text-sm
        border-apple-gray-300 focus:border-apple-blue focus:ring-apple-blue
        dark:bg-apple-gray-800 dark:border-apple-gray-700 dark:text-apple-gray-100
        dark:placeholder-apple-gray-500 dark:focus:border-apple-blue
        rounded-apple shadow-apple-sm
    `;
    const errorInputClasses = `
        border-apple-red focus:border-apple-red focus:ring-apple-red
        dark:border-apple-red dark:focus:border-apple-red
    `;

    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">
                    {label} {/*{required && <span className="text-apple-red">*</span>}*/}
                </label>
            )}
            <div className="relative rounded-apple shadow-apple-sm">
                {prefixIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {React.cloneElement(prefixIcon, { className: "h-5 w-5 text-apple-gray-500 dark:text-apple-gray-400"})}
                    </div>
                )}
                <input
                    type={type}
                    id={id}
                    name={id || props.name}
                    value={value === null || value === undefined ? '' : value} // Handle null/undefined values for controlled input
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className={`
                        ${baseInputClasses}
                        ${error ? errorInputClasses : ''}
                        ${prefixIcon ? 'pl-10' : 'px-3'}
                        ${suffixIcon ? 'pr-10' : 'px-3'}
                        ${inputClassName}
                    `.trim().replace(/\s+/g, ' ')}
                    {...props}
                />
                {suffixIcon && (
                     <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {React.isValidElement(suffixIcon) ? React.cloneElement(suffixIcon, { className: `h-5 w-5 text-apple-gray-500 dark:text-apple-gray-400 ${suffixIcon.props.onClick ? 'cursor-pointer' : ''}` }) : suffixIcon}
                    </div>
                )}
            </div>
            {error && <p className="mt-1.5 text-xs text-apple-red">{error}</p>}
            {helperText && !error && <p className="mt-1.5 text-xs text-apple-gray-500 dark:text-apple-gray-400">{helperText}</p>} {/* <--- RENDER HELPER TEXT */}
        </div>
    );
};

export default Input;