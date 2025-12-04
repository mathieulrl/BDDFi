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
  { label: "Total Value Locked", value: "$1.2B+", icon: Shield },
  { label: "Users", value: "50K+", icon: Sparkles },
  { label: "APY Range", value: "2-8%", icon: TrendingUp },
];

const cryptoLogos = [
  { name: "BTC", color: "#F7931A", symbol: "₿" },
  { name: "ETH", color: "#627EEA", symbol: "Ξ" },
];

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-6">
      {/* Floating crypto icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {cryptoLogos.map((crypto, i) => (
          <motion.div
            key={crypto.name}
            className="absolute"
            style={{
              left: `${20 + i * 30}%`,
              top: `${30 + i * 15}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold opacity-20"
              style={{ backgroundColor: crypto.color }}
            >
              {crypto.symbol}
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

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-muted-foreground"
          >
            <span className="text-xs">Scroll to explore</span>
            <ArrowDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
