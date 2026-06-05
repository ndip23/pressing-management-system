import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppTour } from '../../contexts/AppTourContext';
import { isWalletFunded } from '../../utils/onboarding';

const PENDING_KEY = 'pressmark_tour_pending';
const DONE_KEY = 'pressmark_tour_done';

/**
 * Watches the wallet balance. The moment a freshly-registered account funds its
 * wallet for the first time, kick off the guided product tour (once).
 *
 * SignUpPage sets PENDING_KEY = '1' right after account creation.
 */
const WalletTourTrigger = () => {
  const { user } = useAuth();
  const { startTour } = useAppTour();

  useEffect(() => {
    if (!user) return;
    const funded = isWalletFunded(user?.tenant);
    const pending = localStorage.getItem(PENDING_KEY) === '1';
    const alreadyDone = localStorage.getItem(DONE_KEY) === '1';

    if (funded && pending && !alreadyDone) {
      localStorage.removeItem(PENDING_KEY);
      localStorage.setItem(DONE_KEY, '1');
      // Defer so the dashboard has painted before the tour overlay appears.
      const timer = setTimeout(() => startTour(), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [user, startTour]);

  return null;
};

export default WalletTourTrigger;
