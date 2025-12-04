"use client";

import { Button } from "./button";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { useCoinbaseOnramp } from "@/hooks/useCoinbaseOnramp";
import { useAccount } from "wagmi";

export function CoinbaseOnrampButton() {
  const { openOnramp, isLoading, isConfigured, isSandbox } = useCoinbaseOnramp();
  const { isConnected } = useAccount();

  if (!isConfigured) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-full"
      >
        <ArrowDownLeft className="w-4 h-4 mr-2" />
        Onramp (API Key Required)
      </Button>
    );
  }

  return (
    <Button
      variant="gradient"
      onClick={openOnramp}
      disabled={!isConnected || isLoading}
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <ArrowDownLeft className="w-4 h-4 mr-2" />
          Buy USDC with Fiat {isSandbox && "(Sandbox)"}
        </>
      )}
    </Button>
  );
}

export function CoinbaseOfframpButton() {
  const { openOfframp, isLoading, isConfigured, isSandbox } = useCoinbaseOnramp();
  const { isConnected } = useAccount();

  if (!isConfigured) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-full"
      >
        <ArrowUpRight className="w-4 h-4 mr-2" />
        Offramp (API Key Required)
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={openOfframp}
      disabled={!isConnected || isLoading}
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <ArrowUpRight className="w-4 h-4 mr-2" />
          Sell USDC to Fiat {isSandbox && "(Sandbox)"}
        </>
      )}
    </Button>
  );
}

