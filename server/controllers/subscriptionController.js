// server/controllers/subscriptionController.js

import asyncHandler from '../middleware/asyncHandler.js';
import { createPaymentLink, getPaymentLinkStatus, convertPUSDToFiat } from '../services/accountPeService.js';
import Tenant from '../models/Tenant.js';
import Plan from '../models/Plan.js';
import PendingUser from '../models/PendingUser.js';
import crypto from 'crypto';
import { COUNTRY_TO_CURRENCY } from '../utils/currencyMap.js';
import User from '../models/User.js';
import { customAlphabet } from 'nanoid';
import { sendOtpEmail } from '../services/notificationService.js';
import { finalizeRegistrationLogic } from '../services/registrationService.js';
import generateToken from '../utils/generateToken.js';

const extractPaymentAttributes = (payload) => {
    return payload?.data?.data?.attributes || null;
};

const isPaymentSuccessful = (statusValue) => {
    if (statusValue === 1 || statusValue === '1') return true;
    if (typeof statusValue === 'string' && statusValue.toLowerCase() === 'success') return true;
    return false;
};

// @desc    Initiate a PAID subscription for a NEW user AFTER OTP verification
// @route   POST /api/subscriptions/initiate
// @access  Public
// server/controllers/subscriptionController.js.

const initiateSubscription = asyncHandler(async (req, res) => {
    console.log("--- TEST: INITIATE SUBSCRIPTION CALLED ---");
    const registrationData = req.body;

    const { adminUser, companyInfo, plan: planName, amount, currency, countryCode } = registrationData;

    // 1. Validation
    if (!adminUser?.email || !companyInfo?.name) { 
        res.status(400); 
        throw new Error('Missing registration info'); 
    }
    
    // 2. Pending User Setup
    await PendingUser.deleteOne({ email: adminUser.email.toLowerCase() });

    const pendingUser = await PendingUser.create({
        email: adminUser.email.toLowerCase(),
        otpHash: '000000',
        signupData: {
            ...registrationData,
            plan: planName // ✅ FIX: ensure schema gets "plan"
        },
    });
    
    // 3. Trial Logic
    if (!planName || planName.toLowerCase() === 'trial') {
        const { tenant, user, token } = await finalizeRegistrationLogic(pendingUser);
        return res.status(201).json({ 
            paymentRequired: false, 
            token, 
            user, 
            tenant, 
            message: "Account created." 
        });
    }

    // 4. Paid Logic
    const transaction_id = `PRESSFLOW-${pendingUser._id}`;
    
    let backendBaseUrl = (process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/api\/?$/, '');
    
    const callback_url = `${backendBaseUrl}/api/webhooks/accountpe?flow=signup&transaction_id=${transaction_id}&email=${pendingUser.email}`;

    await pendingUser.save();

    const paymentData = {
        country_code: countryCode,
        currency: currency,
        amount: Math.ceil(amount),
        name: adminUser.username,
        email: adminUser.email,
        transaction_id,
        description: `Subscription to PressMark ${planName} Plan`,
        pass_digital_charge: true,
        callback_url: callback_url
    };

    try {

        const paymentResponse = await createPaymentLink(paymentData);

        const paymentLink =
            paymentResponse?.data?.data?.payment_link ||
            paymentResponse?.data?.payment_link ||
            paymentResponse?.payment_link;
        
        if (!paymentLink) {
            throw new Error('Payment provider did not return a link.');
        }
        
        res.status(200).json({
            message: "Redirecting to payment...",
            paymentRequired: true,
            paymentLink
        });

    } catch (paymentError) {
        console.error(
            "Payment Link Creation Failed:",
            paymentError.response?.data || paymentError.message
        );
        throw new Error("Could not contact payment provider. Please check your credentials.");
    }
});
// @desc    Generate a payment link for an EXISTING tenant to upgrade their plan
// @route   POST /api/subscriptions/change-plan
// @access  Private (Tenant)
const changeSubscriptionPlan = asyncHandler(async (req, res) => {
    const { planName } = req.body;
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser.tenantId) {
        res.status(400); throw new Error('User is not associated with a business.');
    }

    const tenant = await Tenant.findById(loggedInUser.tenantId);
    const newPlan = await Plan.findOne({ name: planName });

    if (!tenant || !newPlan) throw new Error('Tenant or Plan not found');
    if (tenant.plan === newPlan.name && tenant.subscriptionStatus === 'active') {
        return res.status(400).json({ message: 'You are already on this plan.' });
    }

    // --- 🌟 GET EXACT PRICE FROM DB (NO EXTERNAL API CONVERSION) 🌟 ---
    const userCountryCode = tenant.countryCode || 'CM'; 
    const targetCurrency = COUNTRY_TO_CURRENCY[userCountryCode] || 'USD';

    // Look in the DB for the exact price for their country
    let finalPriceDetails = newPlan.prices.find(p => p.currency === targetCurrency) || newPlan.prices.find(p => p.currency === 'USD');

    if (!finalPriceDetails || finalPriceDetails.amount <= 0) {
        throw new Error(`Pricing for ${newPlan.name} is not configured for ${targetCurrency} or USD.`);
    }

    const finalAmount = finalPriceDetails.amount;
    const finalCurrency = finalPriceDetails.currency;

    // --- CREATE PAYMENT LINK ---
    const transaction_id = `PRESSFLOW-UPGRADE-${loggedInUser.tenantId}-${newPlan.name}-${crypto.randomBytes(4).toString('hex')}`;
    let backendBaseUrl = (process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/api\/?$/, '');
    
    const paymentData = {
        country_code: userCountryCode, 
        currency: finalCurrency, // e.g., 'XAF' or 'NGN'
        amount: finalAmount,     // e.g., 18000
        name: tenant.name,
        email: loggedInUser.email,
        transaction_id,
        description: `Upgrade to PressMark ${newPlan.name} Plan`,
        pass_digital_charge: true,
        callback_url: `${backendBaseUrl}/api/webhooks/accountpe?flow=upgrade&transaction_id=${transaction_id}`
    };

    try {
        const paymentResponse = await createPaymentLink(paymentData);
        
        const paymentLink = paymentResponse?.data?.data?.payment_link || paymentResponse?.data?.payment_link;
        if (!paymentLink) throw new Error('Payment link not found in provider response.');
        
        res.status(201).json({ data: { payment_link: paymentLink } });
    } catch (error) {
        console.error("Error creating payment link for upgrade:", error.response?.data || error.message);
        throw new Error("Could not create payment link for the upgrade.");
    }
});

