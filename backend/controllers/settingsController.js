// server/controllers/settingsController.js
import Settings from '../models/Settings.js';
import asyncHandler from '../middleware/asyncHandler.js';
import Price from '../models/Price.js'; 

// @desc    Get application settings
// @route   GET /api/settings
// @access  Private/Admin
const getAppSettings = asyncHandler(async (req, res) => {
    const settings = await Settings.findOne({ tenantId: req.tenantId });
    if (!settings) { res.status(404); throw new Error('Settings not found for this tenant.'); }
    res.json(settings);
});
// @desc    Update application settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateAppSettings = asyncHandler(async (req, res) => {
    console.log('Backend: PUT /api/settings received. Body:', JSON.stringify(req.body, null, 2));
    const settingsDoc = await Settings.getSettings(); // Get the single settings document

    const { notificationTemplates, companyInfo, defaultCurrencySymbol } = req.body;

    let modified = false;

    // Update Notification Templates (deep merge individual fields)
    if (notificationTemplates && typeof notificationTemplates === 'object') {
        if (!settingsDoc.notificationTemplates) {
            settingsDoc.notificationTemplates = {}; // Initialize if it doesn't exist
        }
        // Iterate over keys in the request's notificationTemplates
        // and update them in the document. This allows partial updates.
        for (const key in notificationTemplates) {
            if (Object.prototype.hasOwnProperty.call(notificationTemplates, key)) {
                if (settingsDoc.notificationTemplates[key] !== notificationTemplates[key]) {
                    settingsDoc.notificationTemplates[key] = notificationTemplates[key];
                    modified = true;
                }
            }
        }
        if (modified) settingsDoc.markModified('notificationTemplates');
    }

    // Update Company Information (deep merge individual fields)
    if (companyInfo && typeof companyInfo === 'object') {
        if (!settingsDoc.companyInfo) {
            settingsDoc.companyInfo = {}; // Initialize if it doesn't exist
        }
        for (const key in companyInfo) {
            if (Object.prototype.hasOwnProperty.call(companyInfo, key)) {
                if (settingsDoc.companyInfo[key] !== companyInfo[key]) {
                    settingsDoc.companyInfo[key] = companyInfo[key];
                    modified = true;
                }
            }
        }
        if (modified) settingsDoc.markModified('companyInfo');
    }

    // Update Default Currency Symbol
    if (defaultCurrencySymbol !== undefined) {
        if (settingsDoc.defaultCurrencySymbol !== defaultCurrencySymbol) {
            settingsDoc.defaultCurrencySymbol = defaultCurrencySymbol;
            modified = true; // No need for markModified on top-level path
        }
    }

    if (modified || settingsDoc.isNew) { // settingsDoc.isNew handles the very first save if getSettings created it
        console.log('Backend: Settings object before save:', JSON.stringify(settingsDoc, null, 2));
        try {
            const updatedSettings = await settingsDoc.save();
            console.log('Backend: Settings saved successfully.');
            res.json(updatedSettings);
        } catch (saveError) {
            console.error('Backend: Error saving settings:', saveError);
            res.status(500).json({ message: 'Error saving settings: ' + saveError.message });
        }
    } else {
        console.log('Backend: No changes detected in settings. Sending back current settings.');
        res.json(settingsDoc); // Send back current settings if no changes
    }
});

export { getAppSettings, updateAppSettings };