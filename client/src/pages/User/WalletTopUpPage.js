import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isWalletFunded, WALLET_CURRENCY_SYMBOL, MIN_TOP_UP_AMOUNT, CONTACT_FEE } from '../../utils/onboarding';
import {
    getWalletPaymentCountryCode,
    getCurrencyForCountry,
    WALLET_SELECT_PATH,
} from '../../utils/walletPayment';
import { COUNTRY_NAMES } from '../../utils/currencyMap';
import { getMyTenantProfileApi, initiateWalletTopUpPaymentApi, getWalletTopUpEstimateApi } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const LOCAL_CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    XAF: 'FCFA',
    XOF: 'CFA',
    NGN: '₦',
    KES: 'KSh',
    GHS: 'GH₵',
    INR: '₹',
};

const formatLocalEstimate = (amount, currencyCode) => {
    const symbol = LOCAL_CURRENCY_SYMBOLS[currencyCode] || currencyCode;
    if (['XAF', 'XOF'].includes(currencyCode)) {
        return `${Math.round(amount).toLocaleString('fr-FR')} ${symbol}`;
    }
    if (currencyCode === 'USD') {
        return `$${amount.toFixed(2)}`;
    }
    return `${symbol}${amount.toFixed(2)}`;
};

const WalletTopUpPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, refreshUser } = useAuth();
    const fromOnboarding = location.state?.fromOnboarding;
    const currency = WALLET_CURRENCY_SYMBOL;
    const paymentCountryCode =
        location.state?.paymentCountryCode ||
        getWalletPaymentCountryCode(user?.tenant);

    const [amount, setAmount] = useState('');
    const [tenantProfile, setTenantProfile] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localEstimate, setLocalEstimate] = useState(null);
    const [localCurrency, setLocalCurrency] = useState('USD');
    const [isEstimating, setIsEstimating] = useState(false);

    const loadTenantProfile = async () => {
        setIsLoadingProfile(true);
        try {
            const { data } = await getMyTenantProfileApi();
            setTenantProfile(data);
        } catch (error) {
            console.error('Failed to load tenant profile:', error.response?.data?.message || error.message);
            setTenantProfile({
                walletBalance: user?.tenant?.walletBalance ?? 0,
                walletTransactions: user?.tenant?.walletTransactions || [],
            });
        } finally {
            setIsLoadingProfile(false);
        }
    };

    useEffect(() => {
        if (!paymentCountryCode) {
            navigate(WALLET_SELECT_PATH, { replace: true, state: { fromOnboarding } });
            return;
        }
        loadTenantProfile();
    }, [paymentCountryCode, fromOnboarding, navigate]);

    useEffect(() => {
        if (!paymentCountryCode) return undefined;

        const fetchEstimate = async () => {
            const estimateAmount = Number(amount);
            if (!estimateAmount || Number.isNaN(estimateAmount) || estimateAmount < MIN_TOP_UP_AMOUNT) {
                setLocalEstimate(null);
                return;
            }

            setIsEstimating(true);
            try {
                const { data } = await getWalletTopUpEstimateApi(estimateAmount, paymentCountryCode);
                setLocalEstimate(data.estimatedLocalAmount);
                setLocalCurrency(data.localCurrency || 'USD');
            } catch (error) {
                console.error('Failed to fetch wallet top-up estimate:', error?.response?.data || error.message);
                setLocalEstimate(null);
            } finally {
                setIsEstimating(false);
            }
        };

        const timer = setTimeout(fetchEstimate, 400);
        return () => clearTimeout(timer);
    }, [amount, paymentCountryCode]);

    useEffect(() => {
        if (!fromOnboarding) return undefined;
        const pollBalance = async () => {
            await refreshUser();
        };
        pollBalance();
        const interval = setInterval(pollBalance, 4000);
        return () => clearInterval(interval);
    }, [fromOnboarding, refreshUser]);

    useEffect(() => {
        const balance = tenantProfile?.walletBalance ?? user?.tenant?.walletBalance ?? 0;
        const tenant = { walletBalance: balance };
        if (fromOnboarding && isWalletFunded(tenant)) {
            navigate('/app/onboarding/business-profile', { replace: true, state: { fromOnboarding: true } });
        }
    }, [tenantProfile?.walletBalance, user?.tenant?.walletBalance, fromOnboarding, navigate]);

    const currentBalance = tenantProfile?.walletBalance ?? user?.tenant?.walletBalance ?? 0;
    const transactions = tenantProfile?.walletTransactions || [];
    const isLowBalance = currentBalance < MIN_TOP_UP_AMOUNT;

    const handleSubmit = async () => {
        const topUpAmount = Number(amount);
        if (!topUpAmount || Number.isNaN(topUpAmount) || topUpAmount < MIN_TOP_UP_AMOUNT) {
            toast.error(`Please enter a valid amount of at least ${currency}${MIN_TOP_UP_AMOUNT.toFixed(2)} USD.`);
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await initiateWalletTopUpPaymentApi(topUpAmount, paymentCountryCode);
            const paymentLink = response?.data?.data?.payment_link || response?.data?.paymentLink || response?.data?.payment_link;

            if (!paymentLink) {
                throw new Error('Payment link was not returned.');
            }

            window.location.href = paymentLink;
        } catch (error) {
            console.error('Wallet payment initiation failed:', error?.response?.data || error.message);
            toast.error(error.response?.data?.message || 'Unable to initiate wallet payment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const paymentCountryName = COUNTRY_NAMES[paymentCountryCode] || paymentCountryCode;
    const checkoutCurrency = getCurrencyForCountry(paymentCountryCode);

    if (!paymentCountryCode) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 animate-fade-in">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-apple-md border border-apple-gray-200 bg-apple-gray-50 px-4 py-3 text-sm dark:border-apple-gray-700 dark:bg-apple-gray-900/50">
                <p className="text-apple-gray-700 dark:text-apple-gray-300">
                    Paying from <span className="font-semibold">{paymentCountryName}</span> — checkout in{' '}
                    <span className="font-semibold">{checkoutCurrency}</span>
                </p>
                <Link
                    to={WALLET_SELECT_PATH}
                    state={{ fromOnboarding }}
                    className="text-apple-blue font-medium hover:underline"
                >
                    Change country
                </Link>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.15fr,_0.85fr]">
                <Card className="p-6 bg-gradient-to-br from-apple-blue to-sky-600 text-white shadow-2xl shadow-apple-blue/10">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm uppercase tracking-[0.24em] text-apple-blue-100">Virtual wallet</p>
                                <h1 className="mt-3 text-3xl font-bold">Your Swyhr wallet</h1>
                            </div>
                            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-right">
                                <p className="text-xs uppercase tracking-[0.24em] text-white/80">Available Balance (USD)</p>
                                <p className="mt-2 text-3xl font-semibold">{currency}{currentBalance.toFixed(2)}</p>
                            </div>
                        </div>
                        <p className="max-w-xl text-sm text-white/85 leading-relaxed">
                            Wallet funds are held in US dollars. Each customer contact via WhatsApp costs {currency}{CONTACT_FEE.toFixed(2)}, and your balance updates instantly when a lead clicks the contact button.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                                <p className="text-sm text-white/80">Minimum deposit</p>
                                <p className="mt-2 text-xl font-semibold">{currency}{MIN_TOP_UP_AMOUNT.toFixed(2)}</p>
                            </div>
                            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                                <p className="text-sm text-white/80">Contact fee</p>
                                <p className="mt-2 text-xl font-semibold">{currency}{CONTACT_FEE.toFixed(2)} per WhatsApp lead</p>
                            </div>
                        </div>
                        {isLowBalance && (
                            <div className="rounded-2xl bg-white/10 border border-white/20 p-4 text-sm text-amber-100">
                                Your wallet balance is currently low. Top up now to keep your business visible and ready to receive customer contacts.
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm uppercase tracking-[0.24em] text-apple-gray-500 dark:text-apple-gray-400">Top up wallet</p>
                            <h2 className="mt-2 text-2xl font-semibold text-apple-gray-900 dark:text-white">Top up with Swyhr Pay</h2>
                        </div>
                        <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">
                            Enter the USD amount to add. Your wallet will be credited in dollars after payment confirmation.
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-200">Amount to add (USD)</label>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="inline-flex items-center rounded-l-2xl border border-apple-gray-200 bg-apple-gray-50 px-4 py-3 text-sm text-apple-gray-700 dark:border-apple-gray-700 dark:bg-apple-gray-900 dark:text-white">USD</span>
                                <input
                                    type="number"
                                    min={MIN_TOP_UP_AMOUNT}
                                    step="0.5"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="5.00"
                                    className="flex-1 rounded-r-2xl border border-apple-gray-200 bg-white px-4 py-3 text-sm text-apple-gray-900 shadow-sm outline-none transition duration-150 ease-in-out focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 dark:border-apple-gray-700 dark:bg-apple-gray-950 dark:text-white"
                                />
                            </div>
                            <p className="mt-2 text-xs text-apple-gray-500 dark:text-apple-gray-400">Minimum top-up is {currency}{MIN_TOP_UP_AMOUNT.toFixed(2)} USD.</p>
                        </div>

                        {amount && Number(amount) >= MIN_TOP_UP_AMOUNT && (
                            <div className="rounded-2xl border border-apple-blue/20 bg-apple-blue/5 p-4 text-sm dark:border-apple-blue/30 dark:bg-apple-blue/10">
                                {isEstimating ? (
                                    <div className="flex items-center gap-2 text-apple-gray-600 dark:text-apple-gray-300">
                                        <Spinner size="sm" />
                                        Calculating local checkout estimate...
                                    </div>
                                ) : localEstimate != null ? (
                                    <div className="space-y-1">
                                        <p className="font-medium text-apple-gray-900 dark:text-white">
                                            Estimated checkout amount
                                        </p>
                                        <p className="text-lg font-semibold text-apple-blue">
                                            ≈ {formatLocalEstimate(localEstimate, localCurrency)}
                                        </p>
                                        <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
                                            You pay in {localCurrency} via Swyhr Pay. Your wallet will be credited{' '}
                                            <span className="font-semibold">{currency}{Number(amount).toFixed(2)} USD</span>.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-apple-gray-500 dark:text-apple-gray-400">
                                        Enter a valid amount to see the local currency estimate.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                isLoading={isSubmitting}
                                className="w-full sm:w-auto"
                            >
                                {isSubmitting ? 'Redirecting...' : 'Proceed to payment'}
                            </Button>
                            <span className="text-sm text-apple-gray-500 dark:text-apple-gray-400">
                                You will be redirected to Swyhr Pay to complete checkout in your local currency.
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="p-6 mt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-apple-gray-900 dark:text-white">Wallet Activity</h2>
                        <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">All amounts shown in US dollars.</p>
                    </div>
                    <div className="rounded-full bg-apple-blue/10 px-4 py-2 text-sm font-medium text-apple-blue">
                        {transactions.length} transactions
                    </div>
                </div>

                {isLoadingProfile ? (
                    <div className="flex items-center justify-center py-10">
                        <Spinner size="lg" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-apple-gray-200 bg-apple-gray-50 p-8 text-center text-sm text-apple-gray-500 dark:border-apple-gray-700 dark:bg-apple-gray-950 dark:text-apple-gray-400">
                        No wallet activity yet. Your history will appear here once you top up or a customer contacts you.
                    </div>
                ) : (
                    <div className="mt-5 overflow-hidden rounded-2xl border border-apple-gray-200 dark:border-apple-gray-800">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-apple-gray-200 bg-white dark:bg-apple-gray-950 dark:divide-apple-gray-800">
                                <thead className="bg-apple-gray-50 dark:bg-apple-gray-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-apple-gray-500 dark:text-apple-gray-400">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-apple-gray-500 dark:text-apple-gray-400">Event</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-apple-gray-500 dark:text-apple-gray-400">Amount</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-apple-gray-500 dark:text-apple-gray-400">Balance</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-apple-gray-500 dark:text-apple-gray-400">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-800">
                                    {transactions
                                        .slice()
                                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                        .map((transaction, index) => (
                                            <tr key={`${transaction.type}-${transaction.createdAt}-${index}`} className="hover:bg-apple-gray-50 dark:hover:bg-apple-gray-900">
                                                <td className="px-4 py-4 text-sm text-apple-gray-600 dark:text-apple-gray-300">{format(new Date(transaction.createdAt), 'MMM d, yyyy')}</td>
                                                <td className="px-4 py-4 text-sm font-semibold text-apple-gray-900 dark:text-white">
                                                    {transaction.type === 'topup' ? 'Top Up' : 'Contact Charge'}
                                                </td>
                                                <td className={`px-4 py-4 text-sm font-medium text-right ${transaction.type === 'topup' ? 'text-apple-green' : 'text-apple-red'}`}>
                                                    {transaction.type === 'topup' ? '+' : '-'}{currency}{transaction.amount.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-right text-apple-gray-700 dark:text-apple-gray-200">{currency}{transaction.balanceAfter.toFixed(2)}</td>
                                                <td className="px-4 py-4 text-sm text-apple-gray-600 dark:text-apple-gray-400">{transaction.description || '-'}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default WalletTopUpPage;
