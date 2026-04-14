// server/controllers/planController.js

import asyncHandler from '../middleware/asyncHandler.js';
import Plan from '../models/Plan.js';
import { COUNTRY_TO_CURRENCY } from '../utils/currencyMap.js';

// @desc    Get all ACTIVE plans for the public pricing page
// @route   GET /api/plans
// @access  Public
const getPlans = asyncHandler(async (req, res) => {
  // Only fetch plans that are marked as active for public view
  const plans = await Plan.find({ isActive: true });
  res.status(200).json(plans);
});

// @desc    Get ALL plans (active and inactive) for the admin panel
// @route   GET /api/plans/all
// @access  Private/DirectoryAdmin
const getAllPlansAdmin = asyncHandler(async (req, res) => {
  // Admin needs to see all plans to manage them
  const plans = await Plan.find({});
  res.status(200).json(plans);
});

// @desc    Get a single plan by its ID
// @route   GET /api/plans/:id
// @access  Private/DirectoryAdmin
const getPlanById = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (plan) {
    res.status(200).json(plan);
  } else {
    res.status(404);
    throw new Error('Plan not found');
  }
});

// @desc    Create a new plan
// @route   POST /api/plans
// @access  Private/DirectoryAdmin
const createPlan = asyncHandler(async (req, res) => {
  // Destructure all possible fields from the request body
  const { name, prices, features, isFeatured, isActive } = req.body;

  // Basic validation to ensure required fields are present
  if (!name || !prices || !features) {
    res.status(400);
    throw new Error('Please provide name, prices, and features for the plan.');
  }

  const newPlan = new Plan({
    name,
    prices,
    features,
    isFeatured: isFeatured || false,
    isActive: isActive || true,
  });

  const createdPlan = await newPlan.save();
  res.status(201).json(createdPlan);
});

// @desc    Update an existing plan by ID
// @route   PUT /api/plans/:id
// @access  Private/DirectoryAdmin
const updatePlan = asyncHandler(async (req, res) => {
  const { prices, features, isActive, isFeatured, name } = req.body;

  const plan = await Plan.findById(req.params.id);

  if (plan) {
    // Update fields only if they are provided in the request body
    plan.name = name || plan.name;
    plan.prices = prices || plan.prices;
    plan.features = features || plan.features;
    plan.isActive = isActive !== undefined ? isActive : plan.isActive;
    plan.isFeatured = isFeatured !== undefined ? isFeatured : plan.isFeatured;

    const updatedPlan = await plan.save();
    res.status(200).json(updatedPlan);
  } else {
    res.status(404);
    throw new Error('Plan not found');
  }
});

// @desc    Delete a plan by ID
// @route   DELETE /api/plans/:id
// @access  Private/DirectoryAdmin
const deletePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);

  if (plan) {
    await plan.deleteOne(); // Mongoose 5+ uses deleteOne() on the document
    res.status(200).json({ message: 'Plan removed successfully' });
  } else {
    res.status(404);
    throw new Error('Plan not found');
  }
});
// @desc    Get plan by slug
// @route   GET /api/plans/:slug
// @access  Public
const getPlanBySlug = asyncHandler(async (req, res) => {
    // Use a regex to make the search case-insensitive ('i' flag)
    // This allows searching for "starter" to find "Starter"
    const plan = await Plan.findOne({ 
        name: { $regex: new RegExp(`^${req.params.slug}$`, 'i') } 
    });

    if (plan) {
        res.json({ success: true, data: plan });
    } else {
        res.status(404);
        throw new Error('Plan not found');
    }
});

// @desc    Get converted price for a plan based on country code
// @route   GET /api/plans/:slug/price/:countryCode
// @access  Public
const getPlanPrice = asyncHandler(async (req, res) => {
    const { slug, countryCode } = req.params;
    
    const plan = await Plan.findOne({ name: slug });
    if (!plan) {
        res.status(404);
        throw new Error('Plan not found');
    }

    const currency = COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || 'USD';
    const price = plan.prices.find(p => p.currency === currency) || plan.prices.find(p => p.currency === 'USD');

    if (!price) {
        res.status(404);
        throw new Error('Price not configured for this region');
    }

    // You mentioned you want to return the 'rate'. 
    // If you are just calculating locally, return the amount and the rate is essentially 1 
    // relative to your database entry.
    res.json({
        success: true,
        data: {
            amount: price.amount,
            currency: price.currency,
            rate: 1 // Since you are using fixed prices in DB, rate is 1.0
        }
    });
});


export {
  getPlans,
  getAllPlansAdmin,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getPlanBySlug,
  getPlanPrice
};