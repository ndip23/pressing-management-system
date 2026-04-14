import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom'; // ✅ Added useLocation
import { getMyTenantProfileApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../../components/UI/Spinner';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyUpgradePage = () => {
    const navigate = useNavigate();
    const location = useLocation(); // ✅ Added to read URL params
    const { login, user } = useAuth();
    const [status, setStatus] = useState('Verifying your upgrade...');
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    // ✅ Get plan name from URL
    const searchParams = new URLSearchParams(location.search);
    const planNameFromUrl = searchParams.get("plan");

    useEffect(() => {
        // ✅ Define the function correctly
        const verifyUpgrade = async () => {
            let attempts = 0;
            const maxAttempts = 10; 

            while (attempts < maxAttempts) {
                try {
                    const { data: newProfile } = await getMyTenantProfileApi();
                    
                    // Compare profile plan with URL plan
                    if (newProfile.plan === planNameFromUrl) {
                        login(newProfile, localStorage.getItem('token'));
                        setIsSuccess(true);
                        setStatus("Upgrade verified!");
                        setTimeout(() => window.location.href = '/app/dashboard', 1500);
                        return;
                    }
                } catch (err) {
                    console.log("Waiting for backend sync...");
                }
                
                await new Promise(res => setTimeout(res, 1000));
                attempts++;
            }
            setError("Upgrade is still processing. Please refresh or contact support.");
        };

        if (user) {
            verifyUpgrade();
        } else {
            setError("No active session found.");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, login, navigate, planNameFromUrl]); // ✅ Dependencies updated

    return (
        <div className="min-h-screen bg-apple-gray-50 dark:bg-apple-gray-950 flex flex-col items-center justify-center text-center p-4">
            {error ? (
                <div className="flex flex-col items-center max-w-md">
                    <AlertTriangle size={48} className="text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-red-500">Upgrade Verification Failed</h1>
                    <p className="mt-2 text-gray-600 dark:text-apple-gray-400">{error}</p>
                    <Link to="/contact" className="mt-6 text-apple-blue underline font-semibold">Contact Support</Link>
                </div>
            ) : isSuccess ? (
                 <div className="flex flex-col items-center max-w-md">
                    <CheckCircle2 size={48} className="text-green-500 mb-4" />
                    <h1 className="text-2xl font-bold text-green-500">{status}</h1>
                    <p className="mt-2 text-gray-600 dark:text-apple-gray-400">Redirecting you to your dashboard now...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center max-w-md">
                    <Spinner />
                    <h1 className="text-2xl font-bold mt-4">{status}</h1>
                    <p className="mt-2 text-gray-500">Please wait while we update your account. Do not close this window.</p>
                </div>
            )}
        </div>
    );
};

export default VerifyUpgradePage;