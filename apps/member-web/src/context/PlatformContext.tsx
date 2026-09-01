import React, { createContext, useContext, useState, useEffect } from 'react';
import { SafivraPlatformAdapter, getPlatform, initializePlatform } from '@/platform';

const PlatformContext = createContext<SafivraPlatformAdapter | null>(null);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adapter, setAdapter] = useState<SafivraPlatformAdapter>(() => getPlatform());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializePlatform().then((initAdapter) => {
      setAdapter(initAdapter);
      setInitialized(true);
    });
  }, []);

  if (!initialized) {
    // Return baseline platform object so it works during initial SSR / sync render
    return (
      <PlatformContext.Provider value={adapter}>
        {children}
      </PlatformContext.Provider>
    );
  }

  return (
    <PlatformContext.Provider value={adapter}>
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = (): SafivraPlatformAdapter => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used inside a PlatformProvider');
  }
  return context;
};
