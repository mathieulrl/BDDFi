"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, useChainId } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { useState, type ReactNode } from "react";

// Use testnet for development, mainnet for production
const IS_TESTNET = process.env.NEXT_PUBLIC_USE_TESTNET !== "false";
const defaultChain = IS_TESTNET ? baseSepolia : base;

// RPC URLs - use environment variables or public RPCs as fallback
// Base Mainnet: https://mainnet.base.org (public) or use Alchemy/Infura for better reliability
// Base Sepolia: https://sepolia.base.org (public) or use Alchemy/Infura
const BASE_MAINNET_RPC = process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org";
const BASE_SEPOLIA_RPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

console.log("RPC Configuration:", {
  mainnet: BASE_MAINNET_RPC,
  sepolia: BASE_SEPOLIA_RPC,
  defaultChain: defaultChain.name,
  isTestnet: IS_TESTNET,
});

// Wagmi config with Coinbase Smart Wallet
const config = createConfig({
  chains: [base, baseSepolia], // Mainnet first, then testnet
  connectors: [
    coinbaseWallet({
      appName: "BBDFi",
      preference: "smartWalletOnly", // Use Smart Wallet for gasless UX
    }),
  ],
  transports: {
    [base.id]: http(BASE_MAINNET_RPC), // Base Mainnet RPC
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC), // Base Sepolia RPC
  },
});

// Inner component that uses the current chainId from wagmi
function OnchainKitProviderWrapper({ children }: { children: ReactNode }) {
  const chainId = useChainId();
  // Use the current chainId from wallet, or default to mainnet if not connected
  const currentChain = chainId === baseSepolia.id ? baseSepolia : base;
  
  console.log("OnchainKitProvider chain:", {
    chainId,
    chainName: currentChain.name,
    isMainnet: chainId === base.id,
  });

  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={currentChain}
      config={{
        appearance: {
          name: "BBDFi",
          logo: "https://avatars.githubusercontent.com/u/108554348",
          mode: "dark",
          theme: "cyberpunk",
        },
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProviderWrapper>
          {children}
        </OnchainKitProviderWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
