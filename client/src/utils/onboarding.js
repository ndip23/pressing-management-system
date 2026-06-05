export const MIN_WALLET_BALANCE = 0.01;
export const MIN_TOP_UP_AMOUNT = 5;
export const CONTACT_FEE = 0.5;
export const WALLET_CURRENCY_CODE = 'USD';
export const WALLET_CURRENCY_SYMBOL = '$';

export const ONBOARDING_PATHS = {
  wallet: '/app/onboarding/wallet',
  profile: '/app/onboarding/business-profile',
  pricing: '/app/onboarding/services-pricing',
};

export const isWalletFunded = (tenant) => (tenant?.walletBalance ?? 0) > MIN_WALLET_BALANCE;

export const isProfileComplete = (tenant) => {
  if (!tenant) return false;
  if (tenant.onboardingProfileCompleted) return true;
  return !!(
    tenant.name?.trim() &&
    tenant.city?.trim() &&
    tenant.publicPhone?.trim() &&
    tenant.description?.trim()
  );
};

export const isPricingComplete = (tenant) => !!tenant?.onboardingPricingCompleted;

// The ONLY hard requirement to use the app is a funded wallet.
// Business profile + services/pricing are optional nudges shown on the
// dashboard, never blocking redirects.
export const getOnboardingStep = (user) => {
  if (!user || user.role === 'superadmin') return 'complete';
  const tenant = user.tenant;
  if (!tenant) return 'wallet';
  if (!isWalletFunded(tenant)) return 'wallet';
  return 'complete';
};

// New accounts always land on the dashboard. Funding happens via the
// in-app wallet block (see WalletGuardContext), not a forced redirect.
export const getOnboardingPath = () => '/app/dashboard';

export const isOnboardingRoute = (pathname) =>
  pathname.startsWith('/app/onboarding') ||
  pathname.startsWith('/app/wallet');
