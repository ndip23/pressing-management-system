import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({ isOpen, onClose, title, children, footerActions, size = 'md' }) => {
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-apple-gray-900/60 backdrop-blur-sm p-4 transition-opacity duration-300 ease-apple"
            onClick={onClose} // Close on backdrop click
        >
            <div
                className={`bg-white dark:bg-apple-gray-900 rounded-apple-lg shadow-apple-xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh] transform transition-all duration-300 ease-apple scale-95 opacity-0 animate-modal-appear`}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                style={{ animationFillMode: 'forwards' }} // Keep final state of animation
            >
                <div className="flex items-center justify-between p-4 border-b border-apple-gray-200 dark:border-apple-gray-800">
                    {title && <h3 className="text-lg font-semibold text-apple-gray-900 dark:text-apple-gray-100">{title}</h3>}
                    <Button variant="ghost" size="sm" onClick={onClose} className="p-1 -mr-1">
                        <X size={20} />
                    </Button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
                    {children}
                </div>

                {footerActions && (
                    <div className="p-4 border-t border-apple-gray-200 dark:border-apple-gray-800 flex justify-end space-x-3 bg-apple-gray-50 dark:bg-apple-gray-950/50">
                        {footerActions}
                    </div>
                )}
            </div>
            {/* Add keyframes for modal-appear animation in your global CSS or Tailwind config */}
            <style jsx global>{`
                @keyframes modal-appear {
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-modal-appear {
                    animation-name: modal-appear;
                    animation-duration: 0.2s; /* Adjust duration as needed */
                    animation-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
                }
            `}</style>
        </div>
    );
};

export default Modal;