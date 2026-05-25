import React, { createContext, useCallback, useContext, useState } from 'react';

const AppTourContext = createContext(null);

export const AppTourProvider = ({ children }) => {
  const [tourOpen, setTourOpen] = useState(false);

  const startTour = useCallback(() => {
    setTourOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setTourOpen(false);
  }, []);

  return (
    <AppTourContext.Provider value={{ tourOpen, setTourOpen, startTour, closeTour }}>
      {children}
    </AppTourContext.Provider>
  );
};

const noopTourApi = {
  tourOpen: false,
  setTourOpen: () => {},
  startTour: () => {},
  closeTour: () => {},
};

export const useAppTour = () => {
  const context = useContext(AppTourContext);
  return {
    ...(context ?? noopTourApi),
    isAvailable: !!context,
  };
};
