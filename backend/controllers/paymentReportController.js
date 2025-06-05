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

    // Find orders where the lastPaymentDate falls within the selected day
    // AND amountPaid is greater than 0.
    const ordersWithPaymentsOnDate = await Order.find({
        lastPaymentDate: {
            $gte: startDate,
            $lte: endDate,
        },
        amountPaid: { $gt: 0 } // Only consider orders where a payment has been made
    })
    .populate('customer', 'name phone') // Optional: if you want customer name in detailed list
    .select('receiptNumber amountPaid totalAmount customer lastPaymentDate createdAt') // Select only needed fields
    .sort({ lastPaymentDate: 1 }) // Sort by payment time
    .lean();

    let totalAmountFromOrdersWithActivity = 0;
    const detailedTransactions = [];

    ordersWithPaymentsOnDate.forEach(order => {
        // This sums the *total amountPaid* for orders that had payment activity on the target day.
        // It doesn't isolate *only* the portion of payment made on that day if an order had multiple payments.
        // For this simplified model, this is the intended behavior.
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
        detailedTransactions: detailedTransactions // For potential display on a full report page
    };

    console.log(`[PaymentReport] Report for ${date}:`, report);
    res.json(report);
});

export { getDailyPaymentsReport };