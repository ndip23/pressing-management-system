import React from 'react';

const Card = ({ children, className = '', title, actions, titleClassName='', contentClassName='', actionsClassName='' }) => {
    return (
        <div className={`bg-white dark:bg-apple-gray-900 rounded-apple-lg shadow-apple overflow-hidden ${className}`}>
            {title && (
                <div className={`px-4 py-4 sm:px-6 border-b border-apple-gray-200 dark:border-apple-gray-800 ${titleClassName}`}>
                    {typeof title === 'string' ? (
                        <h3 className="text-lg leading-6 font-semibold text-apple-gray-900 dark:text-apple-gray-100">
                            {title}
                        </h3>
                    ) : title }
                </div>
            )}
            <div className={`p-4 sm:p-6 ${contentClassName}`}>
                {children}
            </div>
            {actions && (
                <div className={`px-4 py-3 sm:px-6 bg-apple-gray-50 dark:bg-apple-gray-950/50 border-t border-apple-gray-200 dark:border-apple-gray-800 ${actionsClassName}`}>
                    {actions}
                </div>
            )}
        </div>
    );
};

export default Card;