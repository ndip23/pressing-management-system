// server/controllers/publicController.js
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';
import PendingUser from '../models/PendingUser.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import Price from '../models/Price.js';
import Plan from '../models/Plan.js';
import generateToken from '../utils/generateToken.js';
import { createPaymentLink } from '../services/accountPeService.js';
import { finalizeRegistrationLogic } from '../services/registrationService.js';
import crypto from 'crypto';
import DirectoryListing from '../models/DirectoryListing.js';

const COUNTRY_CODE_TO_NAME = {
  BJ: 'Benin', BF: 'Burkina Faso', CM: 'Cameroon', CG: 'Congo Brazzaville',
  CD: 'Congo DRC', CI: "Cote D'Ivoire", GA: 'Gabon', GN: 'Guinea Conakry',
  IN: 'India', KE: 'Kenya', ML: 'Mali', SN: 'Senegal', TZ: 'Tanzania',
  TG: 'Togo', UG: 'Uganda'
};

const DIRECTORY_CACHE_TTL_MS = 60 * 1000;
const directoryCache = new Map();
const DEFAULT_WHATSAPP_CONTACT_FEE = Number.parseFloat(process.env.WALLET_CONTACT_FEE || '0.5') || 0.5;

// --- STEP 1: INITIATE REGISTRATION (NO OTP) ---
const initiateRegistration = asyncHandler(async (req, res) => {
    const registrationData = req.body;
    const { adminUser, companyInfo, plan: planName } = registrationData;

    // --- Validation ---
    if (!adminUser?.email || !/^\S+@\S+\.\S+$/.test(adminUser.email)) { res.status(400); throw new Error('A valid email address is required.'); }
    if (!companyInfo?.name || !adminUser?.username || !adminUser?.password) { res.status(400); throw new Error('Business name, admin username, and password are required.'); }
    
    const userExists = await User.findOne({ email: adminUser.email.toLowerCase() });
    if (userExists) { res.status(400); throw new Error('A user with this email already exists.'); }

    // --- End Validation ---

    await PendingUser.deleteOne({ email: adminUser.email.toLowerCase() });

    const pendingUser = new PendingUser({
        email: adminUser.email.toLowerCase(),
        otpHash: '000000', // Dummy OTP
        signupData: registrationData,
    });
    
    // --- NEW LOGIC: TRIAL vs. PAID ---
    if (planName && planName.toLowerCase() === 'trial') {
        // --- TRIAL FLOW (Instant Create) ---
        pendingUser.signupData.plan = 'Trial'; 
        await pendingUser.save();
        
        // Finalize immediately - No email sent
        const { tenant, user, token } = await finalizeRegistrationLogic(pendingUser);

        // Force trial status
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        await Tenant.findByIdAndUpdate(tenant._id, {
            subscriptionStatus: 'trial',
            trialEndsAt: thirtyDaysFromNow,
            nextBillingAt: thirtyDaysFromNow,
            plan: 'Basic'
        });

        res.status(201).json({ 
            paymentRequired: false,
            _id: user._id, 
            username: user.username, 
            role: user.role,
            tenantId: user.tenantId, 
            token,
            tenant: { plan: 'Basic', subscriptionStatus: 'trial' },
            message: 'Account created successfully.'
        });
    } else {
        // --- PAID PLAN FLOW ---
        const plan = await Plan.findOne({ name: planName });
        if (!plan) throw new Error('Invalid plan selected.');

        const paymentCurrency = 'XAF';
        const priceDetails = plan.prices.find(p => p.currency === paymentCurrency) || plan.prices.find(p => p.currency === 'USD');

        if (!priceDetails || priceDetails.amount <= 0) {
            throw new Error(`Pricing for ${plan.name} not configured.`);
        }
        
        const transaction_id = `PRESSFLOW-SUB-${pendingUser._id}-${crypto.randomBytes(4).toString('hex')}`;
        pendingUser.signupData.transactionId = transaction_id;
        
        let backendBaseUrl = (process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/api\/?$/, '');
        const callback_url  = `${backendBaseUrl}/api/webhooks/accountpe?flow=signup&transaction_id=${transaction_id}&email=${pendingUser.email}`;

        await pendingUser.save();
        // NO OTP EMAIL SENT HERE

        const paymentData = {
            country_code: "CM",
            name: pendingUser.signupData.adminUser.username,
            email: pendingUser.email,
            amount: priceDetails.amount,
            currency: priceDetails.currency,
            transaction_id,
            description: `Subscription to PressMark ${plan.name} Plan`,
            pass_digital_charge: true,
            callback_url : callback_url 
        };

        const paymentResponse = await createPaymentLink(paymentData);
        res.status(200).json({
            message: "Redirecting to payment...",
            paymentRequired: true,
            paymentLink: paymentResponse?.data?.data?.payment_link || paymentResponse?.data?.payment_link
        });
    }
});

