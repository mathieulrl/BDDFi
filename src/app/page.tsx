"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { HeroSection } from "@/components/sections/hero";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { MacroEconomicSection } from "@/components/sections/macro-economic";
import { TaxSimulatorSection } from "@/components/sections/tax-simulator";
import { DashboardSection } from "@/components/sections/dashboard";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-bitcoin/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-ethereum/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-background to-background" />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <Header />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <HeroSection />
        <HowItWorksSection />
        <MacroEconomicSection />
        <TaxSimulatorSection />
        <DashboardSection />
      </motion.div>

      <Footer />
    </main>
  );
}

