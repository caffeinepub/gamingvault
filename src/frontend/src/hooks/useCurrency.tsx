import { createContext, useContext, useEffect, useState } from "react";

export type Currency = "GBP" | "USD" | "EUR";

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
};

// Exchange rates from USD base
const RATES: Record<Currency, number> = {
  USD: 1.0,
  GBP: 0.79,
  EUR: 0.92,
};

const STORAGE_KEY = "hfst_currency";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (cents: bigint) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "GBP" || stored === "USD" || stored === "EUR") return stored;
    return "USD";
  });

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  };

  const formatPrice = (cents: bigint): string => {
    const usd = Number(cents) / 100;
    const converted = usd * RATES[currency];
    return `${CURRENCY_SYMBOLS[currency]}${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
