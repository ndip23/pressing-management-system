import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../UI/Spinner';
import { getOnboardingPath } from '../../utils/onboarding';

const OnboardingRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <Navigate to={getOnboardingPath(user)} replace />;
};

export default OnboardingRedirect;
