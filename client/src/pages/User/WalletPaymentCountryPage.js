import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Globe, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  COUNTRY_TO_CURRENCY,
  COUNTRY_NAMES,
  SUPPORTED_COUNTRIES,
} from '../../utils/currencyMap';
import {
  getWalletPaymentCountryCode,
  setWalletPaymentCountryCode,
} from '../../utils/walletPayment';
import { updateWalletPaymentCountryApi } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import toast from 'react-hot-toast';

const LOCAL_CURRENCY_LABELS = {
  USD: 'US Dollar ($)',
  XAF: 'Central African CFA (FCFA)',
  XOF: 'West African CFA (CFA)',
  NGN: 'Nigerian Naira (₦)',
  KES: 'Kenyan Shilling (KSh)',
  GHS: 'Ghanaian Cedi (GH₵)',
  INR: 'Indian Rupee (₹)',
  GNF: 'Guinean Franc (GNF)',
  TZS: 'Tanzanian Shilling (TZS)',
  UGX: 'Ugandan Shilling (UGX)',
};

const WalletPaymentCountryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const fromOnboarding = location.state?.fromOnboarding;

  const initialCountry =
    getWalletPaymentCountryCode(user?.tenant) ||
    user?.tenant?.countryCode ||
    'CM';

  const [countryCode, setCountryCode] = useState(initialCountry);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const existing = getWalletPaymentCountryCode(user?.tenant);
    if (existing) setCountryCode(existing);
  }, [user?.tenant?.countryCode]);

  const selectedCurrency = COUNTRY_TO_CURRENCY[countryCode] || 'USD';
  const currencyLabel = LOCAL_CURRENCY_LABELS[selectedCurrency] || selectedCurrency;

  const handleContinue = async () => {
    if (!countryCode || !COUNTRY_TO_CURRENCY[countryCode]) {
      toast.error('Please select your country for payment.');
      return;
    }

    setSaving(true);
    try {
      setWalletPaymentCountryCode(countryCode);
      await updateWalletPaymentCountryApi(countryCode);
      await refreshUser();
      navigate('/app/wallet', {
        state: { fromOnboarding, paymentCountryCode: countryCode },
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Could not save your payment country. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <Card className="w-full p-8 shadow-apple-xl">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-apple-blue/10">
          <Globe size={28} className="text-apple-blue" />
        </div>

        <h1 className="text-2xl font-bold text-center text-apple-gray-900 dark:text-white">
          Choose payment country
        </h1>
        <p className="mt-3 text-sm text-center text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed">
          Select where you will pay from. Swyhr Pay will charge you in your local currency. Your
          wallet balance is always stored in US dollars.
        </p>

        <div className="mt-8 space-y-2">
          <label
            htmlFor="paymentCountry"
            className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-200"
          >
            Country
          </label>
          <select
            id="paymentCountry"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full rounded-apple-md border border-apple-gray-200 bg-white px-4 py-3 text-sm text-apple-gray-900 shadow-sm outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 dark:border-apple-gray-700 dark:bg-apple-gray-900 dark:text-white"
          >
            {SUPPORTED_COUNTRIES.map((code) => (
              <option key={code} value={code}>
                {COUNTRY_NAMES[code] || code} — {COUNTRY_TO_CURRENCY[code]}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 rounded-apple-md bg-apple-gray-50 dark:bg-apple-gray-900/60 p-4 text-sm">
          <p className="text-apple-gray-500 dark:text-apple-gray-400">Checkout currency</p>
          <p className="mt-1 font-semibold text-apple-gray-900 dark:text-white">{currencyLabel}</p>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="mt-8 w-full justify-center"
          onClick={handleContinue}
          isLoading={saving}
          iconRight={saving ? null : <ArrowRight size={18} />}
        >
          Continue to top up
        </Button>
      </Card>
    </div>
  );
};

export default WalletPaymentCountryPage;
