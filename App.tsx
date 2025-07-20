// PressFlowMobile/App.tsx
import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// You can remove the AdminNotificationProvider for now if you haven't built its context yet
// import { AdminNotificationProvider } from './src/contexts/NotificationContext';

// We can define the component type for clarity, though it's often inferred.
const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/*
          When you build the notification context, you will wrap AppNavigator with it:
          <AdminNotificationProvider>
            <AppNavigator />
          </AdminNotificationProvider>
        */}
        <StatusBar barStyle="dark-content" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;