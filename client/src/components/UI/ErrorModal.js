// client/src/components/UI/ErrorModal.js
import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, X } from 'lucide-react';

const ErrorModal = ({ isOpen, onClose, errorMessage }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="An Error Occurred" size="sm">
            <div className="flex flex-col items-center text-center p-4">
                <AlertTriangle size={48} className="text-apple-red mb-4" />
                <p className="text-apple-gray-700 dark:text-apple-gray-300">
                    {errorMessage || 'An unexpected error occurred. Please try again.'}
                </p>
            </div>
            <div className="mt-4 pt-4 border-t dark:border-apple-gray-700 flex justify-center">
                <Button variant="primary" onClick={onClose} iconLeft={<X size={16}/>}>
                    Close
                </Button>
            </div>
        </Modal>
    );
};

export default ErrorModal;