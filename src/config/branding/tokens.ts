import { BrandingTheme } from './types';

/**
 * Open/Closed Principle (OCP):
 * The branding system is open for extension (we can add `darkTheme`, `highContrastTheme`)
 * but closed for modification (we don't need to change the engine to support new themes).
 */
export const defaultTheme: BrandingTheme = {
  name: 'default',
  colors: {
    primary: '#4f46e5',   // primary-600
    secondary: '#10b981', // emerald-500
    background: '#f8fafc',// slate-50
    surface: '#ffffff',   // white
    text: '#0f172a',      // slate-900
    textMuted: '#64748b', // slate-500
    border: '#e2e8f0',    // slate-200
    error: '#ef4444',     // red-500
    success: '#10b981',   // emerald-500
    warning: '#f59e0b',   // amber-500
    info: '#3b82f6',      // blue-500
  },
  typography: {
    fontFamily: {
      sans: '"Inter", sans-serif',
      mono: '"JetBrains Mono", monospace',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    }
  },
  assets: {
    logoUrl: '/vite.svg',
    faviconUrl: '/vite.svg',
  }
};
