// backend/services/registrationService.js

import mongoose from 'mongoose';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Plan from '../models/Plan.js';
import Settings from '../models/Settings.js';
import Price from '../models/Price.js';
import generateToken from '../utils/generateToken.js';

export const finalizeRegistrationLogic = async (pendingUser) => {
    const { 
        adminUser, 
        companyInfo, 
        currencySymbol, 
        itemTypes, 
        serviceTypes, 
        priceList, 
        plan: planName 
    } = pendingUser.signupData;

    if (!adminUser || !companyInfo) {
        throw new Error("Pending registration data is incomplete.");
    }

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
        // --- 1. DETERMINE PLAN ---
        // Normalize plan name from input (e.g. 'trial' -> 'Trial')
        let chosenPlanName = planName ? (planName.charAt(0).toUpperCase() + planName.slice(1)) : 'Trial';
        let isTrialMode = false;

        // If user chose 'Trial', we actually assign them the 'Basic' plan structure
        // but set their status to 'trial'. This prevents DB errors since 'Trial' isn't a real plan document.
        if (chosenPlanName === 'Trial') {
            chosenPlanName = 'Basic';
            isTrialMode = true;
        }

        const selectedPlan = await Plan.findOne({ name: chosenPlanName }).session(session);
        if (!selectedPlan) {
            throw new Error(`Plan '${chosenPlanName}' not found in database.`);
        }

        // --- 2. SET SUBSCRIPTION DATES & STATUS ---
        let trialEndDate = null;
        let nextBillingDate = null;
        let status = 'active'; // Default for paid plans

        if (isTrialMode) {
            // Logic for Free Trial
            trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 30); // 30 Days Free
            status = 'trial'; // ✅ Set status to 'trial'
            // We set nextBillingAt to the end of the trial so the scheduler knows when to check
            nextBillingDate = trialEndDate; 
        } else {
            // Logic for Paid Subscription
            nextBillingDate = new Date();
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1); // 1 Month later
        }

        // --- 3. CREATE TENANT ---
        const tenant = new Tenant({ 
            name: companyInfo.name, 
            countryCode: companyInfo.countryCode || 'CM', // ✅ Save Country Code for smart payments later
            plan: selectedPlan.name, // Will be 'Basic', 'Starter', etc.
            subscriptionStatus: status, // 'trial' or 'active'
            trialEndsAt: trialEndDate,
            nextBillingAt: nextBillingDate,
        });
        
        const savedTenant = await tenant.save({ session });
        const tenantId = savedTenant._id;

        // --- 4. CREATE ADMIN USER ---
        const user = new User({
            tenantId,
            username: adminUser.username.toLowerCase(),
            password: adminUser.password, // Will be hashed by User model pre-save hook
            email: adminUser.email.toLowerCase(),
            role: 'admin',
        });
        const savedUser = await user.save({ session });

        // --- 5. INITIALIZE SETTINGS ---
        await Settings.findOneAndUpdate(
            { tenantId },
            { 
                $set: { 
                    companyInfo, 
                    defaultCurrencySymbol: currencySymbol, 
                    itemTypes: itemTypes || [], 
                    serviceTypes: serviceTypes || [] 
                } 
            },
            { session, new: true, upsert: true }
        );

        // --- 6. SAVE PRICES (If any) ---
        if (priceList?.length > 0) {
            const pricesToInsert = priceList.map(p => ({ ...p, tenantId }));
            await Price.insertMany(pricesToInsert, { session });
        }

        // --- 7. CLEANUP & COMMIT ---
        await pendingUser.deleteOne({ session });
        
        const token = generateToken(savedUser._id); // Generate JWT for immediate login

            await session.commitTransaction();
            return { tenant: savedTenant, user: savedUser, token };
        } catch (error) {
            await session.abortTransaction();
            console.error("Transaction failed in registrationService:", error);
            const shouldRetry = Array.isArray(error?.errorLabels) && error.errorLabels.includes('TransientTransactionError');
            if (shouldRetry && attempt < maxRetries - 1) {
                session.endSession();
                continue;
            }
            throw error;
        } finally {
            session.endSession();
        }
    }
};
