"use client";

import { useCallback } from "react";
import { buildSwapTransaction } from "@coinbase/onchainkit/api";
import { setOnchainKitConfig } from "@coinbase/onchainkit";
import type { Token } from "@coinbase/onchainkit/token";
import { useChainId } from "wagmi";
import { getContracts, TOKENS } from "@/lib/contracts";
import type { Address } from "viem";

// Configure OnchainKit API key once
if (typeof window !== "undefined") {
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;
  if (apiKey) {
    setOnchainKitConfig({ apiKey });
    console.log("OnchainKit API key configured:", apiKey.substring(0, 10) + "...");
  } else {
    console.warn("NEXT_PUBLIC_ONCHAINKIT_API_KEY is not set. Swaps may not work.");
  }
}

export function useOnchainKitSwap() {
  const chainId = useChainId();
  const contracts = getContracts(chainId);
  const isMainnet = chainId === 8453; // Base Mainnet

  const getSwapTransaction = useCallback(
    async (
      fromAddress: Address,
      tokenIn: Address,
      tokenOut: Address,
      amountIn: bigint,
      tokenInSymbol: string,
      tokenOutSymbol: string
    ) => {
      // Get token decimals
      const tokenInDecimals = tokenInSymbol === "USDC" 
        ? TOKENS.USDC.decimals 
        : tokenInSymbol === "BTC" || tokenInSymbol === "cbBTC"
        ? (isMainnet ? TOKENS.cbBTC.decimals : (TOKENS as any).WBTC?.decimals || 8)
        : TOKENS.cbETH.decimals;
      
      const tokenOutDecimals = tokenOutSymbol === "USDC" 
        ? TOKENS.USDC.decimals 
        : tokenOutSymbol === "BTC" || tokenOutSymbol === "cbBTC"
        ? (isMainnet ? TOKENS.cbBTC.decimals : (TOKENS as any).WBTC?.decimals || 8)
        : TOKENS.cbETH.decimals;

      // Convert amount to decimal string
      const amountInDecimal = Number(amountIn) / Math.pow(10, tokenInDecimals);
      const amountString = amountInDecimal.toFixed(tokenInDecimals);

      // Create Token objects for OnchainKit
      // Base Mainnet = 8453, Base Sepolia = 84532
      const chainIdForToken = chainId === 8453 ? 8453 : 84532;
      
      const fromToken: Token = {
        name: tokenInSymbol,
        address: tokenIn === "0x0000000000000000000000000000000000000000" ? "" : tokenIn,
        symbol: tokenInSymbol,
        decimals: tokenInDecimals,
        chainId: chainIdForToken,
        image: "", // Optional
      };

      const toToken: Token = {
        name: tokenOutSymbol,
        address: tokenOut,
        symbol: tokenOutSymbol,
        decimals: tokenOutDecimals,
        chainId: chainIdForToken,
        image: "", // Optional
      };

      try {
        console.log(`Requesting swap quote from OnchainKit:`, {
          fromAddress,
          tokenIn: { address: tokenIn, symbol: tokenInSymbol, decimals: tokenInDecimals },
          tokenOut: { address: tokenOut, symbol: tokenOutSymbol, decimals: tokenOutDecimals },
          amount: amountString,
          chainId: chainIdForToken,
        });

        const response = await buildSwapTransaction({
          fromAddress,
          from: fromToken,
          to: toToken,
          amount: amountString,
          useAggregator: true, // Use aggregator for best routes
        });

        // Check if response is an error
        if ('error' in response || 'message' in response) {
          const errorMessage = (response as any).error?.message || (response as any).message || "Swap transaction build failed";
          console.error(`OnchainKit API error:`, response);
          throw new Error(errorMessage);
        }

        // Type guard: response should have transaction property
        if (!('transaction' in response) || !response.transaction) {
          const errorMessage = (response as any).warning?.message || (response as any).warning?.description || "No transaction returned from buildSwapTransaction";
          console.error(`No transaction in response:`, response);
          throw new Error(errorMessage);
        }

        console.log(`OnchainKit API response:`, {
          hasTransaction: !!response.transaction,
          hasApproveTransaction: !!response.approveTransaction,
          hasQuote: !!response.quote,
          hasWarning: !!response.warning,
        });

        return {
          to: response.transaction.to as Address,
          data: response.transaction.data as `0x${string}`,
          value: BigInt(response.transaction.value || 0),
          gas: response.transaction.gas,
          approveTransaction: response.approveTransaction,
          quote: response.quote,
          warning: response.warning,
        };
      } catch (error: any) {
        console.error(`Failed to get swap transaction for ${tokenInSymbol} -> ${tokenOutSymbol}:`, {
          error,
          message: error.message,
          stack: error.stack,
          tokenIn: { address: tokenIn, symbol: tokenInSymbol },
          tokenOut: { address: tokenOut, symbol: tokenOutSymbol },
          amount: amountString,
        });
        throw new Error(`Swap quote failed: ${error.message || "Unknown error"}`);
      }
    },
    [chainId, contracts, isMainnet]
  );

  return { getSwapTransaction };
}

