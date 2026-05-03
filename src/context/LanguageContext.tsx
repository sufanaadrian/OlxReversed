import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  const [language, setLanguageState] = useState<Language>("ro");

  i18n.locale = language;

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

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      i18n.locale = lang;
      setLanguageState(lang);
      await AsyncStorage.setItem("app_language", lang);
    } catch (e) {
      console.log("Error saving language preference:", e);
    }
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
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
  const { language } = useLanguage();

  return useMemo(() => {
    i18n.locale = language;
    return (key: string): string => i18n.t(key);
  }, [language]);
}
