// client/src/pages/Admin/SettingsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { fetchAppSettings, updateAppSettingsApi } from '../../services/api';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import { Save, Settings as SettingsIcon, AlertTriangle, CheckCircle2 } from 'lucide-react'; // Added CheckCircle2

const SettingsPage = () => {
    const [settings, setSettings] = useState({
        companyInfo: { name: '', address: '', phone: '', logoUrl: '' },
        notificationTemplates: {
            subject: '',
            readyForPickupBody: '',
            manualReminderSubject: '',
            manualReminderBody: ''
        },
        defaultCurrencySymbol: 'FCFA',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const loadSettings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await fetchAppSettings();
            setSettings(prev => ({
                companyInfo: { ...(prev.companyInfo || {}), ...(data.companyInfo || {}) },
                notificationTemplates: { ...(prev.notificationTemplates || {}), ...(data.notificationTemplates || {}) },
                defaultCurrencySymbol: data.defaultCurrencySymbol || prev.defaultCurrencySymbol || '$',
            }));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load settings. Please try again.');
            console.error("Load settings error:", err.response || err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleDeepChange = (path, value) => {
        setSettings(prev => {
            const newSettings = JSON.parse(JSON.stringify(prev));
            let current = newSettings;
            for (let i = 0; i < path.length - 1; i++) {
                if (!current[path[i]]) current[path[i]] = {};
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newSettings;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("handleSubmit called");

        setSaving(true);
        setError('');
        setSuccessMessage('');

        const payload = {
            companyInfo: settings.companyInfo,
            notificationTemplates: settings.notificationTemplates,
            defaultCurrencySymbol: settings.defaultCurrencySymbol,
        };
        if (payload.singletonKey) delete payload.singletonKey;
        if (payload._id) delete payload._id;
        if (payload.__v) delete payload.__v;
        if (payload.createdAt) delete payload.createdAt;
        if (payload.updatedAt) delete payload.updatedAt;

        console.log('Frontend: Submitting settings payload:', JSON.stringify(payload, null, 2));

        try {
            const response = await updateAppSettingsApi(payload);
            console.log('Frontend: API response object received:', response);

            if (response && response.data) {
                const updatedSettingsResponse = response.data;
                console.log('Frontend: Extracted response.data:', JSON.stringify(updatedSettingsResponse, null, 2));

                setSettings(prev => ({
                    companyInfo: { ...(prev.companyInfo || {}), ...(updatedSettingsResponse.companyInfo || {}) },
                    notificationTemplates: { ...(prev.notificationTemplates || {}), ...(updatedSettingsResponse.notificationTemplates || {}) },
                    defaultCurrencySymbol: updatedSettingsResponse.defaultCurrencySymbol || prev.defaultCurrencySymbol || '$',
                }));
                setSuccessMessage('Settings saved successfully!');
                console.log("Frontend: setSuccessMessage called with 'Settings saved successfully!'");
            } else {
                console.error('Frontend: API call successful, but invalid response structure.', response);
                setError('Received an unexpected response from the server when saving.');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to save settings. Please try again.';
            setError(errorMessage);
            console.error("Frontend: Save settings error caught:", err.response || err.message || err);
        } finally {
            setSaving(false);
            // The useEffect for message clearing is more reliable than logging state here due to async nature
        }
    };

    useEffect(() => {
        let successTimerId;
        let errorTimerId;

        if (successMessage) {
            console.log("useEffect [successMessage]: successMessage is now:", successMessage);
            successTimerId = setTimeout(() => {
                console.log("useEffect [successMessage]: Clearing successMessage");
                setSuccessMessage('');
            }, 4000); // Clear success after 4 seconds
        }

        if (error) {
            console.log("useEffect [error]: error is now:", error);
            // Only set a timer to clear error if there isn't a success message currently displayed
            // This prevents an error from immediately clearing a success message if both were set close together
            if (!successMessage) {
                errorTimerId = setTimeout(() => {
                    console.log("useEffect [error]: Clearing error");
                    setError('');
                }, 7000); // Clear error after 7 seconds
            }
        }
        return () => { // Cleanup function
            clearTimeout(successTimerId);
            clearTimeout(errorTimerId);
        };
    }, [successMessage, error]); // Dependencies for this effect

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error && (!settings || !settings.companyInfo)) { // If initial load failed badly
        return (
             <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                    <SettingsIcon size={28} className="text-apple-blue" />
                    <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">
                        Application Settings
                    </h1>
                </div>
                <div className="p-4 text-center text-apple-red bg-red-50 dark:bg-red-900/30 rounded-apple border border-red-200 dark:border-red-700">
                    <AlertTriangle size={32} className="mx-auto mb-2" />
                    <p>{error}</p>
                    <Button onClick={loadSettings} variant="secondary" className="mt-3">Try Again</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
                <SettingsIcon size={28} className="text-apple-blue" />
                <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">
                    Application Settings
                </h1>
            </div>

            {/* Message Display Area */}
            {successMessage && (
                <div className="p-3 mb-4 bg-green-100 text-apple-green rounded-apple border border-green-300 dark:border-green-700 dark:text-green-300 dark:bg-green-900/30">
                     <div className="flex items-center">
                        <CheckCircle2 size={20} className="mr-2 flex-shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                </div>
            )}
            {error && !successMessage && ( // Show error only if there's no active success message
                <div className="p-3 mb-4 bg-red-100 text-apple-red rounded-apple border border-red-300 dark:border-red-700 dark:text-red-300 dark:bg-red-900/30">
                    <div className="flex items-center">
                        <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                </div>
            )}


            <form onSubmit={handleSubmit}>
                <Card title="Company Information" className="mb-8 shadow-apple-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                        <Input label="Company Name" id="companyName" value={settings.companyInfo?.name || ''} onChange={(e) => handleDeepChange(['companyInfo', 'name'], e.target.value)} />
                        <Input label="Company Phone" id="companyPhone" value={settings.companyInfo?.phone || ''} onChange={(e) => handleDeepChange(['companyInfo', 'phone'], e.target.value)} />
                        <div className="md:col-span-2">
                            <Input label="Company Address" id="companyAddress" value={settings.companyInfo?.address || ''} onChange={(e) => handleDeepChange(['companyInfo', 'address'], e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                            <Input label="Logo URL (for receipts/emails)" id="companyLogoUrl" value={settings.companyInfo?.logoUrl || ''} onChange={(e) => handleDeepChange(['companyInfo', 'logoUrl'], e.target.value)} />
                        </div>
                    </div>
                </Card>

                <Card title="Notification Templates" className="mb-8 shadow-apple-md">
                    <Input
                        label="Default Email Subject (General)"
                        id="defaultSubject"
                        value={settings.notificationTemplates?.subject || ''}
                        onChange={(e) => handleDeepChange(['notificationTemplates', 'subject'], e.target.value)}
                        className="mb-6"
                        helperText={`Available placeholders: {{customerName}}, {{receiptNumber}}, {{companyName}}`}
                    />
                    <div className="mb-6">
                        <label htmlFor="readyForPickupBody" className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">
                            'Ready for Pickup' Email Body
                        </label>
                        <textarea
                            id="readyForPickupBody"
                            rows="6"
                            className="form-textarea block w-full sm:text-sm border-apple-gray-300 focus:border-apple-blue focus:ring-apple-blue dark:bg-apple-gray-800 dark:border-apple-gray-700 dark:text-apple-gray-100 dark:focus:border-apple-blue rounded-apple shadow-apple-sm"
                            value={settings.notificationTemplates?.readyForPickupBody || ''}
                            onChange={(e) => handleDeepChange(['notificationTemplates', 'readyForPickupBody'], e.target.value)}
                        />
                        <p className="mt-1 text-xs text-apple-gray-500 dark:text-apple-gray-400">
                            Available placeholders: {`{{customerName}}`}, {`{{receiptNumber}}`}, {`{{companyName}}`}. Use `\n` for new lines.
                        </p>
                    </div>
                    <div className="mb-6">
                        <label htmlFor="manualReminderSubject" className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">
                            Manual Reminder Email Subject
                        </label>
                         <Input
                            id="manualReminderSubject"
                            value={settings.notificationTemplates?.manualReminderSubject || ''}
                            onChange={(e) => handleDeepChange(['notificationTemplates', 'manualReminderSubject'], e.target.value)}
                            helperText={`Available placeholders: {{customerName}}, {{receiptNumber}}, {{companyName}}. Used for manual 'Resend Notification'.`}
                        />
                    </div>
                    <div>
                        <label htmlFor="manualReminderBody" className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">
                            Manual Reminder Email Body
                        </label>
                        <textarea
                            id="manualReminderBody"
                            rows="6"
                            className="form-textarea block w-full sm:text-sm border-apple-gray-300 focus:border-apple-blue focus:ring-apple-blue dark:bg-apple-gray-800 dark:border-apple-gray-700 dark:text-apple-gray-100 dark:focus:border-apple-blue rounded-apple shadow-apple-sm"
                            value={settings.notificationTemplates?.manualReminderBody || ''}
                            onChange={(e) => handleDeepChange(['notificationTemplates', 'manualReminderBody'], e.target.value)}
                        />
                         <p className="mt-1 text-xs text-apple-gray-500 dark:text-apple-gray-400">
                            Available placeholders like above.
                         </p>
                    </div>
                </Card>

                <Card title="General Settings" className="mb-8 shadow-apple-md">
                    <Input
                        label="Default Currency Symbol"
                        id="defaultCurrencySymbol"
                        value={settings.defaultCurrencySymbol || ''}
                        onChange={(e) => handleDeepChange(['defaultCurrencySymbol'], e.target.value)}
                        className="max-w-xs"
                    />
                </Card>

                <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary" isLoading={saving} iconLeft={<Save size={18}/>}>
                        Save All Settings
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;