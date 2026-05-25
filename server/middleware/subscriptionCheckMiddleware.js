// server/middleware/subscriptionCheckMiddleware.js

import asyncHandler from './asyncHandler.js';
import Tenant from '../models/Tenant.js';

const checkSubscription = asyncHandler(async (req, res, next) => {
    // This middleware runs AFTER the 'protect' middleware,
    // so req.tenantId will be available.
    if (!req.tenantId) {
        res.status(401);
        throw new Error('Not authorized, tenant ID missing.');
    }

    const tenant = await Tenant.findById(req.tenantId);

    if (!tenant) {
        res.status(404);
        throw new Error('Tenant account not found.');
    }

    // --- THIS IS THE CORE LOGIC ---
    // Check if the subscription status is 'trialing' OR 'active'.
    // If it's anything else ('past_due', 'canceled'), block the request.
    if (['trial', 'active', 'trialing'].includes(tenant.subscriptionStatus)) {
        next(); // Subscription is valid, proceed to the controller.
    } else {
        res.status(403); // 403 Forbidden status code
        throw new Error('Access denied. Your subscription is not active. Please upgrade to continue.');
    }
});

export { checkSubscription };