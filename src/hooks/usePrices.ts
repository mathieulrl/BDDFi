"use client";

import { useState, useEffect, useCallback } from "react";

interface PriceData {
  [symbol: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

const COINGECKO_IDS: { [symbol: string]: string } = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  USDC: "usd-coin",
};

// Mock prices for development (when API is not available)
const MOCK_PRICES: PriceData = {
  bitcoin: { usd: 67500, usd_24h_change: 2.5 },
  ethereum: { usd: 3450, usd_24h_change: 1.8 },
  solana: { usd: 185, usd_24h_change: 3.2 },
  "usd-coin": { usd: 1, usd_24h_change: 0 },
};

export function usePrices() {
  const [prices, setPrices] = useState<PriceData>(MOCK_PRICES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const ids = Object.values(COINGECKO_IDS).join(",");
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch prices");
      }

      const data = await response.json();
      setPrices(data);
    } catch (err) {
      console.warn("Using mock prices due to API error:", err);
      setPrices(MOCK_PRICES);
      setError("Using cached prices");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    
    // Refresh prices every 60 seconds
    const interval = setInterval(fetchPrices, 60000);
    
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const getPrice = useCallback(
    (symbol: string): number => {
      const id = COINGECKO_IDS[symbol];
      if (!id) return 0;
      return prices[id]?.usd || 0;
    },
    [prices]
  );

  const get24hChange = useCallback(
    (symbol: string): number => {
      const id = COINGECKO_IDS[symbol];
      if (!id) return 0;
      return prices[id]?.usd_24h_change || 0;
    },
    [prices]
  );

  return {
    prices,
    isLoading,
    error,
    getPrice,
    get24hChange,
    refetch: fetchPrices,
  };
}

// Hook for a single asset price
export function useAssetPrice(symbol: string) {
  const { getPrice, get24hChange, isLoading } = usePrices();

  return {
    price: getPrice(symbol),
    change24h: get24hChange(symbol),
    isLoading,
  };
}

