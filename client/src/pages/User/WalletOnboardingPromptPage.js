import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isWalletFunded } from '../../utils/onboarding';
import { Wallet, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../contexts/SettingsContext';
import Button from '../../components/UI/Button';
import { MIN_TOP_UP_AMOUNT, CONTACT_FEE, WALLET_CURRENCY_SYMBOL } from '../../utils/onboarding';

const WalletOnboardingPromptPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const balance = user?.tenant?.walletBalance ?? 0;
  const currency = WALLET_CURRENCY_SYMBOL;
  const supportEmail =
    settings?.companyInfo?.email ||
    process.env.REACT_APP_SUPPORT_EMAIL ||
    'support@pressmark.site';

  useEffect(() => {
    if (isWalletFunded(user?.tenant)) {
      navigate('/app/onboarding/business-profile', { replace: true });
    }
  }, [user?.tenant?.walletBalance, navigate]);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col">
      <div className="bg-red-600 text-white text-center text-xs sm:text-sm font-semibold uppercase tracking-wide py-2.5 px-4">
        Low wallet balance ({currency} {balance.toFixed(2)}) — top up now to avoid listing deactivation
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-apple-gray-50 dark:bg-apple-gray-950">
        <div className="w-full max-w-lg rounded-3xl border border-apple-gray-200 bg-white p-8 sm:p-10 text-center shadow-apple-xl dark:border-apple-gray-800 dark:bg-apple-gray-900">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Wallet size={32} className="text-amber-600 dark:text-amber-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-apple-gray-900 dark:text-white">
            Step 1: Top up Wallet
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-apple-gray-600 dark:text-apple-gray-300">
            Your virtual wallet balance is empty ({currency} {balance.toFixed(2)}). Please add at least{' '}
            <strong>
              {currency} {MIN_TOP_UP_AMOUNT.toFixed(2)}
            </strong>{' '}
            to activate your business profile. Bookings cost {currency} {CONTACT_FEE.toFixed(2)} each.
          </p>

          <Button
            variant="primary"
            size="lg"
            className="mt-8 w-full justify-center"
            onClick={() => navigate('/app/wallet/select-country', { state: { fromOnboarding: true } })}
            iconRight={<ArrowRight size={18} />}
          >
            Top up Wallet
          </Button>

          <p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-apple-gray-400">
            Need help? Contact {supportEmail}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletOnboardingPromptPage;
