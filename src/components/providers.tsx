"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { useState, type ReactNode } from "react";

// Use testnet for development, mainnet for production
const IS_TESTNET = process.env.NEXT_PUBLIC_USE_TESTNET !== "false";
const defaultChain = IS_TESTNET ? baseSepolia : base;

// Wagmi config with Coinbase Smart Wallet
const config = createConfig({
  chains: [baseSepolia, base], // Testnet first for development
  connectors: [
    coinbaseWallet({
      appName: "BBDFi",
      preference: "smartWalletOnly", // Use Smart Wallet for gasless UX
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={defaultChain}
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
      </QueryClientProvider>
    </WagmiProvider>
  );
}
