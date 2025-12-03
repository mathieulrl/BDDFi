"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  ConnectWallet, 
  Wallet, 
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Address,
  Avatar,
  Name,
  Identity,
} from "@coinbase/onchainkit/identity";
import { useAccount, useChainId } from "wagmi";
import { Zap, Menu, X, AlertTriangle, Loader2 } from "lucide-react";

const navLinks = [
  { name: "How it works", href: "#how-it-works" },
  { name: "Dashboard", href: "#dashboard" },
  { name: "Docs", href: "#docs" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  
  // Prevent hydration mismatch - only render wallet UI after mount
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isTestnet = chainId === 84532;
  const networkName = chainId === 84532 ? "Base Sepolia" : chainId === 8453 ? "Base" : "Unknown";

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Testnet Banner - only render on client after mount */}
      {mounted && isConnected && isTestnet && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm text-yellow-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Testnet Mode - {networkName}</span>
            <a 
              href="https://www.alchemy.com/faucets/base-sepolia" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-yellow-300"
            >
              Get test ETH
            </a>
          </div>
        </div>
      )}
      
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-strong mx-4 mt-4 rounded-2xl"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.a
              href="/"
              className="flex items-center gap-3 group"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-bitcoin to-ethereum rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-gradient-to-br from-bitcoin via-ethereum to-solana p-2.5 rounded-xl">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <span className="font-display font-bold text-xl tracking-tight">
                  BBD<span className="text-bitcoin">Fi</span>
                </span>
                <span className="hidden sm:block text-[10px] text-muted-foreground -mt-1">
                  Buy · Borrow · Die
                </span>
              </div>
            </motion.a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-bitcoin to-ethereum group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </div>

            {/* Wallet Connection - Only render after client mount */}
            <div className="flex items-center gap-3">
              {!mounted ? (
                // Loading placeholder to prevent layout shift
                <div className="h-10 w-32 rounded-xl bg-white/5 animate-pulse flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Network Badge */}
                  {isConnected && (
                    <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                      isTestnet 
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isTestnet ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isTestnet ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                      </span>
                      {networkName}
                    </div>
                  )}
                  
                  <Wallet>
                    <ConnectWallet>
                      <Avatar className="h-6 w-6" />
                      <Name />
                    </ConnectWallet>
                    <WalletDropdown>
                      <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                        <Avatar />
                        <Name />
                        <Address />
                      </Identity>
                      <WalletDropdownDisconnect />
                    </WalletDropdown>
                  </Wallet>
                </>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <motion.div
            initial={false}
            animate={{ height: mobileMenuOpen ? "auto" : 0 }}
            className="md:hidden overflow-hidden"
          >
            <div className="py-4 border-t border-white/10 mt-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.nav>
    </header>
  );
}
