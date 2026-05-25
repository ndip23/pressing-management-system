import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getMyTenantProfileApi,
  updateMyTenantProfileApi,
  uploadTenantLogoApi,
  fetchAppSettings,
  updateAppSettingsApi,
  updateWalletPaymentCountryApi,
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../contexts/SettingsContext';
import { COUNTRY_NAMES, COUNTRY_TO_CURRENCY, SUPPORTED_COUNTRIES } from '../../utils/currencyMap';
import { setWalletPaymentCountryCode } from '../../utils/walletPayment';
import { SUPPORTED_ORDER_CURRENCIES, CURRENCY_SYMBOL_MAP } from '../../utils/businessCurrency';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import GalleryManager from '../../components/Admin/GalleryManager';
import { CheckCircle2, AlertTriangle, UploadCloud, ImagePlus, MapPin, Store } from 'lucide-react';

const BusinessProfileSetupPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const { loadSettings } = useAppSettings();
  const fromSignUp = location.state?.fromSignup;
  const fromOnboarding = location.pathname.includes('/onboarding/') || location.state?.fromOnboarding;

  const [profile, setProfile] = useState({
    name: '',
    publicAddress: '',
    publicPhone: '',
    publicEmail: '',
    city: '',
    country: '',
    countryCode: 'CM',
    description: '',
    logoUrl: '',
    isListedInDirectory: true,
  });
  const [currencyCode, setCurrencyCode] = useState('XAF');
  const [currencySymbol, setCurrencySymbol] = useState('FCFA');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [logoPreview, setLogoPreview] = useState('');
  const fileInputRef = useRef(null);

  const countryOptions = SUPPORTED_COUNTRIES.map((code) => ({
    value: code,
    label: `${COUNTRY_NAMES[code] || code} (${COUNTRY_TO_CURRENCY[code]})`,
  }));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, settingsRes] = await Promise.all([
        getMyTenantProfileApi(),
        fetchAppSettings(),
      ]);
      const data = profileRes.data;
      setProfile((prev) => ({ ...prev, ...data }));
      setLogoPreview(data.logoUrl || '');
      const settings = settingsRes.data;
      if (settings?.defaultCurrencyCode) {
        setCurrencyCode(settings.defaultCurrencyCode);
        setCurrencySymbol(settings.defaultCurrencySymbol || CURRENCY_SYMBOL_MAP[settings.defaultCurrencyCode] || '');
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || t('businessProfile.loadError'),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCountryCodeChange = (e) => {
    const code = e.target.value;
    setProfile((prev) => ({
      ...prev,
      countryCode: code,
      country: COUNTRY_NAMES[code] || prev.country,
    }));
  };

  const handleCurrencyCodeChange = (e) => {
    const code = e.target.value;
    setCurrencyCode(code);
    setCurrencySymbol(CURRENCY_SYMBOL_MAP[code] || code);
  };

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('businessProfile.logoTooLarge') });
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage({ type: 'error', text: t('businessProfile.logoInvalidType') });
      return;
    }

    setUploadingLogo(true);
    setMessage({ type: '', text: '' });
    setLogoPreview(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append('logoImage', file);
      const { data } = await uploadTenantLogoApi(formData);
      setProfile((prev) => ({ ...prev, logoUrl: data.imageUrl || data.logoUrl || prev.logoUrl }));
      setMessage({ type: 'success', text: t('businessProfile.logoUploadSuccess') });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || t('businessProfile.logoUploadFailed'),
      });
      setLogoPreview(profile.logoUrl || '');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await updateMyTenantProfileApi(profile);
      setProfile((prev) => ({ ...prev, ...data }));

      await updateAppSettingsApi({
        defaultCurrencyCode: currencyCode,
        defaultCurrencySymbol: currencySymbol,
      });

      if (profile.countryCode) {
        setWalletPaymentCountryCode(profile.countryCode);
        await updateWalletPaymentCountryApi(profile.countryCode);
      }

      await refreshUser();
      loadSettings();
      setMessage({ type: 'success', text: t('businessProfile.saveSuccess') });

      if (fromOnboarding) {
        navigate('/app/onboarding/services-pricing', { replace: true, state: { fromOnboarding: true } });
      } else if (fromSignUp) {
        navigate('/app/dashboard', { state: { showTour: true } });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || t('businessProfile.saveFailed'),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const pageTitle = fromOnboarding
    ? t('businessProfile.onboardingStepTitle')
    : t('businessProfile.title');

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-apple bg-apple-blue/10">
            <Store size={24} className="text-apple-blue" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-900 dark:text-apple-gray-100">
              {pageTitle}
            </h1>
            <p className="mt-2 text-sm text-apple-gray-500 dark:text-apple-gray-400">
              {fromOnboarding
                ? t('businessProfile.subtitleOnboarding')
                : fromSignUp
                  ? t('businessProfile.subtitleNewUser')
                  : t('businessProfile.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-apple ${
            message.type === 'success'
              ? 'bg-green-50 text-apple-green dark:bg-green-900/20'
              : 'bg-red-50 text-apple-red dark:bg-red-900/20'
          }`}
        >
          <div className="flex items-start gap-2">
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            <p className="text-sm">{message.text}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-apple-sm" title={t('businessProfile.title')}>
          <div className="p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('businessProfile.businessName')}
                name="name"
                value={profile.name || ''}
                onChange={handleChange}
                required
              />
              <Input
                label={t('businessProfile.publicPhone')}
                name="publicPhone"
                value={profile.publicPhone || ''}
                onChange={handleChange}
                required={fromOnboarding}
              />
              <Input
                label={t('businessProfile.publicEmail')}
                type="email"
                name="publicEmail"
                value={profile.publicEmail || ''}
                onChange={handleChange}
              />
              <Select
                label={t('businessProfile.paymentCountry')}
                id="countryCode"
                value={profile.countryCode || 'CM'}
                onChange={handleCountryCodeChange}
                options={countryOptions}
                helperText={t('businessProfile.paymentCountryHelper')}
              />
              <Input
                label={t('businessProfile.city')}
                name="city"
                value={profile.city || ''}
                onChange={handleChange}
                icon={<MapPin size={16} />}
                required={fromOnboarding}
              />
              <Input
                label={t('businessProfile.publicAddress')}
                name="publicAddress"
                value={profile.publicAddress || ''}
                onChange={handleChange}
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300"
              >
                {t('businessProfile.description')}
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={profile.description || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-apple-md border border-apple-gray-200 bg-white px-3 py-2 text-sm text-apple-gray-900 shadow-sm outline-none transition focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 dark:border-apple-gray-700 dark:bg-apple-gray-900 dark:text-white"
                placeholder={t('businessProfile.descriptionPlaceholder')}
                required={fromOnboarding}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 items-start">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300">
                  {t('businessProfile.businessLogo')}
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-28 h-28 rounded-2xl border border-apple-gray-200 bg-apple-gray-50 dark:border-apple-gray-700 dark:bg-apple-gray-800 overflow-hidden flex items-center justify-center">
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UploadCloud size={40} className="text-apple-gray-400" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      iconLeft={<ImagePlus size={16} />}
                    >
                      {uploadingLogo
                        ? t('businessProfile.uploadingLogo')
                        : t('businessProfile.uploadLogo')}
                    </Button>
                    <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
                      {t('businessProfile.logoNote')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input
                  id="isListedInDirectory"
                  name="isListedInDirectory"
                  type="checkbox"
                  checked={profile.isListedInDirectory}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-apple-gray-300 text-apple-blue focus:ring-apple-blue"
                />
                <label
                  htmlFor="isListedInDirectory"
                  className="text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300"
                >
                  {t('businessProfile.listInDirectory')}
                </label>
              </div>
            </div>
          </div>
        </Card>

        <Card className="shadow-apple-sm" title={t('businessProfile.currencySection')}>
          <div className="p-6 space-y-4">
            <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">
              {t('businessProfile.currencySectionHelper')}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label={t('businessProfile.currencyCode')}
                id="currencyCode"
                value={currencyCode}
                onChange={handleCurrencyCodeChange}
                options={SUPPORTED_ORDER_CURRENCIES}
              />
              <Input
                label={t('businessProfile.currencySymbol')}
                id="currencySymbol"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {!fromOnboarding && profile._id && (
          <Card className="shadow-apple-sm" title={t('businessProfile.galleryTitle')}>
            <div className="p-6">
              <GalleryManager tenantId={profile._id} />
            </div>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
          {fromSignUp && !fromOnboarding && (
            <Button type="button" variant="secondary" onClick={() => navigate('/app/dashboard')}>
              {t('businessProfile.skipForNow')}
            </Button>
          )}
          <Button type="submit" variant="primary" isLoading={saving} iconLeft={<CheckCircle2 size={16} />}>
            {fromOnboarding || fromSignUp
              ? t('businessProfile.saveAndContinue')
              : t('businessProfile.saveProfile')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BusinessProfileSetupPage;
