"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { useInView } from "framer-motion";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  calculateTax, 
  getIncomeBand, 
  getIncomeRangeDisplay,
  type FilingStatus, 
  type IncomeBand, 
  type HoldingPeriod,
  type TaxCalculationResult,
} from "@/lib/tax-calculator";
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle,
  CheckCircle2,
  Info,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FILING_STATUSES: { value: FilingStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "mfj", label: "Married filing jointly" },
  { value: "mfs", label: "Married filing separately" },
  { value: "hoh", label: "Head of household" },
  { value: "qw", label: "Qualifying widow(er)" },
];

const HOLDING_PERIODS: { value: HoldingPeriod; label: string }[] = [
  { value: "short-term", label: "12 months or less (short-term)" },
  { value: "long-term", label: "More than 12 months (long-term)" },
];

function ResultCard({ result }: { result: TaxCalculationResult }) {
  const relevanceColors = {
    low: "from-green-500/20 to-green-600/20 border-green-500/30",
    medium: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30",
    high: "from-orange-500/20 to-red-500/20 border-orange-500/30",
    very_high: "from-red-500/20 to-pink-500/20 border-red-500/30",
  };

  const relevanceIcons = {
    low: CheckCircle2,
    medium: Info,
    high: TrendingUp,
    very_high: AlertCircle,
  };

  const Icon = relevanceIcons[result.lombardRelevance];

  return (
    <GlassCard className={cn(
      "p-8 border-2 bg-gradient-to-br",
      relevanceColors[result.lombardRelevance]
    )}>
      <div className="flex items-start gap-4 mb-6">
        <div className={cn(
          "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center",
          result.lombardRelevance === "low" ? "from-green-500 to-green-600" :
          result.lombardRelevance === "medium" ? "from-yellow-500 to-orange-500" :
          result.lombardRelevance === "high" ? "from-orange-500 to-red-500" :
          "from-red-500 to-pink-500"
        )}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-2xl mb-2">Tax Analysis</h3>
          <p className="text-sm text-muted-foreground">
            {result.capitalGainType === "long-term" ? "Long-term" : "Short-term"} capital gains
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white/5">
          <div className="text-xs text-muted-foreground mb-1">Federal Rate</div>
          <div className="text-2xl font-bold">
            {result.federalRateRange || `${result.federalRate}%`}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/5">
          <div className="text-xs text-muted-foreground mb-1">NIIT (3.8%)</div>
          <div className="text-2xl font-bold">
            {result.niitApplies ? `${result.niit}%` : "0%"}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white/10 mb-6">
        <div className="text-xs text-muted-foreground mb-2">Effective Federal Rate</div>
        <div className="text-3xl font-bold mb-2">
          {result.effectiveFederalRate.toFixed(1)}%
        </div>
        {result.federalRateRange && (
          <div className="text-sm text-muted-foreground">
            (Approximate: {result.federalRateRange} + {result.niit}% NIIT)
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm leading-relaxed">{result.profile}</p>
        </div>
      </div>

      {result.lombardRelevance !== "low" && (
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-bitcoin/20 to-ethereum/20 border border-bitcoin/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-bitcoin" />
            <span className="font-semibold">Lombard Solution Recommended</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Our Buy, Borrow, Die strategy can help you access liquidity while deferring capital gains taxes.
          </p>
        </div>
      )}
    </GlassCard>
  );
}

export function TaxSimulatorSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [filingStatus, setFilingStatus] = useState<FilingStatus | "">("");
  const [magi, setMagi] = useState("");
  const [holdingPeriod, setHoldingPeriod] = useState<HoldingPeriod | "">("");
  const [result, setResult] = useState<TaxCalculationResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Get income bands for current filing status
  const getIncomeBands = (): IncomeBand[] => {
    if (!filingStatus) return [];
    return [1, 2, 3, 4] as IncomeBand[];
  };

  const handleCalculate = () => {
    if (!filingStatus || !magi || !holdingPeriod) return;

    const magiNum = parseFloat(magi.replace(/[^0-9.]/g, ""));
    if (isNaN(magiNum)) return;

    const incomeBand = getIncomeBand(magiNum, filingStatus);
    const calculation = calculateTax(filingStatus, incomeBand, holdingPeriod);
    
    setResult(calculation);
    setShowResult(true);
  };

  const canCalculate = filingStatus && magi && holdingPeriod && !isNaN(parseFloat(magi.replace(/[^0-9.]/g, "")));

  return (
    <section id="tax-simulator" className="relative py-32 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-bitcoin mb-4 block">
            TAX SIMULATOR
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Calculate Your Tax Savings
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how much you could save with our Buy, Borrow, Die strategy compared to selling your BTC directly.
            Get an instant estimate based on your tax situation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <GlassCard className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-bitcoin to-ethereum flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display font-bold text-2xl">Tax Calculator</h3>
              </div>

              <div className="space-y-8">
                {/* Question 1: Filing Status */}
                <div>
                  <label className="block text-sm font-semibold mb-3">
                    Q1. What is your filing status for your U.S. federal tax return?
                  </label>
                  <div className="space-y-2">
                    {FILING_STATUSES.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => {
                          setFilingStatus(status.value);
                          setMagi(""); // Reset MAGI when status changes
                          setResult(null);
                          setShowResult(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl border-2 transition-all",
                          filingStatus === status.value
                            ? "border-bitcoin bg-bitcoin/10"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        )}
                      >
                        <span className="font-medium">{status.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question 2: MAGI */}
                {filingStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-semibold mb-3">
                      Q2. What is your approximate total modified adjusted gross income (MAGI) for 2025, including the BTC sale if you sold now?
                    </label>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={magi}
                        onChange={(e) => {
                          setMagi(e.target.value);
                          setResult(null);
                          setShowResult(false);
                        }}
                        placeholder="Enter your MAGI (e.g., $150,000)"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-bitcoin focus:outline-none"
                      />
                      <div className="text-xs text-muted-foreground">
                        Income bands for {FILING_STATUSES.find(s => s.value === filingStatus)?.label}:
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {getIncomeBands().map((band) => (
                          <div key={band} className="p-2 rounded-lg bg-white/5">
                            {band}️⃣ {getIncomeRangeDisplay(filingStatus, band)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Question 3: Holding Period */}
                {filingStatus && magi && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-semibold mb-3">
                      Q3. How long have you held the BTC that you would otherwise sell?
                    </label>
                    <div className="space-y-2">
                      {HOLDING_PERIODS.map((period) => (
                        <button
                          key={period.value}
                          onClick={() => {
                            setHoldingPeriod(period.value);
                            setResult(null);
                            setShowResult(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-xl border-2 transition-all",
                            holdingPeriod === period.value
                              ? "border-bitcoin bg-bitcoin/10"
                              : "border-white/10 bg-white/5 hover:border-white/20"
                          )}
                        >
                          <span className="font-medium">{period.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Calculate Button */}
                {canCalculate && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Button
                      onClick={handleCalculate}
                      variant="gradient"
                      size="lg"
                      className="w-full"
                    >
                      Calculate Tax Impact
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {showResult && result ? (
              <ResultCard result={result} />
            ) : (
              <GlassCard className="p-8 h-full flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                  <Calculator className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    Fill out the form to see your tax calculation and savings potential.
                  </p>
                </div>
              </GlassCard>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

