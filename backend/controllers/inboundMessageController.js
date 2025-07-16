// server/controllers/inboundMessageController.js
import asyncHandler from '../middleware/asyncHandler.js';
import InboundMessage from '../models/InboundMessage.js';
import mongoose from 'mongoose';

// @desc    Get all inbound messages for the current tenant
// @route   GET /api/inbound-messages
// @access  Private/Admin
const getMyInboundMessages = asyncHandler(async (req, res) => {
    // Basic pagination
    const pageSize = parseInt(req.query.pageSize, 10) || 25;
    const page = parseInt(req.query.page, 10) || 1;

    const query = {
        tenantId: req.tenantId, // Scoped to the admin's tenant
    };

    const count = await InboundMessage.countDocuments(query);
    const messages = await InboundMessage.find(query)
        .populate('customerId', 'name') // Attempt to get customer name if linked
        .sort({ createdAt: -1 }) // Show newest messages first
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({
        messages,
        page,
        pages: Math.ceil(count / pageSize),
        totalMessages: count,
    });
});

export { getMyInboundMessages };