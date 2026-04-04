import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import i18n from "../i18n";

type Language = "en" | "ro";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Load saved language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem("app_language");
        if (saved === "en" || saved === "ro") {
          setLanguageState(saved);
          (i18n as any).locale = saved;
        }
      } catch (e) {
        console.log("Error loading language preference:", e);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      (i18n as any).locale = lang;
      setLanguageState(lang);
      await AsyncStorage.setItem("app_language", lang);
    } catch (e) {
      console.log("Error saving language preference:", e);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

export function useTranslation() {
  return (key: string): string => {
    return (i18n as any).t(key);
  };
}