const resolveWalletCountryCode = (req, tenant) => {
    const fromRequest = String(req.body?.countryCode || req.query?.countryCode || '')
        .trim()
        .toUpperCase();
    if (fromRequest && COUNTRY_TO_CURRENCY[fromRequest]) {
        return fromRequest;
    }
    const stored = String(tenant?.countryCode || '').trim().toUpperCase();
    if (stored && COUNTRY_TO_CURRENCY[stored]) {
        return stored;
    }
    return 'CM';
};

const updateWalletPaymentCountry = asyncHandler(async (req, res) => {
    const { countryCode } = req.body;
    const normalized = String(countryCode || '').trim().toUpperCase();

    if (!normalized || !COUNTRY_TO_CURRENCY[normalized]) {
        res.status(400);
        throw new Error('Please select a supported payment country.');
    }

    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
        res.status(404);
        throw new Error('Tenant not found.');
    }

    tenant.countryCode = normalized;
    if (!tenant.country && COUNTRY_TO_CURRENCY[normalized]) {
        const countryNames = {
            NG: 'Nigeria', CM: 'Cameroon', KE: 'Kenya', SN: 'Senegal', CI: "Cote D'Ivoire",
        };
        tenant.country = countryNames[normalized] || tenant.country;
    }
    await tenant.save();

    res.status(200).json({
        countryCode: tenant.countryCode,
        currency: COUNTRY_TO_CURRENCY[tenant.countryCode],
    });
});

const createWalletTopUpPaymentLink = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const parsedAmount = Number(amount);
    const MIN_TOPUP_AMOUNT = 5.0;

    if (!parsedAmount || Number.isNaN(parsedAmount) || parsedAmount < MIN_TOPUP_AMOUNT) {
        res.status(400);
        throw new Error(`Please enter a valid deposit amount of at least ${MIN_TOPUP_AMOUNT.toFixed(2)} USD.`);
    }

    const loggedInUser = req.user;
    if (!loggedInUser || !loggedInUser.tenantId) {
        res.status(400);
        throw new Error('User is not associated with a business.');
    }

    const tenant = await Tenant.findById(loggedInUser.tenantId);
    if (!tenant) {
        res.status(404);
        throw new Error('Tenant not found.');
    }

    const countryCode = resolveWalletCountryCode(req, tenant);
    const selectedCurrency = COUNTRY_TO_CURRENCY[countryCode] || 'USD';

    let paymentAmount = Number(parsedAmount.toFixed(2));
    let paymentCurrency = 'USD';

    if (selectedCurrency !== 'USD') {
        const convertedAmount = await convertPUSDToFiat(countryCode, parsedAmount);
        paymentAmount = Math.ceil(convertedAmount);
        paymentCurrency = selectedCurrency;
    }

    const transaction_id = `PRESSFLOW-WALLET-${tenant._id}-${Math.round(parsedAmount * 100)}-${Date.now()}`;
    let backendBaseUrl = (process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/api\/?$/, '');
    const callback_url = `${backendBaseUrl}/api/webhooks/accountpe?flow=wallet-topup&transaction_id=${transaction_id}&tenantId=${tenant._id}`;

    const paymentData = {
        country_code: countryCode,
        currency: paymentCurrency,
        amount: paymentAmount,
        name: tenant.name,
        email: loggedInUser.email,
        transaction_id,
        description: `Wallet top-up for ${tenant.name}`,
        pass_digital_charge: true,
        callback_url
    };

    try {
        const paymentResponse = await createPaymentLink(paymentData);
        const paymentLink = paymentResponse?.data?.data?.payment_link || paymentResponse?.data?.payment_link;
        if (!paymentLink) throw new Error('Payment link not found in provider response.');
        res.status(201).json({ data: { payment_link: paymentLink } });
    } catch (error) {
        console.error('Error creating wallet top-up payment link:', error.response?.data || error.message);
        throw new Error('Could not create wallet top-up payment link.');
    }
});

