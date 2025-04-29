// lib/context/AppContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface AppContextState {
  isLoading: boolean;
  error: string | null;
  result: any;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setResult: (result: any) => void;
}

const AppContext = createContext<AppContextState | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  return (
    <AppContext.Provider
      value={{
        isLoading,
        error,
        result,
        setIsLoading,
        setError,
        setResult,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}
