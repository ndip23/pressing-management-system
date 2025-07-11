// server/controllers/settingsController.js
import Settings from '../models/Settings.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Get application settings for the current user's tenant
// @route   GET /api/settings
// @access  Private/Admin
const getAppSettings = asyncHandler(async (req, res) => {
    // Correct multi-tenant way: Find settings using the tenantId from the authenticated user's session
    const settings = await Settings.findOne({ tenantId: req.tenantId });
    
    if (!settings) {
        // This case would happen if settings weren't created during tenant signup.
        // For robustness, we can create it here on the fly.
        console.warn(`[SettingsCtrl] No settings found for tenantId: ${req.tenantId}. Creating default settings now.`);
        const newSettings = await Settings.create({ tenantId: req.tenantId });
        return res.json(newSettings);
    }
    res.json(settings);
});

// @desc    Update application settings for the current user's tenant
// @route   PUT /api/settings
// @access  Private/Admin
const updateAppSettings = asyncHandler(async (req, res) => {
    // Correct multi-tenant way: Find the settings document for this specific tenant
    const settingsDoc = await Settings.findOne({ tenantId: req.tenantId });

    if (!settingsDoc) {
        res.status(404);
        throw new Error('Settings document not found for this organization. Cannot update.');
    }

    // Destructure all possible updatable fields from the request body
    const {
        companyInfo,
        notificationTemplates,
        defaultCurrencySymbol,
        preferredNotificationChannel,
        itemTypes, // For managing the list of items
        serviceTypes // For managing the list of services
    } = req.body;

    let isModified = false;

    // Update Company Information
    if (companyInfo && typeof companyInfo === 'object') {
        Object.assign(settingsDoc.companyInfo, companyInfo);
        isModified = true;
    }

    // Update Notification Templates
    if (notificationTemplates && typeof notificationTemplates === 'object') {
        Object.assign(settingsDoc.notificationTemplates, notificationTemplates);
        isModified = true;
    }
    
    // Update top-level fields
    if (defaultCurrencySymbol !== undefined) settingsDoc.defaultCurrencySymbol = defaultCurrencySymbol;
    if (preferredNotificationChannel !== undefined) settingsDoc.preferredNotificationChannel = preferredNotificationChannel;
    
    // Update arrays for item and service types
    if (itemTypes && Array.isArray(itemTypes)) settingsDoc.itemTypes = itemTypes;
    if (serviceTypes && Array.isArray(serviceTypes)) settingsDoc.serviceTypes = serviceTypes;

    // The 'isModified' check is a bit redundant if we always save, but can be good for logging.
    // Mongoose is smart enough to only update changed fields.
    // The key is to tell it *which* nested paths have changed if it can't detect it.
    if (settingsDoc.isModified()) {
        settingsDoc.markModified('companyInfo');
        settingsDoc.markModified('notificationTemplates');
        
        const updatedSettings = await settingsDoc.save();
        console.log(`[SettingsCtrl] Settings updated for tenantId: ${req.tenantId}`);
        res.json(updatedSettings);
    } else {
        console.log(`[SettingsCtrl] No changes detected for tenantId: ${req.tenantId}. No save operation performed.`);
        res.json(settingsDoc); // Send back the unchanged document
    }
});

export { getAppSettings, updateAppSettings };