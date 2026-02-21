import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";
import th from "@/locales/th.json";

const LANGUAGE_KEY = "@app_language";

const resources = {
  en: { translation: en },
  th: { translation: th },
};

const supportedLanguages = Object.keys(resources);

/**
 * Get the device locale code (e.g. "en", "th").
 * Falls back to "en" if the device locale is not supported.
 */
const getDeviceLanguage = (): string => {
  const locales = Localization.getLocales();
  const deviceLang = locales?.[0]?.languageCode ?? "en";
  return supportedLanguages.includes(deviceLang) ? deviceLang : "en";
};

/**
 * Load the saved language from AsyncStorage, or fall back to device locale.
 */
const getInitialLanguage = async (): Promise<string> => {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLang && supportedLanguages.includes(savedLang)) {
      return savedLang;
    }
  } catch {
    // Ignore storage errors
  }
  return getDeviceLanguage();
};

/**
 * Change the current language and persist it to storage.
 */
export const changeLanguage = async (lang: string): Promise<void> => {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch {
    // Ignore storage errors
  }
};

// Initialize i18next synchronously with device language, then update from storage
i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: "v4",
});

// Hydrate saved preference (async) after init
getInitialLanguage().then((lang) => {
  if (lang !== i18n.language) {
    i18n.changeLanguage(lang);
  }
});

export default i18n;