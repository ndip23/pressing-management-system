// client/src/pages/Admin/SettingsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { fetchAppSettings, updateAppSettingsApi, getMyTenantProfileApi, updateMyTenantProfileApi } from '../../services/api';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import Select from '../../components/UI/Select'; 
import { Save, Settings as SettingsIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';
 const PublicProfileManager = () => {
    const [profile, setProfile] = useState({
        name: '', publicAddress: '', publicPhone: '', publicEmail: '',
        city: '', country: '', description: '', logoUrl: '',
        isListedInDirectory: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true); setError('');
            try {
                const { data } = await getMyTenantProfileApi();
                setProfile(data);
            } catch (err) {
                setError("Failed to load public profile data.");
                console.error("Load Tenant Profile Error:", err);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProfile(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true); setError(''); setSuccess('');
        try {
            const { data } = await updateMyTenantProfileApi(profile);
            setProfile(data); // Re-sync state with saved data from backend
            setSuccess("Public profile updated successfully!");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save profile.");
            console.error("Save Tenant Profile Error:", err);
        } finally {
            setSaving(false);
            setTimeout(() => { setSuccess(''); setError(''); }, 4000);
        }
    };

    if (loading) return <div className="p-4 text-center"><Spinner /></div>;
    if (error && !loading) return <div className="p-3 m-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{error}</div>

    return (
        <Card title="Public Directory Profile" className="mb-8 shadow-apple-md">
            <form onSubmit={handleSubmit}>
                {success && <p className="p-3 mb-4 text-sm bg-green-100 text-apple-green rounded-apple flex items-center"><CheckCircle2 size={18} className="mr-2"/>{success}</p>}
                <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400 mb-4">
                    This information will be visible to the public on the PressFlow Business Directory page.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <Input label="Public Business Name" id="name" name="name" value={profile.name || ''} onChange={handleChange} />
                    <Input label="Public Phone" id="publicPhone" name="publicPhone" value={profile.publicPhone || ''} onChange={handleChange} />
                    <Input label="Public Email" id="publicEmail" name="publicEmail" type="email" value={profile.publicEmail || ''} onChange={handleChange} />
                    <Input label="City" id="city" name="city" value={profile.city || ''} onChange={handleChange} />
                    <Input label="Country" id="country" name="country" value={profile.country || ''} onChange={handleChange} />
                    <div className="md:col-span-2">
                        <Input label="Public Address" id="publicAddress" name="publicAddress" value={profile.publicAddress || ''} onChange={handleChange} />
                    </div>
                    <div className="md:col-span-2">
                        <Input label="Logo URL" id="logoUrl" name="logoUrl" value={profile.logoUrl || ''} onChange={handleChange} helperText="A direct link to your company logo image (e.g., from your website)." />
                    </div>
                     <div className="md:col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium">Short Description</label>
                        <textarea id="description" name="description" rows="3" value={profile.description || ''} onChange={handleChange} className="form-textarea mt-1 block w-full" placeholder="A short bio about your business..." />
                    </div>
                    <div className="md:col-span-2 flex items-center space-x-3 mt-2">
                        <input
                            type="checkbox"
                            id="isListedInDirectory"
                            name="isListedInDirectory"
                            checked={profile.isListedInDirectory}
                            onChange={handleChange}
                            className="form-checkbox h-5 w-5 text-apple-blue"
                        />
                        <label htmlFor="isListedInDirectory" className="text-sm font-medium">List my business in the public directory</label>
                    </div>
                </div>
                <div className="flex justify-end pt-6">
                    <Button type="submit" isLoading={saving} iconLeft={<Save size={16} />}>Save Public Profile</Button>
                </div>
            </form>
        </Card>
    );
};

const SettingsPage = () => {
    const [settings, setSettings] = useState({
        companyInfo: { name: '', address: '', phone: '', logoUrl: '' },
        notificationTemplates: {
            subject: '',
            readyForPickupBody: '',
            manualReminderSubject: '',
            manualReminderBody: '',
            whatsappOrderReadySid: '', // Added for form binding
            whatsappManualReminderSid: '' // Added for form binding
        },
        defaultCurrencySymbol: 'FCFA',
        preferredNotificationChannel: 'whatsapp',
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
                defaultCurrencySymbol: data.defaultCurrencySymbol || prev.defaultCurrencySymbol,
                preferredNotificationChannel: data.preferredNotificationChannel || prev.preferredNotificationChannel,
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
        setSaving(true);
        setError('');
        setSuccessMessage('');

        // Prepare payload, removing any internal fields from the object
        const payload = { ...settings };
        ['singletonKey', '_id', '__v', 'createdAt', 'updatedAt'].forEach(key => delete payload[key]);

        try {
            const response = await updateAppSettingsApi(payload);
            if (response && response.data) {
                const updatedSettingsResponse = response.data;
                // Re-sync state with what backend confirmed was saved
                setSettings(prev => ({
                    companyInfo: { ...(prev.companyInfo || {}), ...(updatedSettingsResponse.companyInfo || {}) },
                    notificationTemplates: { ...(prev.notificationTemplates || {}), ...(updatedSettingsResponse.notificationTemplates || {}) },
                    defaultCurrencySymbol: updatedSettingsResponse.defaultCurrencySymbol || prev.defaultCurrencySymbol,
                    preferredNotificationChannel: updatedSettingsResponse.preferredNotificationChannel || prev.preferredNotificationChannel,
                }));
                setSuccessMessage('Settings saved successfully!');
            } else {
                setError('Received an unexpected response from the server when saving.');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to save settings. Please try again.';
            setError(errorMessage);
            console.error("Save settings error caught:", err.response || err.message || err);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        let timer;
        if (successMessage || error) {
            timer = setTimeout(() => { setSuccessMessage(''); setError(''); }, 5000);
        }
        return () => clearTimeout(timer);
    }, [successMessage, error]);

    if (loading) { return ( <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div> ); }
    if (error && (!settings || !settings.companyInfo)) {
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
             <PublicProfileManager />
            {successMessage && ( <div className="p-3 mb-4 bg-green-100 text-apple-green rounded-apple border border-green-300 dark:border-green-700 dark:text-green-300 dark:bg-green-900/30"> <div className="flex items-center"><CheckCircle2 size={20} className="mr-2 flex-shrink-0" /><span>{successMessage}</span></div> </div> )}
            {error && !successMessage && ( <div className="p-3 mb-4 bg-red-100 text-apple-red rounded-apple border border-red-300 dark:border-red-700 dark:text-red-300 dark:bg-red-900/30"> <div className="flex items-center"><AlertTriangle size={20} className="mr-2 flex-shrink-0" /><span>{error}</span></div> </div> )}

            <form onSubmit={handleSubmit}>
                <Card title="Company Information" className="mb-8 shadow-apple-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                        <Input label="Company Name" id="companyName" value={settings.companyInfo?.name || ''} onChange={(e) => handleDeepChange(['companyInfo', 'name'], e.target.value)} />
                        <Input label="Company Phone" id="companyPhone" value={settings.companyInfo?.phone || ''} onChange={(e) => handleDeepChange(['companyInfo', 'phone'], e.target.value)} />
                        <div className="md:col-span-2"> <Input label="Company Address" id="companyAddress" value={settings.companyInfo?.address || ''} onChange={(e) => handleDeepChange(['companyInfo', 'address'], e.target.value)} /> </div>
                        <div className="md:col-span-2"> <Input label="Logo URL (for receipts/emails)" id="companyLogoUrl" value={settings.companyInfo?.logoUrl || ''} onChange={(e) => handleDeepChange(['companyInfo', 'logoUrl'], e.target.value)} /> </div>
                    </div>
                </Card>

                <Card title="Notification Templates" className="mb-8 shadow-apple-md">
                    <Input label="Default Email Subject (General)" id="defaultSubject" value={settings.notificationTemplates?.subject || ''} onChange={(e) => handleDeepChange(['notificationTemplates', 'subject'], e.target.value)} className="mb-6" helperText={`Placeholders: {{customerName}}, {{receiptNumber}}, {{companyName}}`} />
                    <div className="mb-6">
                        <label htmlFor="readyForPickupBody" className="block text-sm font-medium mb-1">'Ready for Pickup' Email/SMS Body</label>
                        <textarea id="readyForPickupBody" rows="6" className="form-textarea block w-full sm:text-sm" value={settings.notificationTemplates?.readyForPickupBody || ''} onChange={(e) => handleDeepChange(['notificationTemplates', 'readyForPickupBody'], e.target.value)} />
                        <p className="mt-1 text-xs text-apple-gray-500">Placeholders: {`{{customerName}}`}, {`{{receiptNumber}}`}, {`{{companyName}}`}. Use `\n` for new lines.</p>
                    </div>
                    {/* Add more template fields as needed */}

                    <h4 className="text-md font-semibold mt-6 mb-2 border-t pt-4">WhatsApp Template SIDs (Optional)</h4>
                    <p className="text-xs text-apple-gray-500 mb-4">For production WhatsApp notifications, you must use pre-approved templates from Twilio. Enter the Template SIDs here.</p>
                    <Input label="'Order Ready' Template SID" id="whatsappOrderReadySid" value={settings.notificationTemplates?.whatsappOrderReadySid || ''} onChange={(e) => handleDeepChange(['notificationTemplates', 'whatsappOrderReadySid'], e.target.value)} className="mb-4" helperText="e.g., HX..." />
                    <Input label="'Manual Reminder' Template SID" id="whatsappManualReminderSid" value={settings.notificationTemplates?.whatsappManualReminderSid || ''} onChange={(e) => handleDeepChange(['notificationTemplates', 'whatsappManualReminderSid'], e.target.value)} helperText="e.g., HX..." />
                </Card>

                <Card title="General Settings" className="mb-8 shadow-apple-md">
                    <Input label="Default Currency Symbol" id="defaultCurrencySymbol" value={settings.defaultCurrencySymbol || ''} onChange={(e) => setSettings(prev => ({...prev, defaultCurrencySymbol: e.target.value}))} className="max-w-xs" />
                    <Select
                        label="Preferred Notification Channel"
                        id="preferredNotificationChannel"
                        value={settings.preferredNotificationChannel || 'whatsapp'}
                        onChange={(e) => setSettings(prev => ({...prev, preferredNotificationChannel: e.target.value}))}
                        options={[ { value: 'whatsapp', label: 'WhatsApp / SMS First' }, { value: 'email', label: 'Email First' }, { value: 'none', label: 'Disable All Notifications' }]}
                        className="mt-4"
                        helperText="The system will try this channel first if contact info is available."
                    />
                </Card>

                <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary" isLoading={saving} iconLeft={<Save size={18} />}> Save All Settings </Button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;