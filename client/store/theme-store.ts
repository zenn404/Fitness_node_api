import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export type AppTheme = "dark" | "light";

const THEME_KEY = "@app_theme";

interface ThemeState {
  theme: AppTheme;
  isLoaded: boolean;
  loadTheme: () => Promise<void>;
  setTheme: (theme: AppTheme) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "dark",
  isLoaded: false,

  loadTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored === "dark" || stored === "light") {
        set({ theme: stored, isLoaded: true });
        return;
      }
    } catch {
      // ignore storage errors
    }
    set({ isLoaded: true });
  },

  setTheme: async (theme) => {
    set({ theme });
    try {
      await AsyncStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore storage errors
    }
  },
}));

