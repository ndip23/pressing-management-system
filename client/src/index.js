// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { AdminNotificationProvider } from './contexts/NotificationContext';
import { SettingsProvider } from './contexts/SettingsContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <SettingsProvider> 
      <AdminNotificationProvider>
        <App />
      </AdminNotificationProvider>
      </SettingsProvider>
    </AuthProvider>
  </React.StrictMode>
);