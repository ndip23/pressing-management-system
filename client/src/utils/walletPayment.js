import { COUNTRY_TO_CURRENCY } from './currencyMap';

export const WALLET_PAYMENT_COUNTRY_KEY = 'walletPaymentCountryCode';

export const getWalletPaymentCountryCode = (tenant) => {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem(WALLET_PAYMENT_COUNTRY_KEY);
    if (stored && COUNTRY_TO_CURRENCY[stored]) return stored;
  }
  if (tenant?.countryCode && COUNTRY_TO_CURRENCY[tenant.countryCode]) {
    return tenant.countryCode;
  }
  return null;
};

export const setWalletPaymentCountryCode = (countryCode) => {
  if (typeof window !== 'undefined' && countryCode) {
    sessionStorage.setItem(WALLET_PAYMENT_COUNTRY_KEY, countryCode.toUpperCase());
  }
};

export const getCurrencyForCountry = (countryCode) =>
  COUNTRY_TO_CURRENCY[countryCode?.toUpperCase()] || 'USD';

export const WALLET_SELECT_PATH = '/app/wallet/select-country';
