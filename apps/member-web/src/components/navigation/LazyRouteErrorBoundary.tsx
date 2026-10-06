import React from 'react';
import { useRouteError } from 'react-router-dom';

export const LazyRouteErrorBoundary: React.FC = () => {
  const error = useRouteError() as Error;
  
  if (error?.name === 'ChunkLoadError' || error?.message?.includes('Failed to fetch dynamically imported module')) {
    window.location.reload();
    return null;
  }
  
  return (
    <div className="p-4 bg-red-100 text-red-700 m-4 rounded-xl">
      <strong>Route Error:</strong> {error?.message || 'Unknown error'}
    </div>
  );
};
