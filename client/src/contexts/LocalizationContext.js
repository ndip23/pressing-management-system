// client/src/contexts/LocalizationContext.js

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAppSettings } from './SettingsContext';

const LocalizationContext = createContext();

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

const PAGES_NEEDING_RATES = [ '/',
  '/directory','/pricing', '/payment', '/signup', '/demo', '/add-your-buisness'];

export const LocalizationProvider = ({ children }) => {
  const [location, setLocation] = useState({ country: 'US', currency: 'USD' });
  const [rates, setRates] = useState({ USD: 1 });
  const [loading, setLoading] = useState(false);
  const { settings, loadingSettings } = useAppSettings();
  const routeLocation = useLocation();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (loadingSettings || initializedRef.current) return;

    const needsRates = PAGES_NEEDING_RATES.some((path) =>
      routeLocation.pathname.startsWith(path)
    );
    const currencyCode = settings?.defaultCurrencyCode || 'USD';

    if (!needsRates && currencyCode === 'USD') {
      setLocation({ country: 'US', currency: 'USD' });
      setRates({ USD: 1 });
      initializedRef.current = true;
      return;
    }

    initializedRef.current = true;
    setLoading(true);

    const initializeLocalization = async () => {
      const requests = [api.get('/currency/rates')];
      if (needsRates) {
        requests.unshift(api.get('/currency/geolocate'));
      }

      const results = await Promise.allSettled(requests);
      let geoIndex = needsRates ? 0 : -1;
      const ratesIndex = needsRates ? 1 : 0;

      if (geoIndex >= 0 && results[geoIndex]?.status === 'fulfilled' && results[geoIndex].value.data) {
        setLocation(results[geoIndex].value.data);
      } else {
        setLocation({ country: 'US', currency: currencyCode });
      }

      if (results[ratesIndex]?.status === 'fulfilled') {
        setRates(results[ratesIndex].value.data);
      }
      setLoading(false);
    };

    initializeLocalization();
  }, [loadingSettings, settings?.defaultCurrencyCode, routeLocation.pathname]);

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
