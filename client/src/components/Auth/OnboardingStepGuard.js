import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../UI/Spinner';
import { getOnboardingStep, getOnboardingPath } from '../../utils/onboarding';

const OnboardingStepGuard = ({ requiredStep, allowWhenComplete = false, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentStep = getOnboardingStep(user);

  if (currentStep === 'complete') {
    if (allowWhenComplete) {
      return children;
    }
    return <Navigate to="/app/dashboard" replace />;
  }

  if (currentStep !== requiredStep) {
    return <Navigate to={getOnboardingPath(user)} replace />;
  }

  return children;
};

export default OnboardingStepGuard;
