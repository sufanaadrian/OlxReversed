import type { ReactNode } from "react";
import React, { createContext } from "react";

// Minimal context kept for future expansion
type AppContextType = Record<string, never>;

export const AppContext = createContext<AppContextType>({});

export function AppProvider({ children }: { children: ReactNode }) {
  return <AppContext.Provider value={{}}>{children}</AppContext.Provider>;
}
