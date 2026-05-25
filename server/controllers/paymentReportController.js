// server/controllers/paymentReportController.js
import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, parseISO, format, isValid as isValidDateFn } from 'date-fns';
import mongoose from 'mongoose';

const buildRange = (targetDate, range) => {
    switch ((range || 'day').toLowerCase()) {
        case 'week':
            return [startOfWeek(targetDate, { weekStartsOn: 1 }), endOfWeek(targetDate, { weekStartsOn: 1 })];
        case 'month':
            return [startOfMonth(targetDate), endOfMonth(targetDate)];
        case 'quarter':
            return [startOfQuarter(targetDate), endOfQuarter(targetDate)];
        case 'year':
            return [startOfYear(targetDate), endOfYear(targetDate)];
        case 'day':
        default:
            return [startOfDay(targetDate), endOfDay(targetDate)];
    }
};

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
        {
            $match: {
                tenantId: new mongoose.Types.ObjectId(tenantId),
                'payments.0': { $exists: true }
            }
        },
        { $unwind: '$payments' },
        {
            $match: {
                'payments.date': { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalAmountCollected: { $sum: '$payments.amount' },
                numberOfTransactions: { $sum: 1 },
                detailedTransactions: {
                    $push: {
                        orderId: '$_id',
                        receiptNumber: '$receiptNumber',
                        customer: '$customer',
                        amountCollected: '$payments.amount',
                        paymentDate: '$payments.date',
                        paymentMethod: '$payments.method',
                        paymentRecordedBy: '$payments.recordedBy',
                        orderTotal: '$totalAmount'
                    }
                }
            }
        }
    ]);

    if (reportData.length === 0) {
        return res.json({
            date: format(targetDate, 'yyyy-MM-dd'),
            totalAmountCollected: 0,
            numberOfTransactions: 0,
            detailedTransactions: [],
        });
    }

    const data = reportData[0];

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
        delete t.customer;
        delete t.paymentRecordedBy;
    });

    const report = {
        date: format(targetDate, 'yyyy-MM-dd'),
        totalAmountCollected: parseFloat(data.totalAmountCollected.toFixed(2)),
        numberOfTransactions: data.numberOfTransactions,
        detailedTransactions: transactionDetails.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)),
    };

    res.json(report);
});

const getWalletDepositReport = asyncHandler(async (req, res) => {
    const { tenantId } = req;
    const { date, range = 'day' } = req.query;

    let targetDate = date ? parseISO(date) : new Date();
    if (!isValidDateFn(targetDate)) {
        res.status(400);
        throw new Error('Invalid date format. Please use YYYY-MM-DD.');
    }

    const [startDate, endDate] = buildRange(targetDate, range);
    const byTenant = req.user.role !== 'superadmin';

    console.log(`[WalletDepositReport] range=${range} tenantBased=${byTenant} start=${startDate.toISOString()} end=${endDate.toISOString()}`);

    const matchStage = byTenant
        ? { _id: new mongoose.Types.ObjectId(tenantId) }
        : {};

    const reportData = await Tenant.aggregate([
        { $match: matchStage },
        { $project: { name: 1, walletTransactions: 1 } },
        { $unwind: '$walletTransactions' },
        {
            $match: {
                'walletTransactions.type': 'topup',
                'walletTransactions.createdAt': { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalDeposited: { $sum: '$walletTransactions.amount' },
                numberOfDeposits: { $sum: 1 },
                transactions: {
                    $push: {
                        tenantId: '$_id',
                        tenantName: '$name',
                        type: '$walletTransactions.type',
                        amount: '$walletTransactions.amount',
                        currency: '$walletTransactions.currency',
                        balanceAfter: '$walletTransactions.balanceAfter',
                        description: '$walletTransactions.description',
                        createdAt: '$walletTransactions.createdAt'
                    }
                }
            }
        }
    ]);

    const result = reportData[0] || { totalDeposited: 0, numberOfDeposits: 0, transactions: [] };

    result.transactions = result.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    result.range = range;
    result.date = format(targetDate, 'yyyy-MM-dd');
    result.startDate = format(startDate, 'yyyy-MM-dd');
    result.endDate = format(endDate, 'yyyy-MM-dd');

    res.json(result);
});

export { getDailyPaymentsReport, getWalletDepositReport };