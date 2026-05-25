// client/src/context/LocalizationContext.js

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import api from '../services/api'; // Your centralized axios instance
import { useAppSettings } from './SettingsContext';

const LocalizationContext = createContext();

// Expanded currency symbols map
const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  XAF: 'FCFA',
  XOF: 'CFA',
  NGN: '₦',
  GHS: 'GH₵',
  KES: 'KSh',
  ZAR: 'R',
  ZWL: 'Z$',
};

export const LocalizationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const { settings, loadingSettings } = useAppSettings();

  useEffect(() => {
    const initializeLocalization = async () => {
      let detectedLocation = { country: 'US', currency: 'USD' };

      const [locationResult, ratesResult] = await Promise.allSettled([
        api.get('/currency/geolocate'),
        api.get('/currency/rates'),
      ]);

      if (locationResult.status === 'fulfilled' && locationResult.value.data) {
        detectedLocation = locationResult.value.data;
      } else if (locationResult.status === 'rejected') {
        console.warn('Geolocation via backend failed, defaulting to USD.');
      }
      setLocation(detectedLocation);

      if (ratesResult.status === 'fulfilled') {
        setRates(ratesResult.value.data);
      } else {
        console.error('Failed to fetch currency rates.');
      }
      setLoading(false);
    };

    initializeLocalization();
  }, []);

  const convertPrice = useCallback(
    usdPrice => {
      if (loading || loadingSettings || typeof usdPrice !== 'number') {
        return `...`;
      }

      const targetCurrency = settings?.defaultCurrencyCode || location?.currency || 'USD';
      const rate = rates?.[targetCurrency];
      const symbol = currencySymbols[targetCurrency] || targetCurrency;

      if (rate) {
        const converted = usdPrice * rate;

        if (['XAF', 'XOF'].includes(targetCurrency)) {
          return `${Math.round(converted).toLocaleString('fr-FR')} ${symbol}`;
        }
        return `${converted.toFixed(2)} ${symbol}`;
      }

      return `${usdPrice.toFixed(2)} ${symbol}`;
    },
    [loading, loadingSettings, location, rates, settings],
  );

  const selectedCurrency = settings?.defaultCurrencyCode || location?.currency || 'USD';
  const currencySymbol = currencySymbols[selectedCurrency] || selectedCurrency;

  const value = { location, loading, convertPrice, selectedCurrency, currencySymbol };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => useContext(LocalizationContext);
