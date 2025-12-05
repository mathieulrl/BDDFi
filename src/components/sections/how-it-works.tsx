"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { GlassCard } from "@/components/ui/card";
import { 
  Wallet, 
  TrendingUp, 
  Landmark, 
  CreditCard,
  CheckCircle2,
  Zap,
  RefreshCw,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Buy",
    subtitle: "Convert & Accumulate",
    description: "Convert your FIAT currencies to USDC via Circle. Set up automatic DCA into BTC & ETH. Your crypto portfolio grows steadily over time without risk.",
    icon: Wallet,
    color: "bitcoin",
    details: [
      "Fiat on-ramp via Circle",
      "Automatic DCA scheduling",
      "Multi-asset accumulation",
    ],
  },
  {
    number: "02",
    title: "Borrow",
    subtitle: "Leverage Without Selling",
    description: "Deposit your crypto as collateral on AAVE. Borrow USDC against it without triggering any taxable events. Keep your upside exposure.",
    icon: Landmark,
    color: "ethereum",
    details: [
      "Non-custodial collateral",
      "Flexible LTV ratios",
      "Real-time health factor",
    ],
  },
  {
    number: "03",
    title: "Die",
    subtitle: "Live Your Life",
    description: "Receive FIATs in exchange of your borrowed USDC for everyday expenses. Your deposited crypto keeps appreciating. Rinse and repeat. Never sell, never trigger taxes.",
    icon: CreditCard,
    color: "solana",
    details: [
      "Spend via USDC card",
      "Tax-efficient strategy",
      "Continuous compounding",
    ],
  },
];

const benefits = [
  {
    title: "Tax Optimization",
    description: "Borrowing isn't selling. No capital gains triggered.",
    icon: CheckCircle2,
  },
  {
    title: "Keep Upside",
    description: "Your crypto keeps appreciating while you have liquidity.",
    icon: TrendingUp,
  },
  {
    title: "DeFi Native",
    description: "Non-custodial, 24/7, no bank approval needed.",
    icon: Zap,
  },
  {
    title: "Compound Effect",
    description: "Reinvest borrowed funds to accelerate growth.",
    icon: RefreshCw,
  },
];

export function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="relative py-32 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <span className="text-sm font-medium text-bitcoin mb-4 block">
            HOW IT WORKS
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            The Strategy of the{" "}
            <span className="gradient-text">Ultra-Wealthy</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            What private banks offer to millionaires, BBDFi offers to everyone.
            Three simple steps to financial freedom.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <GlassCard className="relative h-full overflow-hidden group">
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                  style={{
                    background: `linear-gradient(135deg, var(--tw-gradient-from) 0%, transparent 100%)`,
                    // @ts-ignore
                    "--tw-gradient-from": step.color === "bitcoin" ? "#F7931A" : step.color === "ethereum" ? "#627EEA" : "#14F195",
                  }}
                />

                {/* Step number */}
                <div className="absolute top-6 right-6 font-display text-6xl font-bold opacity-10">
                  {step.number}
                </div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}
                    style={{
                      backgroundColor: step.color === "bitcoin" ? "rgba(247, 147, 26, 0.15)" : step.color === "ethereum" ? "rgba(98, 126, 234, 0.15)" : "rgba(20, 241, 149, 0.15)",
                    }}
                  >
                    <step.icon
                      className="w-7 h-7"
                      style={{
                        color: step.color === "bitcoin" ? "#F7931A" : step.color === "ethereum" ? "#627EEA" : "#14F195",
                      }}
                    />
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-2xl font-bold mb-1">
                    {step.title}
                  </h3>
                  <p
                    className="text-sm font-medium mb-4"
                    style={{
                      color: step.color === "bitcoin" ? "#F7931A" : step.color === "ethereum" ? "#627EEA" : "#14F195",
                    }}
                  >
                    {step.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6">
                    {step.description}
                  </p>

                  {/* Details */}
                  <ul className="space-y-2">
                    {step.details.map((detail) => (
                      <li
                        key={detail}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2
                          className="w-4 h-4 flex-shrink-0"
                          style={{
                            color: step.color === "bitcoin" ? "#F7931A" : step.color === "ethereum" ? "#627EEA" : "#14F195",
                          }}
                        />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass rounded-3xl p-8 md:p-12"
        >
          <h3 className="font-display text-2xl font-bold mb-8 text-center">
            Why Buy, Borrow, Die?
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-bitcoin" />
                </div>
                <h4 className="font-display font-semibold mb-2">
                  {benefit.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

