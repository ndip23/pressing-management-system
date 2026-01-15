// client/src/context/LocalizationContext.js

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import api from '../services/api'; // Your centralized axios instance

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

  useEffect(() => {
    const initializeLocalization = async () => {
      let detectedLocation = { country: 'US', currency: 'USD' }; // Safe default

      try {
        // 1. Fetch user's location FROM OUR OWN BACKEND PROXY
        const locationRes = await api.get('/currency/geolocate');
        if (locationRes.data) {
          detectedLocation = locationRes.data;
        }
      } catch (error) {
        console.warn(
          'Geolocation via backend failed, defaulting to USD.',
          error.message,
        );
      } finally {
        setLocation(detectedLocation);
      }

      try {
        // 2. Fetch conversion rates FROM OUR OWN BACKEND
        // The '/api' prefix is removed because our 'api' instance already has it.
        const ratesRes = await api.get('/currency/rates');
        setRates(ratesRes.data);
      } catch (rateError) {
        console.error('Failed to fetch currency rates.', rateError.message);
      } finally {
        setLoading(false);
      }
    };

    initializeLocalization();
  }, []);

  const convertPrice = useCallback(
    usdPrice => {
      if (loading || typeof usdPrice !== 'number') {
        return `...`;
      }

      const targetCurrency = location?.currency || 'USD';
      const rate = rates?.[targetCurrency];

      if (rate) {
        const converted = usdPrice * rate;
        const symbol = currencySymbols[targetCurrency] || targetCurrency;

        if (['XAF', 'XOF'].includes(targetCurrency)) {
          return `${Math.round(converted).toLocaleString('fr-FR')} ${symbol}`;
        }
        return `${converted.toFixed(2)} ${symbol}`;
      }

      return `${usdPrice.toFixed(2)} ${currencySymbols['USD']}`;
    },
    [loading, location, rates],
  );

  const value = { location, loading, convertPrice };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => useContext(LocalizationContext);
