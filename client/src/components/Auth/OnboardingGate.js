import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../UI/Spinner';
import { getOnboardingStep, getOnboardingPath, isOnboardingRoute } from '../../utils/onboarding';

const OnboardingGate = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const step = getOnboardingStep(user);

  if (step === 'complete') {
    return children ?? <Outlet />;
  }

  if (isOnboardingRoute(location.pathname)) {
    return children ?? <Outlet />;
  }

  return <Navigate to={getOnboardingPath(user)} replace state={{ from: location.pathname }} />;
};

export default OnboardingGate;
