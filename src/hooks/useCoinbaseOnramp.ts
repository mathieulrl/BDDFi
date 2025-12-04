"use client";

import { useCallback, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

// Coinbase Onramp configuration
const getConfig = () => {
  if (typeof window === "undefined") {
    // SSR: return defaults
    return {
      apiKey: "",
      isSandbox: true,
      baseUrl: "https://pay-sandbox.coinbase.com",
    };
  }
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || "";
  const isSandbox = process.env.NEXT_PUBLIC_COINBASE_ONRAMP_ENV !== "PRODUCTION";
  return {
    apiKey,
    isSandbox,
    baseUrl: isSandbox ? "https://pay-sandbox.coinbase.com" : "https://pay.coinbase.com",
  };
};

interface SessionTokenResponse {
  sessionToken: string;
  expiresAt?: string;
}

export function useCoinbaseOnramp() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(false);
  
  const config = getConfig();
  
  // Determine network for Coinbase
  const network = chainId === baseSepolia.id ? "base-sepolia" : "base";
  const networkName = chainId === baseSepolia.id ? "Base Sepolia" : "Base";

  // Generate session token for Onramp
  const generateSessionToken = useCallback(async (isOfframp: boolean = false): Promise<string | null> => {
    if (!address || !config.apiKey) {
      console.error("Missing address or API key");
      return null;
    }

    try {
      setIsLoading(true);
      
      // Call our Next.js API route to avoid CORS issues
      // The API route will call Coinbase's API server-side
      const response = await fetch("/api/coinbase-onramp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          network,
          isOfframp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to generate session token:", errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate session token`);
      }

      const data: SessionTokenResponse = await response.json();
      console.log("Session token generated successfully");
      return data.sessionToken;
    } catch (error) {
      console.error("Error generating session token:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Failed to generate session token"}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, network, config]);

  const openOnramp = useCallback(async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!config.apiKey) {
      alert("Coinbase API key not configured. Please set NEXT_PUBLIC_ONCHAINKIT_API_KEY");
      return;
    }

    const sessionToken = await generateSessionToken(false);
    if (!sessionToken) {
      return;
    }

    // Build Onramp URL with parameters
    // Documentation: https://docs.cdp.coinbase.com/onramp-&-offramp/integration/sandbox-testing
    // Sandbox URL: https://pay-sandbox.coinbase.com/?sessionToken=<token>
    // Production URL: https://pay.coinbase.com/buy/select-asset?sessionToken=<token>
    const baseUrl = config.isSandbox 
      ? "https://pay-sandbox.coinbase.com"
      : "https://pay.coinbase.com/buy/select-asset";
    
    const params = new URLSearchParams({
      sessionToken: sessionToken,
      assets: "USDC",
      defaultNetwork: network,
      defaultAsset: "USDC",
    });

    const onrampUrl = `${baseUrl}?${params.toString()}`;
    
    // Open in new window or redirect
    if (typeof window !== "undefined") {
      window.open(onrampUrl, "_blank", "width=500,height=700,scrollbars=yes,resizable=yes");
    }
  }, [address, network, generateSessionToken]);

  const openOfframp = useCallback(async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!config.apiKey) {
      alert("Coinbase API key not configured. Please set NEXT_PUBLIC_ONCHAINKIT_API_KEY");
      return;
    }

    const sessionToken = await generateSessionToken(true);
    if (!sessionToken) {
      return;
    }

    // Build Offramp URL with parameters
    // Documentation: https://docs.cdp.coinbase.com/onramp-&-offramp/integration/sandbox-testing
    const baseUrl = config.isSandbox 
      ? "https://pay-sandbox.coinbase.com"
      : "https://pay.coinbase.com/buy/select-asset";
    
    const params = new URLSearchParams({
      sessionToken: sessionToken,
      assets: "USDC",
      defaultNetwork: network,
      defaultAsset: "USDC",
      defaultExperience: "sell", // For offramp
    });

    const offrampUrl = `${baseUrl}?${params.toString()}`;
    
    // Open in new window or redirect
    if (typeof window !== "undefined") {
      window.open(offrampUrl, "_blank", "width=500,height=700,scrollbars=yes,resizable=yes");
    }
  }, [address, network, generateSessionToken]);

  return {
    openOnramp,
    openOfframp,
    isLoading,
    networkName,
    isConfigured: !!config.apiKey,
    isSandbox: config.isSandbox,
  };
}

