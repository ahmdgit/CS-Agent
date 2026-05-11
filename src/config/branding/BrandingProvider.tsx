import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { BrandingTheme } from './types';
import { defaultTheme } from './tokens';

/**
 * Dependency Inversion Principle (DIP):
 * High-level modules (components) should not depend on low-level modules (specific themes).
 * Both should depend on abstractions (BrandingContext).
 */

interface BrandingContextType {
  theme: BrandingTheme;
}

const BrandingContext = createContext<BrandingContextType>({ theme: defaultTheme });

export const BrandingProvider: React.FC<{ children: ReactNode; theme?: BrandingTheme }> = ({ 
  children, 
  theme = defaultTheme 
}) => {
  // Single Responsibility Principle (SRP):
  // The provider is only responsible for providing the theme, and optionally injecting critical CSS variables.
  
  useEffect(() => {
    // Inject css variables to root to allow CSS/Tailwind to use them if configured
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text', theme.colors.text);

    // Inject Typography
    root.style.setProperty('--font-family-sans', theme.typography.fontFamily.sans);
    root.style.setProperty('--font-family-mono', theme.typography.fontFamily.mono);
  }, [theme]);

  return (
    <BrandingContext.Provider value={{ theme }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
