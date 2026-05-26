// client/src/index.js
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Spinner from './components/UI/Spinner'; 
import './i18n';

import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter as Router } from 'react-router-dom'; 
import { AdminNotificationProvider } from './contexts/NotificationContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { LocalizationProvider } from './contexts/LocalizationContext';
import { Toaster } from 'react-hot-toast';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>}>
    <React.StrictMode>
      <Router>
      <AuthProvider>
        <SettingsProvider>
          <AdminNotificationProvider>
            <LocalizationProvider>
              <App />
              <Toaster position="top-right" />
            </LocalizationProvider>
          </AdminNotificationProvider>
        </SettingsProvider>
      </AuthProvider>
      </Router>
    </React.StrictMode>
  </Suspense>
);