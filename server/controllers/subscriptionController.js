// server/controllers/subscriptionController.js

import asyncHandler from '../middleware/asyncHandler.js';
import { createPaymentLink, getPaymentLinkStatus } from '../services/accountPeService.js';
import Tenant from '../models/Tenant.js';
import Plan from '../models/Plan.js';
import PendingUser from '../models/PendingUser.js';
import crypto from 'crypto';
import { COUNTRY_TO_CURRENCY } from '../utils/currencyMap.js';

// @desc    Initiate a PAID subscription for a NEW user AFTER OTP verification
// @route   POST /api/subscriptions/initiate
// @access  Public
const initiateSubscription = asyncHandler(async (req, res) => {
    const registrationData = req.body;
    const { adminUser, companyInfo, plan: planName } = registrationData;

    // --- 1. Validation ---
    if (!adminUser?.email || !/^\S+@\S+\.\S+$/.test(adminUser.email)) { 
        res.status(400); 
        throw new Error('A valid email address is required.'); 
    }
    if (!companyInfo?.name || !adminUser?.username || !adminUser?.password) { 
        res.status(400); 
        throw new Error('Business name, admin username, and password are required.'); 
    }
    
    const userExists = await User.findOne({ email: adminUser.email.toLowerCase() });
    if (userExists) { 
        res.status(400); 
        throw new Error('A user with this email already exists.'); 
    }

    // --- 2. Clean up old pending attempts ---
    await PendingUser.deleteOne({ email: adminUser.email.toLowerCase() });

    // --- 3. Generate OTP & Create Pending User ---
    const nanoid = customAlphabet('1234567890', 6);
    const otp = nanoid();

    const pendingUser = new PendingUser({
        email: adminUser.email.toLowerCase(),
        otpHash: otp,
        signupData: registrationData,
    });
    
    // --- 4. LOGIC: TRIAL ACCOUNT (No Payment) ---
    // If the plan is missing OR explicitly 'Trial', skip payment.
    if (!planName || planName.toLowerCase() === 'trial') {
        // Ensure plan name is consistent for finalize step
        pendingUser.signupData.plan = 'Trial'; 
        await pendingUser.save();
        
        try {
            await sendOtpEmail(adminUser.email, otp);
        } catch (emailError) {
            console.error(`FAILED to send OTP email:`, emailError);
            throw new Error("Could not send verification email.");
        }

        res.status(200).json({ 
            message: `A verification code has been sent to ${adminUser.email}.`,
            paymentRequired: false
        });
        return; // Stop here, do not create payment link
    } 

    // --- 5. LOGIC: PAID ACCOUNT (Smart Payment) ---
    
    // A. Get the Plan from DB
    const plan = await Plan.findOne({ name: planName });
    if (!plan) {
        res.status(400);
        throw new Error('Invalid plan selected.');
    }

    // B. Detect Country & Currency
    // Use the countryCode sent from frontend (PhoneInput), default to 'CM'
    const userCountryCode = companyInfo.countryCode || 'CM'; 
    const targetCurrency = COUNTRY_TO_CURRENCY[userCountryCode] || 'USD';

    console.log(`[Init Reg] Country: ${userCountryCode}, Currency: ${targetCurrency}`);

    // C. Find Price in DB
    let finalPriceDetails = plan.prices.find(p => p.currency === targetCurrency);

    // D. Fallback to USD if specific currency price is missing
    if (!finalPriceDetails) {
        console.log(`[Init Reg] No price for ${targetCurrency}. Using USD.`);
        finalPriceDetails = plan.prices.find(p => p.currency === 'USD');
    }

    // E. Safety Check
    if (!finalPriceDetails || finalPriceDetails.amount <= 0) {
        throw new Error(`Pricing for ${plan.name} is not configured for ${targetCurrency} or USD.`);
    }
    
    // F. Generate Transaction ID & Redirect URL
    const transaction_id = `PRESSFLOW-SUB-${pendingUser._id}-${crypto.randomBytes(4).toString('hex')}`;
    pendingUser.signupData.transactionId = transaction_id;
    
    // IMPORTANT: Point to your frontend route that handles payment verification
    const callback_url = `${process.env.FRONTEND_URL}/#/verify-payment?transaction_id=${transaction_id}&email=${pendingUser.email}`;

    // G. Save & Send OTP (So they can verify AFTER payment)
    await pendingUser.save();
    await sendOtpEmail(adminUser.email, otp);

    // H. Create AccountPe Link
    const paymentData = {
        country_code: userCountryCode, // e.g. 'NG'
        currency: finalPriceDetails.currency, // e.g. 'NGN'
        amount: finalPriceDetails.amount, // e.g. 25000
        
        name: pendingUser.signupData.adminUser.username,
        email: pendingUser.email,
        transaction_id,
        description: `Subscription to PressFlow ${plan.name} Plan`,
        pass_digital_charge: true,
        callback_url : callback_url 
    };

    try {
        const paymentResponse = await createPaymentLink(paymentData);
        
        res.status(200).json({
            message: "OTP sent. Redirecting to payment.",
            paymentRequired: true,
            paymentLink: paymentResponse.data.data.payment_link
        });
    } catch (paymentError) {
        console.error("Payment Link Creation Failed:", paymentError.response?.data || paymentError.message);
        throw new Error("Could not create payment link. Please try again.");
    }
});

