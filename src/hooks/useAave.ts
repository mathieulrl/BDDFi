"use client";

import { useCallback, useEffect, useState } from "react";
import { 
  useAccount, 
  useChainId, 
  useReadContract, 
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits, type Address } from "viem";
import { 
  getContracts, 
  AAVE_POOL_ABI, 
  AAVE_DATA_PROVIDER_ABI, 
  ERC20_ABI,
  TOKENS,
} from "@/lib/contracts";
import { useAppStore } from "@/lib/store";

// Types
export interface UserAccountData {
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  availableBorrowsBase: bigint;
  currentLiquidationThreshold: bigint;
  ltv: bigint;
  healthFactor: bigint;
}

export interface UserReserveData {
  currentATokenBalance: bigint;
  currentStableDebt: bigint;
  currentVariableDebt: bigint;
  liquidityRate: bigint;
  usageAsCollateralEnabled: boolean;
}

// Hook to get user's AAVE account data
export function useUserAccountData() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContracts(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: contracts.AAVE_POOL,
    abi: AAVE_POOL_ABI,
    functionName: "getUserAccountData",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  const formattedData = data ? {
    totalCollateralUSD: Number(formatUnits(data[0], 8)), // AAVE uses 8 decimals for USD values
    totalDebtUSD: Number(formatUnits(data[1], 8)),
    availableBorrowsUSD: Number(formatUnits(data[2], 8)),
    currentLiquidationThreshold: Number(data[3]) / 100, // Convert basis points to percentage
    ltv: Number(data[4]) / 100,
    healthFactor: Number(formatUnits(data[5], 18)),
  } : null;

  return { data: formattedData, isLoading, refetch };
}

// Hook to get user's reserve data for a specific asset
export function useUserReserveData(assetAddress: Address) {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContracts(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: contracts.AAVE_POOL_DATA_PROVIDER,
    abi: AAVE_DATA_PROVIDER_ABI,
    functionName: "getUserReserveData",
    args: address ? [assetAddress, address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 30000,
    },
  });

  return { data, isLoading, refetch };
}

// Hook to get token balance
export function useTokenBalance(tokenAddress: Address) {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 30000,
    },
  });

  return { balance: data, isLoading, refetch };
}

// Hook to supply assets to AAVE
export function useSupply() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContracts(chainId);
  const { addTransaction, updateTransactionStatus } = useAppStore();

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

  const supply = useCallback(
    async (assetAddress: Address, amount: bigint) => {
      if (!address) throw new Error("Wallet not connected");

      // Add pending transaction
      const txId = `supply-${Date.now()}`;
      addTransaction({
        id: txId,
        type: "deposit",
        amount: Number(amount),
        asset: assetAddress,
        timestamp: new Date(),
        status: "pending",
      });

      try {
        await writeContract({
          address: contracts.AAVE_POOL,
          abi: AAVE_POOL_ABI,
          functionName: "supply",
          args: [assetAddress, amount, address, 0],
        });
      } catch (err) {
        updateTransactionStatus(txId, "failed");
        throw err;
      }
    },
    [address, contracts, writeContract, addTransaction, updateTransactionStatus]
  );

  // Update transaction status when confirmed
  useEffect(() => {
    if (isSuccess && hash) {
      // Transaction confirmed
    }
  }, [isSuccess, hash]);

  return { supply, isPending, isConfirming, isSuccess, error, reset, hash };
}

// Hook to borrow from AAVE
export function useBorrow() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContracts(chainId);
  const { addTransaction, updateTransactionStatus } = useAppStore();

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

  const borrow = useCallback(
    async (assetAddress: Address, amount: bigint) => {
      if (!address) throw new Error("Wallet not connected");

      // Add pending transaction
      const txId = `borrow-${Date.now()}`;
      addTransaction({
        id: txId,
        type: "borrow",
        amount: Number(amount),
        asset: assetAddress,
        timestamp: new Date(),
        status: "pending",
      });

      try {
        // Interest rate mode: 2 = variable rate
        await writeContract({
          address: contracts.AAVE_POOL,
          abi: AAVE_POOL_ABI,
          functionName: "borrow",
          args: [assetAddress, amount, BigInt(2), 0, address],
        });
      } catch (err) {
        updateTransactionStatus(txId, "failed");
        throw err;
      }
    },
    [address, contracts, writeContract, addTransaction, updateTransactionStatus]
  );

  return { borrow, isPending, isConfirming, isSuccess, error, reset, hash };
}

