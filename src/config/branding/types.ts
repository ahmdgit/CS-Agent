export interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export interface TypographyConfig {
  fontFamily: {
    sans: string;
    mono: string;
  };
  fontWeight: {
    regular: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

export interface AssetsConfig {
  logoUrl: string;
  faviconUrl: string;
}

/**
 * Interface Segregation Principle (ISP):
 * Clients should not be forced to depend upon interfaces that they do not use.
 * We split the theme into logical segments (Colors, Typography, Assets).
 */
export interface BrandingTheme {
  name: string;
  colors: ColorPalette;
  typography: TypographyConfig;
  assets: AssetsConfig;
}
