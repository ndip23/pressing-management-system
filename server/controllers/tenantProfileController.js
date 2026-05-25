// server/controllers/tenantProfileController.js
import asyncHandler from '../middleware/asyncHandler.js';
import Tenant from '../models/Tenant.js';
import Transaction from '../models/Transaction.js';

// @desc    Get the current tenant's public profile data for editing
// @route   GET /api/tenant-profile
// @access  Private/Admin
// From: server/controllers/tenantController.js


const getMyTenantProfile = asyncHandler(async (req, res) => {
    // req.tenantId is provided by the 'protect' middleware
    // We fetch the tenant document, excluding sensitive Stripe IDs
    const tenant = await Tenant.findById(req.tenantId).select('-stripeCustomerId -stripeSubscriptionId');

    if (!tenant) {
        res.status(404);
        throw new Error('Tenant profile not found. Please contact support.');
    }
    
    // Respond with a comprehensive object containing all necessary profile and subscription data
    res.status(200).json({
        // Standard tenant info
        _id: tenant._id,
        name: tenant.name,
        publicEmail: tenant.publicEmail,
        description: tenant.description,
        logoUrl: tenant.logoUrl,
        publicAddress: tenant.publicAddress,
        publicPhone: tenant.publicPhone,
        city: tenant.city,
        country: tenant.country,
        isListedInDirectory: tenant.isListedInDirectory,
        country: tenant.country,
        countryCode: tenant.countryCode,
        isActive: tenant.isActive,
        isVerified: tenant.isVerified,
        walletBalance: tenant.walletBalance,
        walletCurrency: tenant.walletCurrency,
        walletTransactions: tenant.walletTransactions || [],
        
        // Subscription details
        plan: tenant.plan,
        subscriptionStatus: tenant.subscriptionStatus,
        trialEndsAt: tenant.trialEndsAt,
        nextBillingAt: tenant.nextBillingAt,
    });
});

const topUpWallet = asyncHandler(async (req, res) => {
    const { amount, currency } = req.body;
    const parsedAmount = Number(amount);
    const MIN_TOPUP_AMOUNT = 5.00;

    if (!parsedAmount || Number.isNaN(parsedAmount) || parsedAmount < MIN_TOPUP_AMOUNT) {
        res.status(400);
        throw new Error(`Please enter a valid top-up amount of at least ${MIN_TOPUP_AMOUNT.toFixed(2)}.`);
    }

    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) {
        res.status(404);
        throw new Error('Tenant profile not found.');
    }

    tenant.walletBalance = Number((tenant.walletBalance || 0) + parsedAmount);
    tenant.walletCurrency = 'USD';
    tenant.walletTransactions = tenant.walletTransactions || [];
    tenant.walletTransactions.push({
        type: 'topup',
        amount: parsedAmount,
        currency: 'USD',
        description: 'Wallet top-up',
        balanceAfter: tenant.walletBalance,
        createdAt: new Date(),
    });

    const updatedTenant = await tenant.save();

    const customTransactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await Transaction.create({
        transactionId: customTransactionId,
        user: req.user?.id,
        type: 'DEPOSIT',
        amount: parsedAmount,
        balanceAfter: tenant.walletBalance,
        description: 'Wallet top-up',
    });

    res.status(200).json(updatedTenant);
});

// @desc    Update the current tenant's public profile data
// @route   PUT /api/tenant-profile
// @access  Private/Admin
const updateMyTenantProfile = asyncHandler(async (req, res) => {
    const tenant = await Tenant.findById(req.tenantId);

    if (!tenant) {
        res.status(404);
        throw new Error('Tenant profile not found.');
    }
    
    // Destructure all possible updatable fields from the request body
    const {
        name,
        publicAddress,
        publicPhone,
        publicEmail,
        city,
        country,
        countryCode,
        description,
        logoUrl,
        isListedInDirectory,
        isVerified
    } = req.body;

    // Update fields if they were provided in the request
    tenant.name = name ?? tenant.name;
    tenant.publicAddress = publicAddress ?? tenant.publicAddress;
    tenant.publicPhone = publicPhone ?? tenant.publicPhone;
    tenant.publicEmail = publicEmail ?? tenant.publicEmail;
    tenant.city = city ?? tenant.city;
    tenant.country = country ?? tenant.country;
    if (countryCode) {
        tenant.countryCode = String(countryCode).trim().toUpperCase();
    }
    tenant.description = description ?? tenant.description;
    tenant.logoUrl = logoUrl ?? tenant.logoUrl;
    tenant.isListedInDirectory = isListedInDirectory ?? tenant.isListedInDirectory;
    if (typeof isVerified === 'boolean' && req.user?.role !== 'staff') {
        tenant.isVerified = isVerified;
    }

    const profileFieldsComplete = !!(
        tenant.name?.trim() &&
        tenant.city?.trim() &&
        tenant.publicPhone?.trim() &&
        tenant.description?.trim()
    );
    if (profileFieldsComplete) {
        tenant.onboardingProfileCompleted = true;
    }

    const updatedTenant = await tenant.save();
    res.json(updatedTenant);
});

export { getMyTenantProfile, updateMyTenantProfile, topUpWallet };