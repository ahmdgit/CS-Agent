# Branding Module

This module manages the application's visual identity, including colors, typography, and assets.

## SOLID Principles Applied

### 1. Single Responsibility Principle (SRP)
The branding configuration is separated into distinct parts:
- `tokens.ts` is responsible ONLY for defining the visual values (colors, fonts).
- `BrandingProvider.tsx` is responsible ONLY for distributing the theme across the React tree and injecting CSS variables.
- `types.ts` is responsible ONLY for type definitions.

### 2. Open/Closed Principle (OCP)
The system is open for extension but closed for modification. You can create a new theme (e.g., `darkTheme` or `highContrastTheme`) that implements the `BrandingTheme` interface without needing to modify the `BrandingProvider` or the application's core logic.

### 3. Liskov Substitution Principle (LSP)
Any theme object that implements the `BrandingTheme` interface can be substituted into the `BrandingProvider` without breaking the application. Components rely on the interface structure, not a specific theme instance.

### 4. Interface Segregation Principle (ISP)
Instead of a single massive `Theme` interface, the configuration is broken down into smaller, focused interfaces:
- `ColorPalette`
- `TypographyConfig`
- `AssetsConfig`

### 5. Dependency Inversion Principle (DIP)
Components do not import `defaultTheme` directly. Instead, they consume the theme via the `useBranding()` hook, depending on the abstract context rather than a concrete implementation. This allows the theme to be swapped at runtime globally.

## Usage

\`\`\`tsx
import { useBranding } from '../config/branding';

function MyComponent() {
  const { theme } = useBranding();
  return <div style={{ color: theme.colors.primary }}>Hello</div>;
}
\`\`\`
