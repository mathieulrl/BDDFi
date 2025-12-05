"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  ConnectWallet, 
  Wallet,
} from "@coinbase/onchainkit/wallet";
import { useAccount } from "wagmi";
import { ArrowDown, Sparkles, Shield, TrendingUp, Coins, Loader2 } from "lucide-react";

const stats = [
  { label: "Tax Savings Potential", value: "Up to 24%", icon: TrendingUp },
  { label: "Supported Assets", value: "BTC • ETH", icon: Coins },
  { label: "Max Borrowing Power", value: "80% LTV", icon: Shield },
];

// Ethereum Logo SVG Component
function EthereumLogo({ className = "w-8 h-8", color = "#627EEA" }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M11.944 17.97L4.58 13.62L11.943 24L19.308 13.62L11.944 17.97ZM11.944 0L4.58 12.22L11.944 16.5L19.308 12.22L11.944 0Z"
        fill={color}
      />
    </svg>
  );
}

// Bitcoin Logo Component - Using Unicode symbol for reliability
function BitcoinLogo({ className = "w-8 h-8", color = "#F7931A" }: { className?: string; color?: string }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center ${className}`}
      style={{ backgroundColor: color }}
    >
      <span className="text-white text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>
        ₿
      </span>
    </div>
  );
}

const cryptoLogos = [
  { name: "BTC", color: "#F7931A", component: BitcoinLogo },
  { name: "ETH", color: "#627EEA", component: EthereumLogo },
];

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const { isConnected } = useAccount();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide scroll indicator when user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-32 px-6">
      {/* Floating crypto icons - Better positioned and more visible */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {cryptoLogos.map((crypto, i) => (
          <motion.div
            key={crypto.name}
            className="absolute"
            style={{
              left: `${15 + i * 35}%`,
              top: `${20 + i * 20}%`,
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 5 + i * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div
              className="w-24 h-24 md:w-32 md:h-32 rounded-3xl flex items-center justify-center backdrop-blur-sm border-2"
              style={{ 
                backgroundColor: `${crypto.color}20`,
                borderColor: `${crypto.color}40`,
                boxShadow: `0 8px 32px ${crypto.color}30`,
              }}
            >
              <div
                className="rounded-2xl p-3 md:p-4 flex items-center justify-center"
                style={{ backgroundColor: `${crypto.color}30` }}
              >
                <crypto.component 
                  className="w-12 h-12 md:w-16 md:h-16" 
                  color={crypto.color}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-sm text-muted-foreground">
            Built on <span className="text-bitcoin font-medium">Base</span> • Powered by{" "}
            <span className="text-usdc font-medium">USDC</span>
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
        >
          <span className="gradient-text">Buy.</span>{" "}
          <span className="gradient-text-blue">Borrow.</span>{" "}
          <span className="text-ethereum">Die.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
        >
          The wealth strategy of billionaires, now accessible to everyone.
          <br className="hidden md:block" />
          <span className="text-foreground">Deposit crypto, borrow USDC, never sell.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          {!mounted ? (
            // Loading placeholder
            <div className="h-16 w-48 rounded-2xl bg-white/5 animate-pulse flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : isConnected ? (
            <Button size="xl" variant="gradient" className="group" asChild>
              <a href="#dashboard">
                <Coins className="w-5 h-5" />
                Start Investing
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </a>
            </Button>
          ) : (
            <Wallet>
              <ConnectWallet 
                className="!bg-gradient-to-r !from-bitcoin !to-ethereum hover:!opacity-90 !rounded-2xl !px-12 !h-16 !text-lg !font-semibold !text-white !shadow-xl !shadow-bitcoin/25"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Connect Wallet
              </ConnectWallet>
            </Wallet>
          )}
          <Button size="xl" variant="outline" asChild>
            <a href="#how-it-works">
              Learn More
              <ArrowDown className="w-4 h-4" />
            </a>
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              className="glass rounded-2xl p-4 md:p-6"
            >
              <stat.icon className="w-5 h-5 text-muted-foreground mb-2 mx-auto" />
              <div className="font-display font-bold text-xl md:text-2xl">{stat.value}</div>
              <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll indicator - Only visible at top of page, positioned lower */}
        {showScrollIndicator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1 }}
            className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-20 w-full"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-2 text-muted-foreground"
            >
              <span className="text-xs font-medium">Scroll to explore</span>
              <ArrowDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
