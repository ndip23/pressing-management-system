import React, { useEffect, useState, useCallback } from 'react';
import { useLocation,  Link } from 'react-router-dom';
import { verifyPaymentAndFinalizeApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../../components/UI/Spinner';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyPaymentPage = () => {
    const location = useLocation();
    
    const { loginWithToken } = useAuth();
    
    const [statusMessage, setStatusMessage] = useState('Verifying your payment...');
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [needsLogin, setNeedsLogin] = useState(false);

    // ✅ Wrap verifyWithRetry in useCallback to satisfy ESLint
    const verifyWithRetry = useCallback(async (transactionId, email, attempt = 0) => {
        try {
            const { data } = await verifyPaymentAndFinalizeApi({ transaction_id: transactionId, email });
            
            setStatusMessage("Payment confirmed! Creating your account...");
            
            if (data?.token) {
                await loginWithToken(data.token);
                setIsSuccess(true);
                toast.success("Account created successfully!");
                setTimeout(() => {
                    window.location.href = '/app/dashboard';
                }, 1500);
            } else {
                setNeedsLogin(true);
                setStatusMessage('Payment confirmed. Please log in to continue.');
            }
        } catch (err) {
            if (attempt < 5) {
                setTimeout(() => verifyWithRetry(transactionId, email, attempt + 1), 2000);
            } else {
                setError("Payment verification timed out. Please contact support.");
            }
        }
    }, [loginWithToken]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const transactionId = params.get('transaction_id');
        const email = params.get('email');

        if (!transactionId) {
            setError("Invalid verification link.");
            return;
        }

        verifyWithRetry(transactionId, email);
    }, [location.search, verifyWithRetry]); // ✅ Dependencies are now clean

    return (
        <div className="min-h-screen bg-apple-gray-50 dark:bg-apple-gray-950 flex flex-col items-center justify-center text-center p-4">
            {error ? (
                <div className="flex flex-col items-center max-w-md">
                    <AlertTriangle size={48} className="text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-red-500">Verification Failed</h1>
                    <p className="mt-2 text-gray-600 dark:text-apple-gray-400">{error}</p>
                    <Link to="/contact" className="mt-6 text-apple-blue underline font-semibold">Contact Support</Link>
                </div>
            ) : isSuccess ? (
                <div className="flex flex-col items-center max-w-md">
                    <CheckCircle2 size={48} className="text-green-500 mb-4" />
                    <h1 className="text-2xl font-bold text-green-500">{statusMessage}</h1>
                    {needsLogin ? (
                        <p className="mt-2 text-gray-600 dark:text-apple-gray-400">
                            Please <Link to="/login" className="text-apple-blue underline font-semibold">log in</Link> to continue.
                        </p>
                    ) : (
                        <p className="mt-2 text-gray-600 dark:text-apple-gray-400">Redirecting to dashboard...</p>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center max-w-md">
                    <Spinner />
                    <h1 className="text-2xl font-bold mt-4">{statusMessage}</h1>
                    <p className="mt-2 text-gray-500">Please do not close this window.</p>
                </div>
            )}
        </div>
    );
};

export default VerifyPaymentPage;