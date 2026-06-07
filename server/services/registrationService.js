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
            let chosenPlanName = planName ? (planName.charAt(0).toUpperCase() + planName.slice(1)) : 'Trial';
            let isTrialMode = false;

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
            let status = 'active';

            if (isTrialMode) {
                trialEndDate = new Date();
                trialEndDate.setDate(trialEndDate.getDate() + 30);
                status = 'trial';
                nextBillingDate = trialEndDate; 
            } else {
                nextBillingDate = new Date();
                nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            }

            // --- 3. CREATE TENANT ---
            const tenant = new Tenant({ 
                name: companyInfo.name, 
                countryCode: companyInfo.countryCode || 'CM',
                plan: selectedPlan.name,
                subscriptionStatus: status,
                trialEndsAt: trialEndDate,
                nextBillingAt: nextBillingDate,
            });
            
            const savedTenant = await tenant.save({ session });
            const tenantId = savedTenant._id;

            // --- 4. CREATE ADMIN USER ---
            const user = new User({
                tenantId,
                username: adminUser.username.toLowerCase(),
                password: adminUser.password,
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

            // --- 6. SAVE PRICES ---
            if (priceList?.length > 0) {
                const pricesToInsert = priceList.map(p => ({ ...p, tenantId }));
                await Price.insertMany(pricesToInsert, { session });
            }

            // --- 7. CLEANUP & COMMIT ---
            await pendingUser.deleteOne({ session });
            
            // 🌟 FIXED LINE: Pass all 4 arguments to include tenantId in the token
            const token = generateToken(
                savedUser._id, 
                savedUser.username, 
                savedUser.role, 
                tenantId
            );

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