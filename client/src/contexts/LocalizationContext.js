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
import axios from 'axios'; // Import axios for browser-level geolocation lookup
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

const PAGES_NEEDING_RATES = [ '/', '/directory', '/pricing', '/payment', '/signup', '/demo', '/add-your-buisness'];

export const LocalizationProvider = ({ children }) => {
  // 🛡️ Change the initial fallback to CM (Cameroon) and XAF
  const [location, setLocation] = useState({ country: 'CM', currency: 'XAF' });
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
    const currencyCode = settings?.defaultCurrencyCode || 'XAF'; // Safe default currency fallback

    if (!needsRates && currencyCode === 'USD') {
      setLocation({ country: 'US', currency: 'USD' });
      setRates({ USD: 1 });
      initializedRef.current = true;
      return;
    }

    initializedRef.current = true;
    setLoading(true);

    const initializeLocalization = async () => {
      // Rates are still loaded from your backend API
      const requests = [api.get('/currency/rates')];
      
      const results = await Promise.allSettled(requests);
      const ratesIndex = 0;

      // 🗺️ Robust Browser-Level Geolocation Fetch (Bypasses backend crashes)
      if (needsRates) {
        try {
          // Cloudflare trace is secure, fast, bypassed by ad-blockers, and works on live domains
          const traceRes = await axios.get('https://cloudflare.com/cdn-cgi/trace');
          const traceData = traceRes.data;
          
          const locLine = traceData.split('\n').find(line => line.startsWith('loc='));
          const detectedCountry = locLine ? locLine.split('=')[1] : null;

          if (detectedCountry && detectedCountry !== 'XX') {
            const currencyMap = {
              CM: 'XAF',
              CI: 'XOF',
              SN: 'XOF',
              NG: 'NGN',
              KE: 'KES',
              GH: 'GHS',
              US: 'USD',
            };
            const matchedCurrency = currencyMap[detectedCountry] || 'USD';
            
            setLocation({ country: detectedCountry, currency: matchedCurrency });
          } else {
            throw new Error('Could not parse country code');
          }
        } catch (geoError) {
          console.error('Browser geolocation lookup failed, falling back to CM:', geoError.message);
          // 🛡️ Fallback to Cameroon 'CM' if lookup fails
          setLocation({ country: 'CM', currency: 'XAF' });
        }
      } else {
        setLocation({ country: 'CM', currency: currencyCode });
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