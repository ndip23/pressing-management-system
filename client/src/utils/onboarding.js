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

export const getOnboardingStep = (user) => {
  if (!user || user.role === 'superadmin') return 'complete';
  const tenant = user.tenant;
  if (!tenant) return 'wallet';
  if (!isWalletFunded(tenant)) return 'wallet';
  if (!isProfileComplete(tenant)) return 'profile';
  if (!isPricingComplete(tenant)) return 'pricing';
  return 'complete';
};

export const getOnboardingPath = (user) => {
  const step = getOnboardingStep(user);
  if (step === 'complete') return '/app/dashboard';
  return ONBOARDING_PATHS[step];
};

export const isOnboardingRoute = (pathname) =>
  pathname.startsWith('/app/onboarding') ||
  pathname.startsWith('/app/wallet');
