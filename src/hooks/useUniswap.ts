"use client";

import { useCallback } from "react";
import { 
  useAccount, 
  useChainId, 
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, type Address } from "viem";
import { getContracts } from "@/lib/contracts";

// Uniswap V3 SwapRouter02 ABI (simplified for exactInputSingle)
const UNISWAP_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
] as const;

// Hook to swap tokens via Uniswap V3
export function useUniswapSwap() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContracts(chainId);

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

  const swap = useCallback(
    async (
      tokenIn: Address,
      tokenOut: Address,
      amountIn: bigint,
      amountOutMinimum: bigint = BigInt(0), // Slippage protection
      fee: number = 3000 // 0.3% fee tier (common for USDC/ETH pairs)
    ) => {
      if (!address) throw new Error("Wallet not connected");
      const uniswapRouter = (contracts as any).UNISWAP_ROUTER;
      if (!uniswapRouter) throw new Error("Uniswap router not configured");

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes

      await writeContract({
        address: uniswapRouter,
        abi: UNISWAP_ROUTER_ABI,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn,
            tokenOut,
            fee,
            recipient: address,
            deadline,
            amountIn,
            amountOutMinimum,
            sqrtPriceLimitX96: BigInt(0), // No price limit
          },
        ],
      });
    },
    [address, contracts, writeContract]
  );

  return { swap, isPending, isConfirming, isSuccess, error, reset, hash };
}