// --- STEP 2: FINALIZE REGISTRATION (Only used for Paid Flows) ---
const finalizeRegistration = asyncHandler(async (req, res) => {
    // This is now only for after-payment verification
    const { email } = req.body;
    const pendingUser = await PendingUser.findOne({ email: email.toLowerCase() });
    
    if (!pendingUser) {
        res.status(404);
        throw new Error('Invalid registration request.');
    }

    const { tenant, user, token } = await finalizeRegistrationLogic(pendingUser);

    res.status(201).json({
        _id: user._id, 
        username: user.username, 
        role: user.role,
        tenantId: user.tenantId, 
        token,
        tenant: { plan: tenant.plan, subscriptionStatus: tenant.subscriptionStatus },
        message: 'Account finalized successfully.'
    });
});
// @desc    Get a list of publicly listed businesses for the directory
// @route   GET /api/public/directory
// @access  Public
const getPublicDirectory = asyncHandler(async (req, res) => {
    const { city, search, country } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 9, 1), 24);
    const cacheKey = JSON.stringify({
        city: city || '',
        search: search || '',
        country: country || '',
        page,
        pageSize,
    });
    const cached = directoryCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
        return res.json(cached.payload);
    }

    if (cached && cached.expiresAt <= now) {
        directoryCache.delete(cacheKey);
    }

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = search ? new RegExp(escapeRegex(search.trim()), 'i') : null;
    const cityRegex = city ? new RegExp(escapeRegex(city.trim()), 'i') : null;

    let countryRegex = null;
    let countryNameRegex = null;
    if (country) {
      const trimmedCountry = country.trim();
      const normalizedCode = trimmedCountry.toUpperCase();
      countryRegex = new RegExp(escapeRegex(trimmedCountry), 'i');
      const countryName = COUNTRY_CODE_TO_NAME[normalizedCode];
      if (countryName && countryName !== trimmedCountry) {
        countryNameRegex = new RegExp(escapeRegex(countryName), 'i');
      }
    }

    const tenantMatch = {
        isActive: true,
        isListedInDirectory: true,
        walletBalance: { $gt: 0 },
        ...(nameRegex ? { name: nameRegex } : {}),
        ...(cityRegex ? { city: cityRegex } : {}),
        ...(countryRegex ? {
          $or: [
            { country: countryRegex },
            { countryCode: countryRegex },
            ...(countryNameRegex ? [{ country: countryNameRegex }] : []),
          ]
        } : {}),
    };

    const listingMatch = {
        isActive: true,
        ...(nameRegex ? { name: nameRegex } : {}),
        ...(cityRegex ? { city: cityRegex } : {}),
        ...(countryRegex ? {
          $or: [
            { country: countryRegex },
            ...(countryNameRegex ? [{ country: countryNameRegex }] : []),
          ]
        } : {}),
    };

    const skip = (page - 1) * pageSize;
    const projection = {
        _id: 1,
        name: 1,
        slug: 1,
        description: 1,
        publicAddress: 1,
        publicPhone: 1,
        publicEmail: 1,
        city: 1,
        country: 1,
        countryCode: 1,
        logoUrl: 1,
    };

    const aggregation = await Tenant.aggregate([
        { $match: tenantMatch },
        { $project: projection },
        {
            $unionWith: {
                coll: DirectoryListing.collection.name,
                pipeline: [
                    { $match: listingMatch },
                    { $project: projection },
                ],
            },
        },
        { $sort: { name: 1 } },
        {
            $facet: {
                items: [{ $skip: skip }, { $limit: pageSize }],
                metadata: [{ $count: 'total' }],
            },
        },
    ]);

    const total = aggregation?.[0]?.metadata?.[0]?.total || 0;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const safePage = page;
    const items = aggregation?.[0]?.items || [];

    const payload = {
        items,
        pagination: {
            page: safePage,
            pageSize,
            total,
            totalPages,
            hasNextPage: safePage < totalPages,
            hasPrevPage: safePage > 1,
        },
    };

    directoryCache.set(cacheKey, {
        payload,
        expiresAt: now + DIRECTORY_CACHE_TTL_MS,
    });

    if (directoryCache.size > 500) {
        const oldestKey = directoryCache.keys().next().value;
        directoryCache.delete(oldestKey);
    }

    res.json(payload);
});

