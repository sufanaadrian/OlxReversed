import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Currency = "ron" | "eur";

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (c: Currency) => Promise<void>;
  formatPrice: (amount: number) => string;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("ron");

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem("app_currency");
        if (saved === "ron" || saved === "eur") {
          setCurrencyState(saved);
        }
      } catch (e) {
        console.log("Error loading currency preference:", e);
      }
    };
    load();
  }, []);

  const setCurrency = async (c: Currency) => {
    try {
      setCurrencyState(c);
      await AsyncStorage.setItem("app_currency", c);
    } catch (e) {
      console.log("Error saving currency preference:", e);
    }
  };

  // 1 EUR ≈ 5 RON (fixed display rate)
  const RON_TO_EUR = 5;

  const formatPrice = (amount: number): string => {
    const n = Number(amount);
    if (currency === "eur") {
      const eur = Math.round(n / RON_TO_EUR);
      return `€${eur.toLocaleString()}`;
    }
    return `${n.toLocaleString()} lei`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
