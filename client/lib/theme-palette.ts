import { AppTheme } from "@/store/theme-store";

export type AppPalette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  warning: string;
  danger: string;
  dangerSoft: string;
  info: string;
  success: string;
  icon: string;
  inputBg: string;
};

const darkPalette: AppPalette = {
  background: "#050709",
  surface: "#0f1419",
  surfaceAlt: "#171d26",
  border: "#273244",
  text: "#f3f6fb",
  textMuted: "#c0cad8",
  textSubtle: "#8e9ab0",
  accent: "#9be15d",
  accentSoft: "rgba(155,225,93,0.18)",
  accentText: "#0d1a0e",
  warning: "#f59e0b",
  danger: "#f87171",
  dangerSoft: "rgba(239,68,68,0.2)",
  info: "#60a5fa",
  success: "#34d399",
  icon: "#a8b3c6",
  inputBg: "#0f1419",
};

const lightPalette: AppPalette = {
  background: "#f4f7fb",
  surface: "#ffffff",
  surfaceAlt: "#eef2f7",
  border: "#d5deea",
  text: "#0f172a",
  textMuted: "#334155",
  textSubtle: "#64748b",
  accent: "#3f7d20",
  accentSoft: "rgba(63,125,32,0.14)",
  accentText: "#ffffff",
  warning: "#d97706",
  danger: "#dc2626",
  dangerSoft: "rgba(220,38,38,0.12)",
  info: "#2563eb",
  success: "#059669",
  icon: "#5b6678",
  inputBg: "#ffffff",
};

export const getThemePalette = (theme: AppTheme): AppPalette =>
  theme === "dark" ? darkPalette : lightPalette;
