import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from './AuthContext';
import {
  isWalletFunded,
  WALLET_CURRENCY_SYMBOL,
} from '../utils/onboarding';
import { WALLET_SELECT_PATH } from '../utils/walletPayment';
import Button from '../components/UI/Button';

const WalletGuardContext = createContext(null);

/**
 * Wraps the authenticated app shell. Exposes a single primitive:
 *   guard(path, navigateFn?)  → navigates when the wallet is funded,
 *                               otherwise opens a blocking "refill" modal.
 * It also renders the modal itself so any screen inside the shell is covered.
 */
export const WalletGuardProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blocked, setBlocked] = useState(false);

  const walletFunded = isWalletFunded(user?.tenant);
  const walletBalance = Number(user?.tenant?.walletBalance ?? 0);

  const openBlock = useCallback(() => setBlocked(true), []);
  const closeBlock = useCallback(() => setBlocked(false), []);

  // Returns true if the navigation was allowed, false if it was blocked.
  const guard = useCallback(
    (path) => {
      if (walletFunded) {
        if (path) navigate(path);
        return true;
      }
      setBlocked(true);
      return false;
    },
    [walletFunded, navigate],
  );

  // For use as an onClick handler on <Link>/<NavLink> elements.
  const guardClick = useCallback(
    (event) => {
      if (walletFunded) return true;
      event.preventDefault();
      event.stopPropagation();
      setBlocked(true);
      return false;
    },
    [walletFunded],
  );

  const goTopUp = useCallback(() => {
    setBlocked(false);
    navigate(WALLET_SELECT_PATH);
  }, [navigate]);

  const value = useMemo(
    () => ({ walletFunded, walletBalance, guard, guardClick, openBlock, closeBlock }),
    [walletFunded, walletBalance, guard, guardClick, openBlock, closeBlock],
  );

  return (
    <WalletGuardContext.Provider value={value}>
      {children}
      {blocked && !walletFunded && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-block-title"
            className="w-full max-w-md rounded-apple-lg bg-white dark:bg-apple-gray-900 border border-apple-gray-200 dark:border-apple-gray-800 shadow-apple-2xl overflow-hidden animate-modal-appear"
          >
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 px-6 py-8 text-center text-white">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                <Lock size={28} />
              </div>
              <h2 id="wallet-block-title" className="text-xl font-bold">
                Your wallet is empty
              </h2>
              <p className="mt-1 text-sm text-white/90">
                Balance: {WALLET_CURRENCY_SYMBOL}{walletBalance.toFixed(2)}
              </p>
            </div>

            <div className="px-6 py-6 text-center">
              <p className="text-sm leading-6 text-apple-gray-600 dark:text-apple-gray-300">
                Please refill your account before anything is done. PressMark runs on a
                pay-as-you-go wallet — once you top up, every feature unlocks and we'll
                walk you through a quick tour of the platform.
              </p>

              <div className="mt-6 flex flex-col gap-2">
                <Button variant="primary" onClick={goTopUp} iconRight={<ArrowRight size={18} />}>
                  <span className="inline-flex items-center gap-2">
                    <Wallet size={18} /> Refill wallet
                  </span>
                </Button>
                <Button variant="ghost" size="sm" onClick={closeBlock}>
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </WalletGuardContext.Provider>
  );
};

const fallback = {
  walletFunded: true,
  walletBalance: 0,
  guard: () => true,
  guardClick: () => true,
  openBlock: () => {},
  closeBlock: () => {},
};

export const useWalletGuard = () => useContext(WalletGuardContext) ?? fallback;
