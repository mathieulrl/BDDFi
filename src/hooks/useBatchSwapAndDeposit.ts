"use client";

import { useCallback } from "react";
import { 
  useAccount, 
  useChainId, 
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, type Address, maxUint256, encodeFunctionData, getAddress } from "viem";
import { getContracts, TOKENS, ERC20_ABI, AAVE_POOL_ABI } from "@/lib/contracts";
import { useOnchainKitSwap } from "./useOnchainKitSwap";

// Multicall3 ABI
const MULTICALL3_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "target", type: "address" },
          { name: "allowFailure", type: "bool" },
          { name: "callData", type: "bytes" },
        ],
        name: "calls",
        type: "tuple[]",
      },
    ],
    name: "aggregate3",
    outputs: [
      {
        components: [
          { name: "success", type: "bool" },
          { name: "returnData", type: "bytes" },
        ],
        name: "returnData",
        type: "tuple[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export function useBatchSwapAndDeposit() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContracts(chainId);
  const { getSwapTransaction } = useOnchainKitSwap();

  const { 
    writeContract, 
    data: hash, 
    isPending,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const batchSwapAndDeposit = useCallback(
    async (
      usdcAmount: number,
      allocations: number[],
      prices: { BTC: number; ETH: number }
    ) => {
      if (!address) throw new Error("Wallet not connected");
      
      // Validate inputs
      if (usdcAmount <= 0) throw new Error("USDC amount must be greater than 0");
      if (allocations.length !== 2) throw new Error("Must provide allocations for BTC and ETH");
      const totalAllocation = allocations.reduce((a, b) => a + b, 0);
      if (Math.abs(totalAllocation - 100) > 0.01) throw new Error(`Total allocation must equal 100%, got ${totalAllocation}%`);

      // Get addresses and convert to checksum format (viem requires checksum addresses)
      // On mainnet, use cbBTC and cbETH. On testnet, use WBTC and cbETH
      const isMainnet = chainId === 8453; // Base Mainnet
      const btcAddress = isMainnet 
        ? (contracts as any).cbBTC 
        : ((contracts as any).WBTC || (contracts as any).cbBTC);
      const cbethAddress = (contracts as any).cbETH;
      
      // Convert all addresses to checksum format
      const usdcAddress = getAddress(contracts.USDC);
      const aavePoolAddress = getAddress(contracts.AAVE_POOL);
      
      const tokenMap: Record<string, { address: Address; symbol: string; name: string }> = {
        BTC: {
          address: btcAddress ? getAddress(btcAddress) : usdcAddress,
          symbol: isMainnet ? "cbBTC" : "WBTC",
          name: isMainnet ? "cbBTC" : "WBTC",
        },
        ETH: {
          address: cbethAddress ? getAddress(cbethAddress) : usdcAddress,
          symbol: "cbETH",
          name: "cbETH",
        },
      };

      const cryptoAssets = [
        { symbol: "BTC", name: isMainnet ? "cbBTC" : "WBTC" },
        { symbol: "ETH", name: "cbETH" },
      ];

      // Prepare all calls for multicall
      const calls: any[] = [];
      
      // Get swap quotes from OnchainKit API
      const swapQuotes: Array<{
        to: Address;
        data: `0x${string}`;
        value: bigint;
        tokenOut: Address;
        tokenOutSymbol: string;
        decimals: number;
        usdcAmount: bigint;
        expectedAmountOut: bigint; // Expected amount of tokens we'll receive from the swap
      }> = [];

      // Get swap transactions for each asset
      for (let index = 0; index < cryptoAssets.length; index++) {
        const asset = cryptoAssets[index];
        const allocation = allocations[index];
        if (allocation === 0) continue; // Skip if no allocation
        
        const usdcForAsset = (usdcAmount * allocation) / 100;
        const usdcForAssetWei = parseUnits(usdcForAsset.toFixed(6), TOKENS.USDC.decimals);
        
        // Validate minimum amounts - swaps need meaningful amounts
        if (usdcForAssetWei < parseUnits("0.01", TOKENS.USDC.decimals)) {
          console.warn(`Amount too small for ${asset.symbol}: ${usdcForAsset} USDC, skipping swap`);
          continue; // Skip if amount is too small
        }
        
        const tokenOut = tokenMap[asset.symbol];
        if (!tokenOut || !tokenOut.address) {
          console.warn(`Token not found for ${asset.symbol}, skipping`);
          continue;
        }
        
        // Get swap transaction from OnchainKit API
        try {
          const swapTx = await getSwapTransaction(
            address,
            usdcAddress,
            tokenOut.address,
            usdcForAssetWei,
            "USDC",
            tokenOut.symbol
          );
          
          const tokenDecimals = asset.symbol === "BTC" 
            ? (isMainnet ? TOKENS.cbBTC.decimals : (TOKENS as any).WBTC?.decimals || 8)
            : TOKENS.cbETH.decimals;
          
          // Get expected amount out from the quote
          // The quote contains toAmount which is the expected output amount
          const expectedAmountOut = swapTx.quote?.toAmount 
            ? BigInt(swapTx.quote.toAmount)
            : parseUnits(
                ((usdcForAsset / (prices[asset.symbol as keyof typeof prices] || 1)) * 0.95).toFixed(tokenDecimals), // 5% slippage estimate
                tokenDecimals
              );
          
          swapQuotes.push({
            to: swapTx.to,
            data: swapTx.data,
            value: swapTx.value,
            tokenOut: tokenOut.address,
            tokenOutSymbol: tokenOut.symbol,
            decimals: tokenDecimals,
            usdcAmount: usdcForAssetWei,
            expectedAmountOut, // Store expected amount for deposit
          });
          
          console.log(`Got OnchainKit swap quote for ${asset.symbol}:`, {
            from: usdcAddress,
            to: tokenOut.address,
            amount: usdcForAsset,
            swapRouter: swapTx.to,
          });
        } catch (error: any) {
          console.error(`Failed to get swap quote for ${asset.symbol}:`, error);
          // Continue with other swaps - this one will be skipped
          continue;
        }
      }
      
      if (swapQuotes.length === 0) {
        throw new Error("No valid swap quotes obtained. Please check token addresses and liquidity.");
      }
      
      // Get the swap router address from the first quote (should be the same for all)
      const swapRouterAddress = swapQuotes[0].to;
      
      // 1. Approve USDC for Swap Router - this must succeed
      calls.push({
        target: usdcAddress,
        allowFailure: false, // Must succeed
        callData: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [swapRouterAddress, maxUint256],
        }),
      });
      
      console.log(`Prepared USDC approve for Swap Router: ${swapRouterAddress}, amount: maxUint256`);

      // 2. Execute swaps using OnchainKit API calldata
      const tokensToDeposit: Array<{ address: Address; symbol: string; decimals: number; swapCallIndex: number; expectedAmount: bigint }> = [];
      
      swapQuotes.forEach((quote) => {
        const swapCallIndex = calls.length;
        
        // Execute swap using OnchainKit calldata
        calls.push({
          target: quote.to, // Swap router address from OnchainKit
          allowFailure: true, // Allow failure if swap route doesn't exist or liquidity is insufficient
          callData: quote.data, // Calldata from OnchainKit API
          value: quote.value, // ETH value if needed (usually 0 for token swaps)
        });
        
        console.log(`Prepared OnchainKit swap: USDC -> ${quote.tokenOutSymbol} (${quote.tokenOut})`, {
          swapRouter: quote.to,
          usdcAmount: quote.usdcAmount.toString(),
          expectedAmountOut: quote.expectedAmountOut.toString(),
          dataLength: quote.data.length,
          value: quote.value.toString(),
        });
        
        // Store token info for deposit
        tokensToDeposit.push({
          address: quote.tokenOut,
          symbol: quote.tokenOutSymbol,
          decimals: quote.decimals,
          swapCallIndex,
          expectedAmount: quote.expectedAmountOut,
        });
      });

      // 3. Approve and deposit each crypto to Aave
      // Note: We use the expected amount from the swap quote
      // If the swap fails, the deposit will also fail gracefully with allowFailure: true
      tokensToDeposit.forEach(({ address: tokenAddress, symbol, swapCallIndex, expectedAmount }) => {
        // Approve crypto for Aave - approve the expected amount (with some buffer for slippage)
        // We add 10% buffer to account for positive slippage
        const approveAmount = (expectedAmount * BigInt(110)) / BigInt(100);
        calls.push({
          target: getAddress(tokenAddress),
          allowFailure: true, // Allow failure if token doesn't exist or other error
          callData: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "approve",
            args: [aavePoolAddress, approveAmount],
          }),
        });

        // Deposit to Aave - use a conservative amount (90% of expected) to account for slippage
        // The swap might receive slightly less than expected due to slippage, so we use 90% to be safe
        // If the swap failed, we won't have tokens and this will fail gracefully with allowFailure: true
        const conservativeAmount = (expectedAmount * BigInt(90)) / BigInt(100);
        calls.push({
          target: aavePoolAddress,
          allowFailure: true, // Allow failure if we don't have tokens (swap failed)
          callData: encodeFunctionData({
            abi: AAVE_POOL_ABI,
            functionName: "supply",
            args: [getAddress(tokenAddress), conservativeAmount, getAddress(address), 0], // Use conservative amount (90% of expected)
          }),
        });
        
        console.log(`Prepared deposit for ${symbol} (${tokenAddress}), expected: ${expectedAmount.toString()}, conservative: ${conservativeAmount.toString()}, depends on swap call ${swapCallIndex}`);
      });

      // Execute all calls via Multicall3
      const multicall3Address = (contracts as any).MULTICALL3 || "0xcA11bde05977b3631167028862bE2a173976CA11";
      
      console.log(`Executing multicall with ${calls.length} calls:`, {
        chainId,
        isMainnet,
        btcAddress: tokenMap.BTC?.address,
        ethAddress: tokenMap.ETH?.address,
        multicall3: multicall3Address,
        calls: calls.map((c, i) => ({
          index: i,
          target: c.target,
          allowFailure: c.allowFailure,
          function: c.callData.slice(0, 10), // First 4 bytes = function selector
        })),
      });
      
      // Validate calls format
      if (calls.length === 0) {
        throw new Error("No calls to execute");
      }
      
      // Check that all calls have required fields
      for (let i = 0; i < calls.length; i++) {
        const call = calls[i];
        if (!call.target || !call.callData) {
          throw new Error(`Invalid call at index ${i}: missing target or callData`);
        }
        if (typeof call.allowFailure !== "boolean") {
          throw new Error(`Invalid call at index ${i}: allowFailure must be boolean`);
        }
      }
      
      try {
        await writeContract({
          address: getAddress(multicall3Address),
          abi: MULTICALL3_ABI,
          functionName: "aggregate3",
          args: [calls],
        });
      } catch (error: any) {
        console.error("Multicall error:", error);
        console.error("Error details:", {
          message: error.message,
          cause: error.cause,
          data: error.data,
        });
        throw new Error(`Transaction failed: ${error.message || "Unknown error"}`);
      }
    },
    [address, contracts, writeContract]
  );

  return { batchSwapAndDeposit, isPending, isConfirming, isSuccess, error, reset, hash };
}
