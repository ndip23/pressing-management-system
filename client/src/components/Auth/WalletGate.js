import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Lock, Wallet, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isWalletFunded, WALLET_CURRENCY_SYMBOL } from '../../utils/onboarding';
import { WALLET_SELECT_PATH } from '../../utils/walletPayment';
import Spinner from '../UI/Spinner';
import Button from '../UI/Button';

/**
 * Route-level guard for operational pages. The dashboard and wallet flow are
 * never wrapped with this — only pages that require a funded wallet. If a user
 * deep-links to a gated page with an empty wallet, we show a full-page refill
 * prompt instead of the page content.
 */
const WalletGate = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isWalletFunded(user?.tenant)) {
    return children ?? <Outlet />;
  }

  const balance = Number(user?.tenant?.walletBalance ?? 0);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-apple-lg border border-apple-gray-200 dark:border-apple-gray-800 bg-white dark:bg-apple-gray-900 shadow-apple-xl overflow-hidden text-center">
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 px-6 py-8 text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <Lock size={28} />
          </div>
          <h1 className="text-xl font-bold">Your wallet is empty</h1>
          <p className="mt-1 text-sm text-white/90">
            Balance: {WALLET_CURRENCY_SYMBOL}{balance.toFixed(2)}
          </p>
        </div>
        <div className="px-6 py-6">
          <p className="text-sm leading-6 text-apple-gray-600 dark:text-apple-gray-300">
            Refill your account before anything is done. Once your wallet has funds,
            this page and the rest of PressMark unlock automatically.
          </p>
          <div className="mt-6">
            <Button variant="primary" onClick={() => navigate(WALLET_SELECT_PATH)} iconRight={<ArrowRight size={18} />}>
              <span className="inline-flex items-center gap-2">
                <Wallet size={18} /> Refill wallet
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletGate;
