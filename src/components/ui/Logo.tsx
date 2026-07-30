import React from 'react';

interface LogoProps {
  className?: string;
  textClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '', textClassName = '' }) => {
  return (
    <div className={`flex items-center ${className}`.trim()}>
      <span className={`font-bold text-[var(--color-text-primary)] ${textClassName}`.trim()}>
        Safivra
      </span>
    </div>
  );
};
