import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type MarketplaceMode = "all" | "employer" | "student";

type MarketplaceModeContextType = {
  marketplaceMode: MarketplaceMode;
  setMarketplaceMode: (mode: MarketplaceMode) => Promise<void>;
};

const MarketplaceModeContext = createContext<
  MarketplaceModeContextType | undefined
>(undefined);

const STORAGE_KEY = "marketplace_mode";

export function MarketplaceModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [marketplaceMode, setModeState] = useState<MarketplaceMode>("all");

  useEffect(() => {
    async function init() {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === "employer" || saved === "student" || saved === "all") {
        // User has explicitly chosen a mode before — respect it
        setModeState(saved);
        return;
      }
      // First launch: default to the user_type they chose at registration
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", session.user.id)
        .single();
      const type = profile?.user_type;
      if (type === "employer" || type === "student") {
        setModeState(type);
        await AsyncStorage.setItem(STORAGE_KEY, type);
      }
    }
    init();
  }, []);

  const setMarketplaceMode = async (mode: MarketplaceMode) => {
    setModeState(mode);
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  };

  return (
    <MarketplaceModeContext.Provider
      value={{ marketplaceMode, setMarketplaceMode }}
    >
      {children}
    </MarketplaceModeContext.Provider>
  );
}

export function useMarketplaceMode() {
  const ctx = useContext(MarketplaceModeContext);
  if (!ctx) {
    throw new Error(
      "useMarketplaceMode must be used within MarketplaceModeProvider",
    );
  }
  return ctx;
}
