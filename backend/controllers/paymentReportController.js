// server/controllers/paymentReportController.js
import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js'; 
import User from '../models/User.js';       
import { startOfDay, endOfDay, parseISO, format, isValid as isValidDateFn } from 'date-fns';
import mongoose from 'mongoose'; 

// @desc    Get a report of payments for a specific day for the current tenant
// @route   GET /api/reports/daily-payments?date=YYYY-MM-DD
// @access  Private/Admin
const getDailyPaymentsReport = asyncHandler(async (req, res) => {
    const { tenantId } = req;
    const { date } = req.query;

    if (!date) {
        res.status(400);
        throw new Error('Date query parameter is required (YYYY-MM-DD).');
    }

    let targetDate;
    try {
        targetDate = parseISO(date);
        if (!isValidDateFn(targetDate)) {
            throw new Error('Invalid date value provided.');
        }
    } catch (e) {
        res.status(400);
        throw new Error('Invalid date format. Please use YYYY-MM-DD.');
    }

    const startDate = startOfDay(targetDate);
    const endDate = endOfDay(targetDate);

    console.log(`[PaymentReport] Fetching report for tenant ${tenantId}, Date: ${date}, Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const reportData = await Order.aggregate([
        {
            $match: {
                tenantId: new mongoose.Types.ObjectId(tenantId), 
                'payments.0': { $exists: true } 
            }
        },
    
        {
            $unwind: "$payments"
        },

        {
            $match: {
                "payments.date": {
                    $gte: startDate,
                    $lte: endDate,
                }
            }
        },

        {
            $lookup: {
                from: 'users', 
                localField: 'payments.recordedBy',
                foreignField: '_id',
                as: 'paymentRecorderInfo'
            }
        },
   
        {
            $lookup: {
                from: 'customers',
                localField: 'customer',
                foreignField: '_id',
                as: 'customerInfo'
            }
        },
        { $unwind: { path: "$paymentRecorderInfo", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$customerInfo", preserveNullAndEmptyArrays: true } },

        {
            $project: {
                _id: 0, 
                receiptNumber: "$receiptNumber",
                customerName: "$customerInfo.name",
                orderCreatedByUserId: "$createdBy", 
                amountCollected: "$payments.amount",
                paymentDate: "$payments.date",
                paymentMethod: "$payments.method",
                paymentRecordedBy: "$paymentRecorderInfo.username", 
                orderTotal: "$totalAmount"
            }
        },
        {
            $group: {
                _id: null, 
                totalAmountCollected: { $sum: "$amountCollected" },
                numberOfTransactions: { $sum: 1 },
                detailedTransactions: { $push: "$$ROOT" } 
            }
        }
    ]);

    let report;
    if (reportData.length > 0) {
        const data = reportData[0];
        const userIds = [...new Set(data.detailedTransactions.map(t => t.orderCreatedByUserId).filter(id => id))];
        if (userIds.length > 0) {
            const users = await User.find({ _id: { $in: userIds } }).select('username').lean();
            const userMap = new Map(users.map(u => [u._id.toString(), u.username]));

            data.detailedTransactions.forEach(t => {
                if (t.orderCreatedByUserId) {
                    t.orderCreatedBy = userMap.get(t.orderCreatedByUserId.toString()) || 'Unknown User';
                } else {
                    t.orderCreatedBy = 'N/A';
                }
                delete t.orderCreatedByUserId; 
            });
        }

        report = {
            date: format(targetDate, 'yyyy-MM-dd'),
            totalAmountCollected: parseFloat(data.totalAmountCollected.toFixed(2)),
            numberOfTransactions: data.numberOfTransactions,
            detailedTransactions: data.detailedTransactions.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)), // Sort by newest payment first
        };
    } else {
        report = {
            date: format(targetDate, 'yyyy-MM-dd'),
            totalAmountCollected: 0,
            numberOfTransactions: 0,
            detailedTransactions: [],
        };
    }

    res.json(report);
});

export { getDailyPaymentsReport };