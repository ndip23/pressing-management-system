// client/src/pages/Reports/DailyPaymentsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../contexts/SettingsContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import { WALLET_CURRENCY_SYMBOL } from '../../utils/onboarding';
import { fetchDailyPaymentsReport, fetchWalletDepositReport } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import DatePicker from '../../components/UI/DatePicker'; 
import Spinner from '../../components/UI/Spinner';
import { CreditCard, AlertTriangle, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const rangeOptions = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'quarter', label: 'Quarterly' },
    { value: 'year', label: 'Yearly' },
];

const DailyPaymentsPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { settings } = useAppSettings();
    const { currencySymbol: localizationCurrencySymbol } = useLocalization();
    const orderCurrencySymbol = localizationCurrencySymbol || settings?.defaultCurrencySymbol || '$';
    const isSuperAdmin = user?.role === 'superadmin';
    const [reportData, setReportData] = useState(null);
    const [depositReport, setDepositReport] = useState(null);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedRange, setSelectedRange] = useState('day');
    const [loading, setLoading] = useState(true);
    const [depositLoading, setDepositLoading] = useState(true);
    const [error, setError] = useState('');
    const [depositError, setDepositError] = useState('');

    const loadReport = useCallback(async (dateToFetch) => {
        if (!dateToFetch) return;
        setLoading(true);
        setError('');
        try {
            const { data } = await fetchDailyPaymentsReport(dateToFetch);
            setReportData(data);
        } catch (err) {
            setError(err.response?.data?.message || `Failed to load daily payments for ${dateToFetch}.`);
            setReportData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadDepositReport = useCallback(async (dateToFetch, range) => {
        setDepositLoading(true);
        setDepositError('');

        try {
            const { data } = await fetchWalletDepositReport({ date: dateToFetch, range });
            setDepositReport(data);
        } catch (err) {
            setDepositError(err.response?.data?.message || `Failed to load ${range} deposit totals.`);
            setDepositReport(null);
        } finally {
            setDepositLoading(false);
        }
    }, []);

    useEffect(() => {
        loadReport(selectedDate);
    }, [loadReport, selectedDate]);

    useEffect(() => {
        if (isSuperAdmin) {
            loadDepositReport(selectedDate, selectedRange);
        } else {
            setDepositReport(null);
            setDepositLoading(false);
        }
    }, [loadDepositReport, selectedDate, selectedRange, isSuperAdmin]);

    const handleFetchReport = () => {
        loadReport(selectedDate);
        if (isSuperAdmin) {
            loadDepositReport(selectedDate, selectedRange);
        }
    };

    const getDepositTitle = () => {
        const option = rangeOptions.find(opt => opt.value === selectedRange);
        return option ? option.label : 'Deposit';
    };

    const depositCurrency = WALLET_CURRENCY_SYMBOL;
    const showTenantColumn = isSuperAdmin;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                    <CreditCard size={28} className="text-apple-blue" />
                    <h1 className="text-2xl sm:text-3xl font-semibold">{t('dailyPayments.title')}</h1>
                </div>
            </div>

            <Card>
                <div className="p-4 border-b dark:border-apple-gray-700">
                    <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="min-w-[220px]">
                                <DatePicker
                                    label={t('dailyPayments.selectDate')}
                                    id="reportDate"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    required
                                />
                            </div>
                            {isSuperAdmin && (
                                <div className="min-w-[220px]">
                                    <label className="block text-xs font-semibold uppercase text-apple-gray-500 mb-2">Report Range</label>
                                    <select
                                        className="w-full p-3 border rounded-lg bg-white text-sm text-apple-gray-900 dark:bg-apple-gray-950 dark:text-white"
                                        value={selectedRange}
                                        onChange={(e) => setSelectedRange(e.target.value)}
                                    >
                                        {rangeOptions.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex-shrink-0 w-full sm:w-auto">
                            <Button
                                onClick={handleFetchReport}
                                isLoading={loading || depositLoading}
                                iconLeft={<CalendarDays size={16} />}
                                className="w-full"
                            >
                                {t('dailyPayments.fetchReport')}
                            </Button>
                        </div>
                    </div>
                </div>

                {(loading || depositLoading) && (
                    <div className="p-6 flex justify-center"><Spinner size="lg" /></div>
                )}

                {(error || depositError) && (
                    <div className="p-4 m-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center gap-2">
                        <AlertTriangle size={18} />
                        <div>
                            {error && <div>{error}</div>}
                            {depositError && <div>{depositError}</div>}
                        </div>
                    </div>
                )}

                {!depositLoading && depositReport && (
                    <div className="p-4 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-apple-gray-100 dark:bg-apple-gray-800 rounded-apple-md">
                                <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">{getDepositTitle()} Deposited</p>
                                <p className="text-2xl font-bold">{depositCurrency} {depositReport.totalDeposited?.toFixed(2) ?? '0.00'}</p>
                            </div>
                            <div className="p-4 bg-apple-gray-100 dark:bg-apple-gray-800 rounded-apple-md">
                                <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">Number of Deposits</p>
                                <p className="text-2xl font-bold">{depositReport.numberOfDeposits ?? 0}</p>
                            </div>
                            <div className="p-4 bg-apple-gray-100 dark:bg-apple-gray-800 rounded-apple-md">
                                <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">Report Range</p>
                                <p className="text-2xl font-bold">{selectedRange.charAt(0).toUpperCase() + selectedRange.slice(1)}</p>
                            </div>
                        </div>

                        {depositReport.transactions?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-apple-gray-200 dark:divide-apple-gray-700 text-sm">
                                    <thead className="bg-apple-gray-50 dark:bg-apple-gray-800/50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-semibold">Date</th>
                                            {showTenantColumn && <th className="px-3 py-2 text-left font-semibold">Tenant</th>}
                                            <th className="px-3 py-2 text-left font-semibold">Amount</th>
                                            <th className="px-3 py-2 text-left font-semibold">Balance After</th>
                                            <th className="px-3 py-2 text-left font-semibold">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                                        {depositReport.transactions.map((transaction, index) => (
                                            <tr key={`${transaction.tenantId || 'tx'}-${index}`}>
                                                <td className="px-3 py-2 whitespace-nowrap">{format(parseISO(transaction.createdAt), 'MMM d, yyyy h:mm a')}</td>
                                                {showTenantColumn && <td className="px-3 py-2 whitespace-nowrap">{transaction.tenantName}</td>}
                                                <td className="px-3 py-2 whitespace-nowrap">{depositCurrency}{transaction.amount.toFixed(2)}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">{depositCurrency}{transaction.balanceAfter.toFixed(2)}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">{transaction.description || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-sm text-apple-gray-500 py-6">No deposit transactions were found for this range.</p>
                        )}
                    </div>
                )}

                {!loading && reportData && (
                    <div className="p-4 space-y-6">
                        <h3 className="text-xl font-semibold text-center">{t('dailyPayments.reportFor', { date: format(parseISO(reportData.date), 'MMMM d, yyyy') })}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                            <div className="p-4 bg-apple-gray-100 dark:bg-apple-gray-800 rounded-apple-md">
                                <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">{t('dailyPayments.totalCollected')}</p>
                                <p className="text-2xl font-bold">{orderCurrencySymbol}{reportData.totalAmountCollected.toFixed(2)}</p>
                            </div>
                            <div className="p-4 bg-apple-gray-100 dark:bg-apple-gray-800 rounded-apple-md">
                                <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">{t('dailyPayments.numberOfTransactions')}</p>
                                <p className="text-2xl font-bold">{reportData.numberOfTransactions}</p>
                            </div>
                        </div>

                        {reportData.detailedTransactions && reportData.detailedTransactions.length > 0 ? (
                            <div className="mt-6">
                                <h4 className="text-lg font-semibold mb-2">{t('dailyPayments.detailedTransactions')}</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-apple-gray-200 dark:divide-apple-gray-700 text-sm">
                                        <thead className="bg-apple-gray-50 dark:bg-apple-gray-800/50">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-semibold">{t('dailyPayments.table.paymentTime')}</th>
                                                <th className="px-3 py-2 text-left font-semibold">{t('dailyPayments.table.receiptNumber')}</th>
                                                <th className="px-3 py-2 text-left font-semibold">{t('dailyPayments.table.customer')}</th>
                                                <th className="px-3 py-2 text-right font-semibold">{t('dailyPayments.table.amountPaid')}</th>
                                                <th className="px-3 py-2 text-left font-semibold">{t('dailyPayments.table.method')}</th>
                                                <th className="px-3 py-2 text-left font-semibold">{t('dailyPayments.table.recordedBy')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                                            {reportData.detailedTransactions.map((transaction, index) => (
                                                <tr key={`${transaction.orderId}-${index}`}>
                                                    <td className="px-3 py-2 whitespace-nowrap">{format(parseISO(transaction.paymentDate), 'h:mm a')}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        <Link to={`/app/orders/${transaction.orderId}`} className="text-apple-blue hover:underline">{transaction.receiptNumber}</Link>
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">{transaction.customerName}</td>
                                                    <td className="px-3 py-2 text-right whitespace-nowrap">FCFA{transaction.amountCollected.toFixed(2)}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap">{transaction.paymentMethod}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap">{transaction.paymentRecordedByUsername}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-sm text-apple-gray-500 py-6">{t('dailyPayments.noTransactions')}</p>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default DailyPaymentsPage;