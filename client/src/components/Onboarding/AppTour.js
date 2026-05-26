import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import Button from '../UI/Button';
import { useAppTour } from '../../contexts/AppTourContext';

const TOUR_STEP_KEYS = [
  'welcome',
  'dashboard',
  'orders',
  'newOrder',
  'customers',
  'wallet',
  'payments',
  'inbox',
  'businessProfile',
  'settings',
  'done',
];

const AppTour = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { tourOpen, setTourOpen, closeTour } = useAppTour();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (location.state?.showTour) {
      setTourOpen(true);
      setStep(0);
    }
  }, [location.state?.showTour, setTourOpen]);

  useEffect(() => {
    if (tourOpen) {
      setStep(0);
    }
  }, [tourOpen]);

  const handleCloseTour = () => {
    closeTour();
    setStep(0);
    sessionStorage.removeItem('pressmark_show_app_tour');
  };

  const stepKey = TOUR_STEP_KEYS[step];
  const total = TOUR_STEP_KEYS.length;

  if (!tourOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div
        className="max-w-lg w-full rounded-apple-lg bg-white dark:bg-apple-gray-900 border border-apple-gray-200 dark:border-apple-gray-700 shadow-apple-2xl p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-tour-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-apple-blue font-semibold">
              {t('appTour.label')}
            </p>
            <h2 id="app-tour-title" className="mt-2 text-xl font-semibold text-apple-gray-900 dark:text-white">
              {t(`appTour.steps.${stepKey}.title`)}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCloseTour}
            className="text-apple-gray-500 hover:text-apple-gray-800 dark:text-apple-gray-400 dark:hover:text-white"
            aria-label={t('appTour.skip')}
          >
            <X size={20} />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-apple-gray-600 dark:text-apple-gray-300">
          {t(`appTour.steps.${stepKey}.description`)}
        </p>

        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
            {step + 1} / {total}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCloseTour}
            >
              {t('appTour.skip')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              {t('appTour.previous')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                if (step >= total - 1) handleCloseTour();
                else setStep((s) => s + 1);
              }}
            >
              {step >= total - 1 ? t('appTour.finish') : t('appTour.next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppTour;
