import React from 'react';

const Select = ({
    label,
    id,
    value,
    onChange,
    options = [], // [{ value: 'val', label: 'Label' }, ...]
    placeholder,
    error,
    required,
    className = '',
    selectClassName = '',
    disabled = false,
    ...props
}) => {
    const baseSelectClasses = `
        form-select block w-full sm:text-sm
        border-apple-gray-300 focus:border-apple-blue focus:ring-apple-blue
        dark:bg-apple-gray-800 dark:border-apple-gray-700 dark:text-apple-gray-100
        dark:focus:border-apple-blue
        rounded-apple shadow-apple-sm
    `;
    const errorSelectClasses = `
        border-apple-red focus:border-apple-red focus:ring-apple-red
        dark:border-apple-red dark:focus:border-apple-red
    `;

    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">
                    {label} {required && <span className="text-apple-red">*</span>}
                </label>
            )}
            <select
                id={id}
                name={id || props.name}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className={`
                    ${baseSelectClasses}
                    ${error ? errorSelectClasses : ''}
                    ${selectClassName}
                `.trim().replace(/\s+/g, ' ')}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1.5 text-xs text-apple-red">{error}</p>}
        </div>
    );
};

export default Select;