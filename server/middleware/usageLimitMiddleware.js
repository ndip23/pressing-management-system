import asyncHandler from './asyncHandler.js';
import Tenant from '../models/Tenant.js';
import Plan from '../models/Plan.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

export const canCreateStaff = asyncHandler(async (req, res, next) => {
    const tenantId = req.tenantId;
    // --- UPDATED LOGIC ---
    const tenant = await Tenant.findById(tenantId).populate('plan');

    if (!tenant) throw new Error('Tenant not found.');
    let planDoc = null;
    if (tenant.plan && typeof tenant.plan === 'object' && tenant.plan.limits) {
        planDoc = tenant.plan;
    } else if (typeof tenant.plan === 'string') {
        planDoc = await Plan.findOne({ name: tenant.plan });
    }
    if (!planDoc) throw new Error('Subscription plan not found for this tenant.');

    const currentStaffCount = await User.countDocuments({ tenantId: tenantId });
    const maxStaff = planDoc.limits.maxStaff;

    if (currentStaffCount >= maxStaff) {
        res.status(403);
        throw new Error(`Your '${planDoc.name}' plan is limited to ${maxStaff} staff members. Please upgrade your plan to add more.`);
    }

    next();
});

export const canCreateOrder = asyncHandler(async (req, res, next) => {
    const tenantId = req.tenantId;
    // --- UPDATED LOGIC ---
    const tenant = await Tenant.findById(tenantId).populate('plan');

    if (!tenant) throw new Error('Tenant not found.');
    let planDoc = null;
    if (tenant.plan && typeof tenant.plan === 'object' && tenant.plan.limits) {
        planDoc = tenant.plan;
    } else if (typeof tenant.plan === 'string') {
        planDoc = await Plan.findOne({ name: tenant.plan });
    }
    if (!planDoc) throw new Error('Subscription plan not found for this tenant.');

    if (tenant.subscriptionStatus !== 'active' && tenant.subscriptionStatus !== 'trialing' && tenant.subscriptionStatus !== 'trial' ) {
        res.status(403);
        throw new Error('Your subscription is inactive. Please upgrade to create new orders.');
    }

    const maxOrders = planDoc.limits.maxOrdersPerMonth;
    
    // If maxOrders is not defined on the plan, it's unlimited.
    if (maxOrders === null || maxOrders === undefined) {
        return next(); // Proceed without checking
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const currentOrderCount = await Order.countDocuments({
        tenantId: tenantId,
        createdAt: { $gte: startOfMonth }
    });

    if (currentOrderCount >= maxOrders) {
        res.status(403);
        throw new Error(`You have reached your monthly limit of ${maxOrders} orders for the '${planDoc.name}' plan. Please upgrade to continue.`);
    }

    next();
});