// Hook to repay loan on AAVE
export function useRepay() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContracts(chainId);
  const { addTransaction, updateTransactionStatus } = useAppStore();

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

  const repay = useCallback(
    async (assetAddress: Address, amount: bigint) => {
      if (!address) throw new Error("Wallet not connected");

      // Prevent multiple simultaneous repay calls
      if (isPending) {
        throw new Error("A repay transaction is already in progress. Please wait.");
      }

      // Add pending transaction
      const txId = `repay-${Date.now()}`;
      addTransaction({
        id: txId,
        type: "repay",
        amount: Number(amount),
        asset: assetAddress,
        timestamp: new Date(),
        status: "pending",
      });

      try {
        // Interest rate mode: 2 = variable rate
        await writeContract({
          address: contracts.AAVE_POOL,
          abi: AAVE_POOL_ABI,
          functionName: "repay",
          args: [assetAddress, amount, BigInt(2), address],
        });
      } catch (err) {
        updateTransactionStatus(txId, "failed");
        throw err;
      }
    },
    [address, contracts, writeContract, addTransaction, updateTransactionStatus, isPending]
  );

  return { repay, isPending, isConfirming, isSuccess, error, reset, hash };
}

// Hook to withdraw from AAVE
export function useWithdraw() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContracts(chainId);
  const { addTransaction, updateTransactionStatus } = useAppStore();

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

  const withdraw = useCallback(
    async (assetAddress: Address, amount: bigint) => {
      if (!address) throw new Error("Wallet not connected");

      // Add pending transaction
      const txId = `withdraw-${Date.now()}`;
      addTransaction({
        id: txId,
        type: "withdraw",
        amount: Number(amount),
        asset: assetAddress,
        timestamp: new Date(),
        status: "pending",
      });

      try {
        await writeContract({
          address: contracts.AAVE_POOL,
          abi: AAVE_POOL_ABI,
          functionName: "withdraw",
          args: [assetAddress, amount, address],
        });
      } catch (err) {
        updateTransactionStatus(txId, "failed");
        throw err;
      }
    },
    [address, contracts, writeContract, addTransaction, updateTransactionStatus]
  );

  return { withdraw, isPending, isConfirming, isSuccess, error, reset, hash };
}

// Hook to approve token spending for Aave
export function useApprove() {
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

  const approve = useCallback(
    async (tokenAddress: Address, amount: bigint) => {
      await writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [contracts.AAVE_POOL, amount],
      });
    },
    [contracts, writeContract]
  );

  return { approve, isPending, isConfirming, isSuccess, error, reset, hash };
}

// Hook to approve token spending for any spender (generic)
export function useApproveToken() {
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

  const approve = useCallback(
    async (tokenAddress: Address, spenderAddress: Address, amount: bigint) => {
      await writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [spenderAddress, amount],
      });
    },
    [writeContract]
  );

  return { approve, isPending, isConfirming, isSuccess, error, reset, hash };
}

// Hook to check allowance
export function useAllowance(tokenAddress: Address) {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContracts(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, contracts.AAVE_POOL] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return { allowance: data, isLoading, refetch };
}

// Combined hook for full AAVE interaction
export function useAave() {
  const accountData = useUserAccountData();
  const supply = useSupply();
  const borrow = useBorrow();
  const repay = useRepay();
  const withdraw = useWithdraw();
  const approve = useApprove();

  return {
    accountData,
    supply,
    borrow,
    repay,
    withdraw,
    approve,
  };
}