// @desc    Generate a payment link for an EXISTING tenant to upgrade their plan
// @route   POST /api/subscriptions/change-plan
// @access  Private (Tenant)
const changeSubscriptionPlan = asyncHandler(async (req, res) => {
    const { planName } = req.body;
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser.tenantId) {
        res.status(400);
        throw new Error('User is not associated with a business.');
    }

    // 1. Fetch the Tenant to get their stored Country Code
    const tenant = await Tenant.findById(loggedInUser.tenantId);
    const newPlan = await Plan.findOne({ name: planName });

    if (!tenant || !newPlan) throw new Error('Tenant or Plan not found');
    if (tenant.plan === newPlan.name && tenant.subscriptionStatus === 'active') {
        return res.status(400).json({ message: 'You are already on this plan.' });
    }

    // --- 🌟 SMART LOGIC START 🌟 ---
    
    // 2. Get Country from DB. If missing (old accounts), default to 'US'
    // Ensure your Tenant Model has a 'countryCode' field!
    const userCountryCode = tenant.countryCode || 'US'; 
    
    // 3. Map Country to Currency
    const targetCurrency = COUNTRY_TO_CURRENCY[userCountryCode] || 'USD';

    console.log(`[Upgrade] Tenant Country: ${userCountryCode}, Target Currency: ${targetCurrency}`);

    // 4. Find the price for that specific currency
    const priceDetails = newPlan.prices.find(p => p.currency === targetCurrency);
    
    // 5. Fallback to USD if specific currency not found
    const fallbackPriceDetails = newPlan.prices.find(p => p.currency === 'USD');

    const finalPriceDetails = priceDetails || fallbackPriceDetails;

    if (!finalPriceDetails || finalPriceDetails.amount <= 0) {
        throw new Error(`Pricing for ${newPlan.name} is not configured for ${targetCurrency} or USD.`);
    }
    // --- SMART LOGIC END ---

    const transaction_id = `PRESSFLOW-UPGRADE-${loggedInUser.tenantId}-${crypto.randomBytes(4).toString('hex')}`;
    
    const paymentData = {
        country_code: userCountryCode, // ✅ Dynamic
        currency: finalPriceDetails.currency, // ✅ Dynamic
        amount: finalPriceDetails.amount, // ✅ Dynamic
        
        name: tenant.name,
        email: loggedInUser.email,
        transaction_id,
        description: `Upgrade to PressFlow ${newPlan.name} Plan`,
        pass_digital_charge: true,
        callback_url: `${process.env.FRONTEND_URL}/#/verify-upgrade?transaction_id=${transaction_id}`
    };

    try {
        const paymentResponse = await createPaymentLink(paymentData);
        res.status(201).json(paymentResponse.data);
    } catch (error) {
        console.error("Error creating payment link for upgrade:", error);
        throw new Error("Could not create payment link for the upgrade.");
    }
});
const verifyPaymentAndFinalize = asyncHandler(async (req, res) => {
    const { transaction_id } = req.body;

    if (!transaction_id) {
        res.status(400);
        throw new Error('Transaction ID is required for verification.');
    }

    // Find the pending user associated with this transaction
    const pendingUser = await PendingUser.findOne({ 'signupData.transactionId': transaction_id });
    if (!pendingUser) {
        res.status(404);
        throw new Error('Invalid transaction or registration session has expired. Please contact support.');
    }
    
    // Check the payment status with the AccountPe API
    const statusResponse = await getPaymentLinkStatus(transaction_id);
    
    // IMPORTANT: Check the exact success status from the AccountPe documentation. It might be 'success', 'SUCCESS', 'completed', etc.
    if (statusResponse.data.status !== 'success') {
        throw new Error('Payment has not been confirmed. If you have paid, please wait a moment or contact support.');
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

export { initiateSubscription, changeSubscriptionPlan, verifyPaymentAndFinalize };