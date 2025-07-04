// server/controllers/priceController.js
import asyncHandler from '../middleware/asyncHandler.js';
import Price from '../models/Price.js';

// @desc    Get all prices for the current tenant
// @route   GET /api/prices
// @access  Private
const getPrices = asyncHandler(async (req, res) => {
    
    const prices = await Price.find({ tenantId: req.tenantId });
    res.json(prices);
});

// @desc    Update/Create prices for the current tenant (bulk operation)
// @route   PUT /api/prices
// @access  Private/Admin
const upsertPrices = asyncHandler(async (req, res) => {
    const { priceList } = req.body; // Expects an array of price objects
    if (!Array.isArray(priceList)) {
        res.status(400); throw new Error('priceList must be an array.');
    }

    const operations = priceList.map(p => ({
        updateOne: {
            filter: { tenantId: req.tenantId, itemType: p.itemType, serviceType: p.serviceType },
            update: { $set: { price: p.price } },
            upsert: true,
        }
    }));

    if (operations.length > 0) {
        await Price.bulkWrite(operations);
    }

    res.json({ message: 'Price list updated successfully.' });
});

export { getPrices, upsertPrices };