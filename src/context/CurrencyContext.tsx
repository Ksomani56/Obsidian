'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface CurrencyContextType {
  currency: "USD" | "INR";
  fxRate: number;
  toggleCurrency: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [fxRate, setFxRate] = useState<number>(1.0);

  useEffect(() => {
    const savedCurrency = localStorage.getItem("currency");
    if (savedCurrency === "USD" || savedCurrency === "INR") {
      setCurrency(savedCurrency);
    }
    // Fetch USD/INR rate from our API
    fetch("/api/forex")
      .then(res => res.json())
      .then(data => {
        if (data && data.quote && data.quote.INR) {
          setFxRate(data.quote.INR);
        } else {
          setFxRate(83);
        }
      })
      .catch(() => setFxRate(83));
  }, []);

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  const toggleCurrency = () => {
    setCurrency(prev => (prev === "USD" ? "INR" : "USD"));
  };

  return (
    <CurrencyContext.Provider value={{ currency, fxRate, toggleCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within a CurrencyProvider");
  return context;
};

export function formatCurrency(value: number | null | undefined, currency: "USD" | "INR", fxRate: number): string {
  if (value === null || value === undefined || isNaN(value)) {
    return currency === "USD" ? "$0.00" : "₹0.00";
  }
  const formatted = currency === "USD"
    ? `$${value.toFixed(2)}`
    : `₹${(value * fxRate).toFixed(2)}`;
  return formatted;
}