const getWalletTopUpEstimate = asyncHandler(async (req, res) => {
    const amount = Number(req.query.amount);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
        res.status(400);
        throw new Error('Please provide a valid amount for the wallet estimate.');
    }

    const loggedInUser = req.user;
    if (!loggedInUser?.tenantId) {
        res.status(400);
        throw new Error('User is not associated with a business.');
    }

    const tenant = await Tenant.findById(loggedInUser.tenantId);
    if (!tenant) {
        res.status(404);
        throw new Error('Tenant not found.');
    }

    const countryCode = resolveWalletCountryCode(req, tenant);
    const localCurrency = COUNTRY_TO_CURRENCY[countryCode] || 'USD';
    let estimatedLocalAmount = amount;

    if (localCurrency !== 'USD') {
        estimatedLocalAmount = await convertPUSDToFiat(countryCode, amount);
    }

    res.status(200).json({
        amountUSD: amount,
        countryCode,
        localCurrency,
        estimatedLocalAmount: Number(estimatedLocalAmount.toFixed(2)),
    });
});

const verifyPaymentAndFinalize = asyncHandler(async (req, res) => {
    const { transaction_id, email } = req.body;

    if (!transaction_id) {
        res.status(400);
        throw new Error('Transaction ID is required for verification.');
    }

    // Find the pending user associated with this transaction
    const pendingUser = await PendingUser.findOne({ 'signupData.transactionId': transaction_id });

    if (!pendingUser) {
        if (email) {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                const token = generateToken(existingUser._id);
                const tenant = await Tenant.findById(existingUser.tenantId);
                return res.status(200).json({
                    _id: existingUser._id,
                    username: existingUser.username,
                    role: existingUser.role,
                    tenantId: existingUser.tenantId,
                    token,
                    tenant: tenant ? {
                        plan: tenant.plan,
                        subscriptionStatus: tenant.subscriptionStatus,
                        trialEndsAt: tenant.trialEndsAt,
                        nextBillingAt: tenant.nextBillingAt,
                    } : undefined,
                    message: 'Payment already confirmed. Please continue to your dashboard.'
                });
            }
        }
        res.status(404);
        throw new Error('Invalid transaction or registration session has expired. Please contact support.');
    }

    if (!pendingUser.paymentConfirmedAt) {
        // Check the payment status with the AccountPe API
        const statusResponse = await getPaymentLinkStatus(transaction_id);
        const attributes = extractPaymentAttributes(statusResponse.data);
        const status = attributes?.status ?? statusResponse.data?.status;

        if (!isPaymentSuccessful(status)) {
            throw new Error('Payment has not been confirmed. If you have paid, please wait a moment or contact support.');
        }
        pendingUser.paymentStatus = 'success';
        pendingUser.paymentConfirmedAt = new Date();
        await pendingUser.save();
    }

    // If the user was already created (e.g. concurrent verify), return token directly.
    const existingUser = await User.findOne({ email: pendingUser.email.toLowerCase() });
    if (existingUser) {
        const token = generateToken(existingUser._id);
        const tenant = await Tenant.findById(existingUser.tenantId);
        return res.status(200).json({
            _id: existingUser._id,
            username: existingUser.username,
            role: existingUser.role,
            tenantId: existingUser.tenantId,
            token,
            tenant: tenant ? {
                plan: tenant.plan,
                subscriptionStatus: tenant.subscriptionStatus,
                trialEndsAt: tenant.trialEndsAt,
                nextBillingAt: tenant.nextBillingAt,
            } : undefined,
            message: 'Payment confirmed. Please continue to your dashboard.'
        });
    }

    // Payment is successful, so we can now finalize the user's registration.
    const { tenant, user, token } = await finalizeRegistrationLogic(pendingUser);

    // Send back all the data the frontend needs to log the user in.
    res.status(201).json({
        _id: user._id, 
        username: user.username, 
        role: user.role,
        tenantId: user.tenantId, 
        token,
        tenant: {
            plan: tenant.plan,
            subscriptionStatus: tenant.subscriptionStatus,
            trialEndsAt: tenant.trialEndsAt,
            nextBillingAt: tenant.nextBillingAt,
        },
        message: `Payment successful! Account for '${tenant.name}' has been created.`
    });
});

export {
    initiateSubscription,
    changeSubscriptionPlan,
    updateWalletPaymentCountry,
    createWalletTopUpPaymentLink,
    getWalletTopUpEstimate,
    verifyPaymentAndFinalize,
};