// @desc    Get a single business profile by slug (checking both collections)
// @route   GET /api/public/directory/:slug
// @access  Public
const getBusinessBySlug = asyncHandler(async (req, res) => {
    const slug = req.params.slug;
    const publicFields = 'name slug description publicAddress publicPhone publicEmail city country logoUrl bannerUrl ';

    let business = await Tenant.findOne({
        slug,
        isActive: true,
        isListedInDirectory: true,
        walletBalance: { $gt: 0 },
    }).select(publicFields).lean();
    if (!business) {
        business = await DirectoryListing.findOne({ slug, isActive: true }).select(publicFields).lean();
    }

    if (!business) {
        res.status(404);
        throw new Error('Business profile not found.');
    }
    res.json(business);
});

const contactBusinessViaWhatsApp = asyncHandler(async (req, res) => {
    const slug = req.params.slug;
    const message = req.body?.message || `Hello, I found your business on the directory and would like to contact you.`;
    const feeAmount = Number.isFinite(DEFAULT_WHATSAPP_CONTACT_FEE) && DEFAULT_WHATSAPP_CONTACT_FEE > 0 ? DEFAULT_WHATSAPP_CONTACT_FEE : 100;

    const tenant = await Tenant.findOne({
        slug,
        isActive: true,
        isListedInDirectory: true,
        walletBalance: { $gte: feeAmount },
    });

    if (tenant) {
        if (!tenant.publicPhone) {
            res.status(400);
            throw new Error('This business does not have a public phone number available.');
        }

        tenant.walletBalance = Number((tenant.walletBalance - feeAmount).toFixed(2));
        tenant.walletTransactions = tenant.walletTransactions || [];
        tenant.walletTransactions.push({
            type: 'contact_charge',
            amount: feeAmount,
            currency: 'USD',
            description: 'WhatsApp contact fee',
            balanceAfter: tenant.walletBalance,
            createdAt: new Date(),
        });

        await tenant.save();

        const phoneNumber = tenant.publicPhone.replace(/\s/g, '').replace('+', '');
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        return res.status(200).json({ whatsappUrl, walletBalance: tenant.walletBalance, fee: feeAmount });
    }

    const listing = await DirectoryListing.findOne({ slug, isActive: true });
    if (!listing || !listing.publicPhone) {
        res.status(402);
        throw new Error('This business is not available for contact or has insufficient wallet funds.');
    }

    const phoneNumber = listing.publicPhone.replace(/\s/g, '').replace('+', '');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    res.status(200).json({ whatsappUrl, walletBalance: 0, fee: 0 });
});

// @desc    Get the public price list for a single tenant
// @route   GET /api/public/tenants/:tenantId/prices
// @access  Public
const getTenantPriceList = asyncHandler(async (req, res) => {
    const tenantId = req.params.tenantId;

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
        res.status(400);
        throw new Error('Invalid Tenant ID format');
    }

    const prices = await Price.find({ tenantId: tenantId });
    
    if (!prices) {
        return res.json([]);
    }

    res.json(prices);
});
const handleContactForm = asyncHandler(async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        res.status(400);
        throw new Error('Name, email, and message are required.');
    }

    try {
        await sendContactFormEmail({ name, from: email, message });
        res.status(200).json({ message: 'Message sent successfully.' });
    } catch (error) {
        console.error("Failed to send contact form email:", error);
        throw new Error('Could not send message at this time.');
    }
});

export {
  initiateRegistration,
  finalizeRegistration,
  getPublicDirectory,
  getBusinessBySlug,
  contactBusinessViaWhatsApp,
  getTenantPriceList,
  handleContactForm
};
