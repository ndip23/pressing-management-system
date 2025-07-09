// server/controllers/paymentReportController.js
import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { startOfDay, endOfDay, parseISO, format, isValid as isValidDateFn } from 'date-fns';
import mongoose from 'mongoose';

const getDailyPaymentsReport = asyncHandler(async (req, res) => {
    const { tenantId } = req;
    const { date } = req.query;

    if (!date) { res.status(400); throw new Error('Date query parameter is required (YYYY-MM-DD).'); }

    let targetDate;
    try {
        targetDate = parseISO(date);
        if (!isValidDateFn(targetDate)) { throw new Error('Invalid date value provided.'); }
    } catch (e) {
        res.status(400); throw new Error('Invalid date format. Please use YYYY-MM-DD.');
    }

    const startDate = startOfDay(targetDate);
    const endDate = endOfDay(targetDate);

    console.log(`[PaymentReport] Fetching report for tenant ${tenantId}, Date: ${date}, Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const reportData = await Order.aggregate([
        // Stage 1: Match orders for the correct tenant that have at least one payment
        {
            $match: {
                tenantId: new mongoose.Types.ObjectId(tenantId),
                'payments.0': { $exists: true } // Efficiently find docs with non-empty payments array
            }
        },
        // Stage 2: Unwind the payments array to process each payment individually
        {
            $unwind: "$payments"
        },
        // Stage 3: Match only the payments that occurred on the target date
        {
            $match: {
                "payments.date": {
                    $gte: startDate,
                    $lte: endDate,
                }
            }
        },
        // Stage 4: Group all matching payments to get totals and detailed transactions
        {
            $group: {
                _id: null, // Group all results into a single document
                totalAmountCollected: { $sum: "$payments.amount" },
                numberOfTransactions: { $sum: 1 },
                detailedTransactions: {
                    $push: { // Create an object for each transaction
                        orderId: "$_id", // Keep the original order ID
                        receiptNumber: "$receiptNumber",
                        customer: "$customer", // Keep customer ID for later lookup
                        amountCollected: "$payments.amount",
                        paymentDate: "$payments.date",
                        paymentMethod: "$payments.method",
                        paymentRecordedBy: "$payments.recordedBy", // Keep user ID for later lookup
                        orderTotal: "$totalAmount"
                    }
                }
            }
        }
    ]);

    // If no data found, return an empty report
    if (reportData.length === 0) {
        return res.json({
            date: format(targetDate, 'yyyy-MM-dd'),
            totalAmountCollected: 0,
            numberOfTransactions: 0,
            detailedTransactions: [],
        });
    }

    const data = reportData[0];

    // --- Populate Customer and User names efficiently after aggregation ---
    const transactionDetails = data.detailedTransactions;
    const customerIds = [...new Set(transactionDetails.map(t => t.customer).filter(id => id))];
    const userIds = [...new Set(transactionDetails.map(t => t.paymentRecordedBy).filter(id => id))];

    const [customers, users] = await Promise.all([
        mongoose.model('Customer').find({ _id: { $in: customerIds } }).select('name').lean(),
        mongoose.model('User').find({ _id: { $in: userIds } }).select('username').lean()
    ]);

    const customerMap = new Map(customers.map(c => [c._id.toString(), c.name]));
    const userMap = new Map(users.map(u => [u._id.toString(), u.username]));

    transactionDetails.forEach(t => {
        t.customerName = customerMap.get(t.customer?.toString()) || 'Unknown Customer';
        t.paymentRecordedByUsername = userMap.get(t.paymentRecordedBy?.toString()) || 'Unknown User';
        delete t.customer; // Clean up original IDs
        delete t.paymentRecordedBy;
    });
    // --- End Population ---


    const report = {
        date: format(targetDate, 'yyyy-MM-dd'),
        totalAmountCollected: parseFloat(data.totalAmountCollected.toFixed(2)),
        numberOfTransactions: data.numberOfTransactions,
        detailedTransactions: transactionDetails.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)),
    };

    res.json(report);
});

export { getDailyPaymentsReport };