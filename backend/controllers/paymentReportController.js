// server/controllers/paymentReportController.js
import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/Order.js';
import { startOfDay, endOfDay, parseISO, format, isValid as isValidDateFn } from 'date-fns';

// @desc    Get total payments from orders with activity on a specific day
// @route   GET /api/reports/daily-payments?date=YYYY-MM-DD
// @access  Private/Admin
const getDailyPaymentsReport = asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (!date) {
        res.status(400); throw new Error('Date query parameter is required (YYYY-MM-DD).');
    }

    let targetDate;
    try {
        targetDate = parseISO(date); // date-fns parseISO is robust
        if (!isValidDateFn(targetDate)) {
            throw new Error('Invalid date value provided.');
        }
    } catch (e) {
        res.status(400); throw new Error('Invalid date format. Please use YYYY-MM-DD.');
    }

    const startDate = startOfDay(targetDate);
    const endDate = endOfDay(targetDate);

    console.log(`[PaymentReport] Fetching report for date: ${date}, Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`);

    const ordersWithPaymentsOnDate = await Order.find({
        lastPaymentDate: {
            $gte: startDate,
            $lte: endDate,
        },
        amountPaid: { $gt: 0 } 
    })
    .populate('customer', 'name phone') 
    .select('receiptNumber amountPaid totalAmount customer lastPaymentDate createdAt') 
    .sort({ lastPaymentDate: 1 }) 
    .lean();

    let totalAmountFromOrdersWithActivity = 0;
    const detailedTransactions = [];

    ordersWithPaymentsOnDate.forEach(order => {
        
        totalAmountFromOrdersWithActivity += order.amountPaid;
        detailedTransactions.push({
            orderId: order._id,
            receiptNumber: order.receiptNumber,
            customerName: order.customer?.name || 'N/A',
            amountCollectedOnOrder: order.amountPaid,
            paymentActivityDate: order.lastPaymentDate,
            orderTotal: order.totalAmount,
            orderCreatedAt: order.createdAt
        });
    });

    totalAmountFromOrdersWithActivity = parseFloat(totalAmountFromOrdersWithActivity.toFixed(2));

    const report = {
        date: format(targetDate, 'yyyy-MM-dd'),
        totalAmountFromOrdersWithActivity: totalAmountFromOrdersWithActivity,
        numberOfOrdersWithActivity: detailedTransactions.length,
        detailedTransactions: detailedTransactions 
    };

    console.log(`[PaymentReport] Report for ${date}:`, report);
    res.json(report);
});

export { getDailyPaymentsReport };