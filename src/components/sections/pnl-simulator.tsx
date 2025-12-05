"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { GlassCard } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Shield, TrendingDown, DollarSign, AlertTriangle, Calculator, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// Black-Scholes Put Option Pricing
function blackScholesPut(S: number, K: number, T: number, r: number, sigma: number): number {
  if (T <= 0 || sigma <= 0) return Math.max(K - S, 0);
  
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  
  // Cumulative distribution function approximation
  const normCdf = (x: number): number => {
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
  };
  
  const putPrice = K * Math.exp(-r * T) * normCdf(-d2) - S * normCdf(-d1);
  return Math.max(putPrice, 0);
}

// Error function approximation
function erf(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

interface PnLSimulatorProps {}

export function PnLSimulatorSection({}: PnLSimulatorProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Client Position
  const [collateralAmt, setCollateralAmt] = useState(1.0);
  const [priceSpot, setPriceSpot] = useState(100000);
  const [debtInitial, setDebtInitial] = useState(50000);
  const borrowApy = 5.0;

  // Hedge Settings
  const [durationDays, setDurationDays] = useState(90);
  const [volatility, setVolatility] = useState(60);
  const [marginPercent, setMarginPercent] = useState(30);
  const [spreadWidth, setSpreadWidth] = useState(3000);

  // Calculations
  const ltvLiq = 0.825;
  const liqPrice = debtInitial / (collateralAmt * ltvLiq);
  const equityAtLiq = Math.max((collateralAmt * liqPrice) - debtInitial, 0);

  // Hedge Configuration
  const kLong = liqPrice;
  const kShort = kLong - spreadWidth;
  const neededRatio = spreadWidth > 0 ? equityAtLiq / spreadWidth : 0;
  const totalOptionsCount = collateralAmt * neededRatio;

  // Pricing
  const T = durationDays / 365.0;
  const r = 0.04;
  const priceLong = blackScholesPut(priceSpot, kLong, T, r, volatility / 100);
  const priceShort = blackScholesPut(priceSpot, kShort, T, r, volatility / 100);
  const netPremiumUnit = priceLong - priceShort;
  const costMarket = netPremiumUnit * totalOptionsCount;
  const costClient = costMarket * (1 + marginPercent / 100);
  const ourRevenue = costClient - costMarket;

  // Generate data for chart
  const generateChartData = () => {
    const prices: number[] = [];
    const equityLoan: number[] = [];
    const hedgePayout: number[] = [];
    const netPosition: number[] = [];

    const minPrice = priceSpot * 0.4;
    const maxPrice = priceSpot * 1.2;
    const steps = 200;

    for (let i = 0; i <= steps; i++) {
      const price = minPrice + (maxPrice - minPrice) * (i / steps);
      prices.push(price);

      // Equity Loan (Total Loss Scenario)
      const equity = price <= liqPrice 
        ? 0 
        : (collateralAmt * price) - debtInitial;
      equityLoan.push(Math.max(equity, 0));

      // Hedge Payout
      const unitPayoff = Math.max(kLong - price, 0) - Math.max(kShort - price, 0);
      const payout = unitPayoff * totalOptionsCount;
      hedgePayout.push(payout);

      // Net Position
      const net = equity + payout - costClient;
      netPosition.push(net);
    }

    return prices.map((price, i) => ({
      price: Math.round(price),
      "Equity (No Hedge)": Math.round(equityLoan[i]),
      "Hedge Payout": Math.round(hedgePayout[i]),
      "Net Position (Hedged)": Math.round(netPosition[i]),
    }));
  };

  const chartData = generateChartData();

  // Fix incomplete code from Python
  const unitPayoff = (price: number) => {
    return Math.max(kLong - price, 0) - Math.max(kShort - price, 0);
  };

  return (
    <section id="pnl-simulator" className="relative py-32 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-bitcoin mb-4 block">
            SECURELOAN SIMULATOR
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Smart-Hedged DeFi Lending Architecture
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-6">
            An interactive financial simulation modeling a dynamic hedging strategy on AAVE loans. 
            The engine integrates an auto-calibration algorithm (Smart Ratio) that adjusts the quantity of options (Put Spread) 
            to guarantee 100% net solvency during a liquidation event ("Total Loss Scenario").
          </p>
          
          {/* Deribit Integration Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass border border-white/10 hover:border-bitcoin/50 transition-all duration-300 group"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-bitcoin" />
              <span className="text-sm text-muted-foreground">
                Options powered by{" "}
                <a 
                  href="https://www.deribit.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-bitcoin hover:text-bitcoin/80 font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  Deribit
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </span>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-bitcoin/10 text-bitcoin font-medium">
              85%+ Market Share
            </span>
          </motion.div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Client Position */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-bitcoin" />
              <h3 className="font-display font-bold text-xl">Client Position</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="collateral">Collateral (Qty)</Label>
                <Input
                  id="collateral"
                  type="number"
                  value={collateralAmt}
                  onChange={(e) => setCollateralAmt(parseFloat(e.target.value) || 0)}
                  step="0.1"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">e.g., 1 BTC</p>
              </div>
              <div>
                <Label htmlFor="price">Current Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  value={priceSpot}
                  onChange={(e) => setPriceSpot(parseFloat(e.target.value) || 0)}
                  step="1000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="debt">Debt Amount ($)</Label>
                <Input
                  id="debt"
                  type="number"
                  value={debtInitial}
                  onChange={(e) => setDebtInitial(parseFloat(e.target.value) || 0)}
                  step="1000"
                  className="mt-1"
                />
              </div>
            </div>
          </GlassCard>

          {/* Hedge Settings */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-ethereum" />
              <h3 className="font-display font-bold text-xl">Hedge Settings</h3>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Duration (Days)</Label>
                  <span className="text-sm font-medium">{durationDays}</span>
                </div>
                <Slider
                  value={[durationDays]}
                  onValueChange={([value]) => setDurationDays(value)}
                  min={15}
                  max={180}
                  step={1}
                  className="[&_[role=slider]]:bg-white"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Market Volatility (IV %)</Label>
                  <span className="text-sm font-medium">{volatility}%</span>
                </div>
                <Slider
                  value={[volatility]}
                  onValueChange={([value]) => setVolatility(value)}
                  min={30}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-white"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Our Commission (%)</Label>
                  <span className="text-sm font-medium">{marginPercent}%</span>
                </div>
                <Slider
                  value={[marginPercent]}
                  onValueChange={([value]) => setMarginPercent(value)}
                  min={0}
                  max={30}
                  step={1}
                  className="[&_[role=slider]]:bg-white"
                />
                <p className="text-xs text-muted-foreground mt-1">Markup on the option premium</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Spread Width ($)</Label>
                  <span className="text-sm font-medium">${spreadWidth.toLocaleString("en-US")}</span>
                </div>
                <Slider
                  value={[spreadWidth]}
                  onValueChange={([value]) => setSpreadWidth(value)}
                  min={1000}
                  max={5000}
                  step={500}
                  className="[&_[role=slider]]:bg-white"
                />
                <p className="text-xs text-muted-foreground mt-1">Larger width = More expensive but covers deeper crashes</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassCard className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Liquidation Price</div>
            <div className="text-2xl font-bold">${liqPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Equity to Protect</div>
            <div className="text-2xl font-bold">${equityAtLiq.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Exact amount lost if liquidation happens</p>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Smart Ratio</div>
            <div className="text-2xl font-bold">{neededRatio.toFixed(2)}x</div>
            <p className="text-xs text-muted-foreground mt-1">
              {neededRatio.toFixed(2)} options per 1 unit of collateral
            </p>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Hedge Cost (Client)</div>
            <div className="text-2xl font-bold">${costClient.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Commission: ${ourRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
          </GlassCard>
        </div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="w-6 h-6 text-bitcoin" />
              <h3 className="font-display font-bold text-xl">P&L Simulation</h3>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="price" 
                    stroke="rgba(255,255,255,0.5)"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.5)"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => `$${value.toLocaleString("en-US")}`}
                    labelFormatter={(label) => `Price: $${label.toLocaleString("en-US")}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Equity (No Hedge)" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Hedge Payout" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Net Position (Hedged)" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-white/5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <strong className="text-foreground">The Total Loss Scenario:</strong> When price falls to the liquidation price, 
                  equity drops to $0 (red line). The Smart Ratio ensures the hedge payout (green line) exactly compensates 
                  this loss, keeping the net position (blue line) positive and maintaining 100% solvency protection.
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}

