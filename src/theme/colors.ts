// StudentJobs Romania — design tokens

export type Colors = {
  isDark: boolean;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  primaryText: string;
  secondaryText: string;
  mutedText: string;
  border: string;
  borderStrong: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  employer: string;
  employerLight: string;
};

export const lightColors: Colors = {
  isDark: false,
  primary: "#0D9488",
  primaryLight: "#CCFBF1",
  primaryDark: "#0F766E",
  accent: "#F97316",
  accentLight: "#FFEDD5",
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",
  primaryText: "#0F172A",
  secondaryText: "#64748B",
  mutedText: "#94A3B8",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  info: "#3B82F6",
  infoLight: "#DBEAFE",
  employer: "#7C3AED",
  employerLight: "#EDE9FE",
};

export const darkColors: Colors = {
  isDark: true,
  primary: "#2DD4BF",
  primaryLight: "#134040",
  primaryDark: "#14B8A6",
  accent: "#FB923C",
  accentLight: "#4A1A05",
  bg: "#141414",
  surface: "#1F1F1F",
  surfaceAlt: "#2A2A2A",
  primaryText: "#F0F0F0",
  secondaryText: "#A0A0A0",
  mutedText: "#6B6B6B",
  border: "#333333",
  borderStrong: "#444444",
  success: "#34D399",
  successLight: "#0D3D2E",
  warning: "#FBBF24",
  warningLight: "#3D2600",
  error: "#F87171",
  errorLight: "#3D0A0A",
  info: "#60A5FA",
  infoLight: "#1A3055",
  employer: "#C084FC",
  employerLight: "#3B1460",
};

// backward-compat alias used by legacy imports
export const colors = lightColors;
