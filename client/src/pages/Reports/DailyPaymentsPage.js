// client/src/pages/Reports/DailyPaymentsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Added Link
import { fetchDailyPaymentsReport } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import DatePicker from '../../components/UI/DatePicker';
import Spinner from '../../components/UI/Spinner';
import { CreditCard, AlertTriangle, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const DailyPaymentsPage = () => {
    const [reportData, setReportData] = useState(null);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingReport, setLoadingReport] = useState(false);
    const currencySymbol = 'FCFA'; 

    const loadReport = useCallback(async (dateToFetch) => {
        if (!dateToFetch) return;
        setLoading(true); setError(''); setReportData(null);
        try {
            const { data } = await fetchDailyPaymentsReport(dateToFetch);
            setReportData(data);
        } catch (err) {
            setError(err.response?.data?.message || `Failed to fetch payment report for ${dateToFetch}.`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadReport(selectedDate); }, [loadReport, selectedDate]);

    const handleDateChange = (e) => setSelectedDate(e.target.value);
    const handleFetchReport = () => loadReport(selectedDate);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3"> <CreditCard size={28} className="text-apple-blue" /> <h1 className="text-2xl sm:text-3xl font-semibold">Daily Payments Report</h1> </div>
            </div>
            <Card>
                 <div className="p-4 border-b dark:border-apple-gray-700">
                    <div className="flex flex-col sm:flex-row items-end gap-4"> {/* Use flex, items-end to align bottom of elements */}
                        <div className="flex-grow"> {/* DatePicker takes available space */}
                            <DatePicker
                                label="Select Date"
                                id="reportDate"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                required
                                // className="mb-0 sm:mb-0" // Remove bottom margin if Input component adds it
                            />
                        </div>
                        <div className="flex-shrink-0"> {/* Button takes its own space */}
                            <Button
                                onClick={handleFetchReport}
                                isLoading={loadingReport}
                                iconLeft={<CalendarDays size={16} />}
                                className="w-full sm:w-auto" // Full width on small, auto on larger
                            >
                                Fetch Report
                            </Button>
                        </div>
                    </div>
                </div>
                {loading && <div className="p-6 text-center"><Spinner size="lg" /></div>}
                {error && <div className="p-4 m-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{error}</div>}
                {reportData && !loading && (
                    <div className="p-4 space-y-4">
                        <h3 className="text-xl font-semibold text-center"> Payments with Activity on: {format(parseISO(reportData.date), 'MMMM d, yyyy')} </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                            <div className="p-4 bg-apple-gray-100 dark:bg-apple-gray-800 rounded-apple-md">
                                <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">Total from Orders with Activity</p> 
                                <p className="text-2xl font-bold">{currencySymbol} {reportData.totalAmountFromOrdersWithActivity?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div className="p-4 bg-apple-gray-100 dark:bg-apple-gray-800 rounded-apple-md">
                                <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400"># Orders with Payment Activity</p> 
                                <p className="text-2xl font-bold">{reportData.numberOfOrdersWithActivity || 0}</p>
                            </div>
                        </div>
                        {reportData.detailedTransactions && reportData.detailedTransactions.length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-lg font-semibold mb-2">Orders with Payment Activity on {format(parseISO(reportData.date), 'MMM d')}:</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-apple-gray-200 dark:divide-apple-gray-700 text-sm">
                                        <thead className="bg-apple-gray-50 dark:bg-apple-gray-800/50">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-semibold">Payment Activity Time</th>
                                                <th className="px-3 py-2 text-left font-semibold">Receipt #</th>
                                                <th className="px-3 py-2 text-left font-semibold">Customer</th>
                                                <th className="px-3 py-2 text-right font-semibold">Total Amount Paid on Order</th>
                                                <th className="px-3 py-2 text-right font-semibold">Order Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                                            {reportData.detailedTransactions.map(transaction => (
                                                <tr key={transaction.orderId + transaction.paymentActivityDate}>
                                                    <td className="px-3 py-2 whitespace-nowrap">{format(parseISO(transaction.paymentActivityDate), 'h:mm a')}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap"> <Link to={`/orders/${transaction.orderId}`} className="text-apple-blue hover:underline">{transaction.receiptNumber}</Link> </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">{transaction.customerName}</td>
                                                    <td className="px-3 py-2 text-right whitespace-nowrap">{currencySymbol} {transaction.amountCollectedOnOrder.toFixed(2)}</td>
                                                    <td className="px-3 py-2 text-right whitespace-nowrap">{currencySymbol} {transaction.orderTotal.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};
export default DailyPaymentsPage;