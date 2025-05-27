import React from 'react';

const Spinner = ({ size = 'md', color = 'apple-blue', className = '' }) => {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-10 w-10',
    };

    const colorClasses = {
        'apple-blue': 'border-apple-blue',
        'white': 'border-white',
        'gray': 'border-apple-gray-500'
    }

    return (
        <div
            className={`animate-spin rounded-full border-2 ${colorClasses[color] || colorClasses['apple-blue']} border-t-transparent ${sizes[size] || sizes['md']} ${className}`}
            role="status"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
};

export default Spinner;