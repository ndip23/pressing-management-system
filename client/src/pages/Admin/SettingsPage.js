// client/src/pages/Admin/SettingsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { fetchAppSettings, updateAppSettingsApi } from '../../services/api';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import Select from '../../components/UI/Select';
import { Save, Settings as SettingsIcon, AlertTriangle } from 'lucide-react';

const SettingsPage = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState({
        notificationTemplates: {
            subject: '',
            readyForPickupBody: '',
            manualReminderSubject: '',
            manualReminderBody: '',
            whatsappOrderReadySid: '',
            whatsappManualReminderSid: '',
        },
        preferredNotificationChannel: 'whatsapp',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const loadSettings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await fetchAppSettings();
            setSettings((prev) => ({
                notificationTemplates: {
                    ...(prev.notificationTemplates || {}),
                    ...(data.notificationTemplates || {}),
                },
                preferredNotificationChannel:
                    data.preferredNotificationChannel || prev.preferredNotificationChannel,
            }));
        } catch (err) {
            setError(err.response?.data?.message || t('settings.messages.loadError'));
            console.error('Load settings error:', err.response || err);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleDeepChange = (path, value) => {
        setSettings((prev) => {
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

        const payload = { ...settings };
        ['singletonKey', '_id', '__v', 'createdAt', 'updatedAt'].forEach((key) => delete payload[key]);

        try {
            const response = await updateAppSettingsApi(payload);
            if (response?.data) {
                setSettings((prev) => ({
                    notificationTemplates: {
                        ...(prev.notificationTemplates || {}),
                        ...(response.data.notificationTemplates || {}),
                    },
                    preferredNotificationChannel:
                        response.data.preferredNotificationChannel || prev.preferredNotificationChannel,
                }));
                toast.success(t('settings.messages.saveSuccess'));
            }
        } catch (err) {
            const errorMessage =
                err.response?.data?.message || err.message || t('settings.messages.saveError');
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        let timer;
        if (error) {
            timer = setTimeout(() => {
                setError('');
            }, 5000);
        }
        return () => clearTimeout(timer);
    }, [error]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-2">
                <SettingsIcon size={28} className="text-apple-blue" />
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">
                        {t('settings.title')}
                    </h1>
                    <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400 mt-1">
                        Notification templates and channels. Business profile, logo, and currency are managed under{' '}
                        <strong>Business Profile</strong> in the sidebar.
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center gap-2">
                    <AlertTriangle size={18} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <Card title={t('settings.notifications.title')} className="mb-8 shadow-apple-md">
                    <div className="p-4 space-y-4">
                        <Input
                            label={t('settings.notifications.defaultSubject')}
                            id="defaultSubject"
                            value={settings.notificationTemplates?.subject || ''}
                            onChange={(e) => handleDeepChange(['notificationTemplates', 'subject'], e.target.value)}
                            helperText={t('settings.notifications.subjectHelper')}
                        />
                        <div>
                            <label
                                htmlFor="readyForPickupBody"
                                className="block text-sm font-medium mb-1 text-apple-gray-700 dark:text-apple-gray-300"
                            >
                                {t('settings.notifications.readyForPickupBody')}
                            </label>
                            <textarea
                                id="readyForPickupBody"
                                rows="6"
                                className="form-textarea block w-full sm:text-sm rounded-apple-md border border-apple-gray-200 dark:border-apple-gray-700 dark:bg-apple-gray-900 dark:text-white"
                                value={settings.notificationTemplates?.readyForPickupBody || ''}
                                onChange={(e) =>
                                    handleDeepChange(['notificationTemplates', 'readyForPickupBody'], e.target.value)
                                }
                            />
                            <p className="mt-1 text-xs text-apple-gray-500">
                                {t('settings.notifications.bodyHelper')}
                            </p>
                        </div>

                        <h4 className="text-md font-semibold pt-4 border-t dark:border-apple-gray-700">
                            {t('settings.notifications.whatsappTemplates')}
                        </h4>
                        <p className="text-xs text-apple-gray-500 mb-2">
                            {t('settings.notifications.whatsappDescription')}
                        </p>
                        <Input
                            label={t('settings.notifications.orderReadySid')}
                            id="whatsappOrderReadySid"
                            value={settings.notificationTemplates?.whatsappOrderReadySid || ''}
                            onChange={(e) =>
                                handleDeepChange(['notificationTemplates', 'whatsappOrderReadySid'], e.target.value)
                            }
                            helperText={t('settings.notifications.orderReadyHelper')}
                        />
                        <Input
                            label={t('settings.notifications.manualReminderSid')}
                            id="whatsappManualReminderSid"
                            value={settings.notificationTemplates?.whatsappManualReminderSid || ''}
                            onChange={(e) =>
                                handleDeepChange(['notificationTemplates', 'whatsappManualReminderSid'], e.target.value)
                            }
                            helperText={t('settings.notifications.manualReminderHelper')}
                        />
                    </div>
                </Card>

                <Card title={t('settings.general.title')} className="mb-8 shadow-apple-md">
                    <div className="p-4">
                        <Select
                            label={t('settings.general.notificationChannel')}
                            id="preferredNotificationChannel"
                            value={settings.preferredNotificationChannel || 'whatsapp'}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    preferredNotificationChannel: e.target.value,
                                }))
                            }
                            options={[
                                { value: 'whatsapp', label: t('settings.general.channels.whatsapp') },
                                { value: 'email', label: t('settings.general.channels.email') },
                                { value: 'none', label: t('settings.general.channels.none') },
                            ]}
                            helperText={t('settings.general.channelHelper')}
                        />
                    </div>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary" isLoading={saving} iconLeft={<Save size={18} />}>
                        {t('settings.actions.saveAll')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;
