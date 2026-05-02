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
  primary: "#14B8A6",
  primaryLight: "#0F3D38",
  primaryDark: "#0D9488",
  accent: "#FB923C",
  accentLight: "#431407",
  bg: "#000000",
  surface: "#111111",
  surfaceAlt: "#1C1C1E",
  primaryText: "#F2F2F7",
  secondaryText: "#8E8E93",
  mutedText: "#636366",
  border: "#2C2C2E",
  borderStrong: "#3C3C3E",
  success: "#10B981",
  successLight: "#064E3B",
  warning: "#F59E0B",
  warningLight: "#451A03",
  error: "#F87171",
  errorLight: "#450A0A",
  info: "#60A5FA",
  infoLight: "#1E3A5F",
  employer: "#A78BFA",
  employerLight: "#2E1065",
};

// backward-compat alias used by legacy imports
export const colors = lightColors;
