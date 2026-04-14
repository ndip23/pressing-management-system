import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPlanBySlug, getPlanPrice, initiatePaidSubscriptionApi } from '../../services/api';
import { COUNTRY_TO_CURRENCY, SUPPORTED_COUNTRIES } from '../../utils/currencyMap';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import Spinner from '../../components/UI/Spinner';
import toast from 'react-hot-toast';

const PaymentPage = () => {

    const location = useLocation();
    const navigate = useNavigate();
    
    const searchParams = new URLSearchParams(location.search);
    const planSlug = searchParams.get("plan");

    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState(SUPPORTED_COUNTRIES[0]);
    const [finalAmount, setFinalAmount] = useState(0);
    const [, setError] = useState(null); // ✅ FIX: ignore unused variable
    const [submitting, setSubmitting] = useState(false);

    // 1. Fetch Plan Details
    useEffect(() => {
        const fetchPlan = async () => {
            try {
                setLoading(true);
                const { data } = await getPlanBySlug(planSlug);
                setPlan(data.data);
            } catch (err) { 
                setError("Failed to load plan"); 
            }
            finally { 
                setLoading(false); 
            }
        };
        fetchPlan();
    }, [planSlug]); // ✅ cleaned deps

    // 2. Dynamic Price Update
    useEffect(() => {
        const fetchPrice = async () => {
            if (!plan) return;
            try {
                const { data } = await getPlanPrice(plan.name, selectedRegion);
                setFinalAmount(data.data.amount);
            } catch (err) {
                console.error("Price fetch error:", err);
                setFinalAmount(0);
            }
        };
        fetchPrice();
    }, [selectedRegion, plan]); // ✅ cleaned deps

    const handleProceedToPay = async () => {
        setSubmitting(true);
        try {
            const storedData = localStorage.getItem('registration_data');
            if (!storedData) {
                toast.error("Registration session expired. Please sign up again.");
                navigate('/signup');
                return;
            }
            
            const savedData = JSON.parse(storedData);

            if (!savedData?.companyInfo) {
                toast.error("Incomplete registration data.");
                return;
            }

            const payload = {
                adminUser: savedData.adminUser,
                companyInfo: { 
                    ...savedData.companyInfo, 
                    countryCode: selectedRegion 
                },
                plan: plan.name,
                countryCode: selectedRegion,
                currency: COUNTRY_TO_CURRENCY[selectedRegion],
                amount: finalAmount
            };

            const response = await initiatePaidSubscriptionApi(payload);

            if (response.data?.paymentLink) {
                window.location.href = response.data.paymentLink;
            } else {
                toast.error("Payment link not received.");
            }
        } catch (err) {
            console.error("Payment initiation failed:", err);
            toast.error("Payment initiation failed.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;

    return (
        <div className="min-h-screen bg-apple-gray-50 p-8">
            <Card className="max-w-md mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6">Order Summary</h1>
                
                <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                    <p className="font-bold">{plan?.name}</p>
                    <p className="text-3xl font-black mt-2">
                        {COUNTRY_TO_CURRENCY[selectedRegion]} {finalAmount}
                    </p>
                </div>
                
                <div className="mb-6">
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                        Select Country
                    </label>
                    <select 
                        className="w-full p-3 border rounded-lg"
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        value={selectedRegion}
                    >
                        {SUPPORTED_COUNTRIES.map(code => (
                            <option key={code} value={code}>{code}</option>
                        ))}
                    </select>
                </div>

                <Button 
                    onClick={handleProceedToPay} 
                    isLoading={submitting} 
                    className="w-full"
                >
                    Pay Now
                </Button>
            </Card>
        </div>
    );
};

export default PaymentPage;