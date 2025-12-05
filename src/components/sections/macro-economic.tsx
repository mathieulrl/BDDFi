"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { GlassCard } from "@/components/ui/card";
import { usePolymarketMarkets } from "@/hooks/usePolymarket";
import { TrendingUp, TrendingDown, DollarSign, Building2, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// Key macroeconomic markets that could impact BTC/ETH
const KEY_MARKETS = [
  {
    id: "how-many-fed-rate-cuts-in-2026",
    title: "Fed Rate Cuts in 2026",
    description: "Number of 25bp rate cuts by the Federal Reserve",
    icon: DollarSign,
    color: "from-yellow-500 to-orange-500",
    impact: "high" as const,
    polymarketUrl: "https://polymarket.com/event/how-many-fed-rate-cuts-in-2026",
  },
  {
    id: "us-recession-by-end-of-2026",
    title: "US Recession by End of 2026",
    description: "Probability of US recession (2 consecutive negative GDP quarters or NBER declaration)",
    icon: AlertTriangle,
    color: "from-red-500 to-pink-500",
    impact: "high" as const,
    polymarketUrl: "https://polymarket.com/event/us-recession-by-end-of-2026",
  },
];

function MarketCard({ market, data }: { market: typeof KEY_MARKETS[0]; data?: any }) {
  const Icon = market.icon;
  const probability = data?.probability || data?.outcomes?.[0]?.price || 0;
  const volume = data?.volume || 0;
  const isPositive = market.id.includes("recession") ? probability < 0.5 : probability > 0.3;

  return (
    <GlassCard className="p-6 hover:bg-white/5 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
            market.color
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg mb-1">{market.title}</h3>
            <p className="text-xs text-muted-foreground">{market.description}</p>
          </div>
        </div>
        <a
          href={market.polymarketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </a>
      </div>

      {data ? (
        <>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm font-medium text-muted-foreground">Market Probability</span>
              </div>
              <div className="text-3xl font-bold">
                {(probability * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">Volume</div>
              <div className="text-lg font-semibold">
                ${(volume / 1000).toFixed(1)}K
              </div>
            </div>
          </div>

          {data.outcomes && data.outcomes.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground mb-2">Top Outcomes:</div>
              {data.outcomes.slice(0, 3).map((outcome: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{outcome.outcome}</span>
                  <span className="font-medium">{(outcome.price * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </GlassCard>
  );
}

export function MacroEconomicSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Fetch markets - using economy tag if available, otherwise fetch specific markets
  const { data: markets, isLoading, isError } = usePolymarketMarkets(["economy", "politics", "fed"]);
  
  // Type guard to ensure markets is an array
  const marketsArray = Array.isArray(markets) ? markets : [];

  // Create a map of market data by ID for quick lookup
  const marketDataMap = new Map();
  if (marketsArray.length > 0) {
    console.log(`[MacroEconomic] Received ${marketsArray.length} markets:`, marketsArray.map(m => ({ id: m.id, slug: m.slug, question: m.question })));
    marketsArray.forEach((market) => {
      // Map by both id and slug to handle different formats
      if (market.id) marketDataMap.set(market.id, market);
      if (market.slug) marketDataMap.set(market.slug, market);
      // Also try normalized versions (with/without dashes)
      if (market.id) marketDataMap.set(market.id.replace(/-/g, "_"), market);
      if (market.slug) marketDataMap.set(market.slug.replace(/-/g, "_"), market);
    });
  }
  
  console.log(`[MacroEconomic] Market data map keys:`, Array.from(marketDataMap.keys()));
  console.log(`[MacroEconomic] Looking for markets:`, KEY_MARKETS.map(m => m.id));

  return (
    <section id="macro-economic" className="relative py-32 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-bitcoin mb-4 block">
            MACROECONOMIC OUTLOOK
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            US Economic Indicators
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time market probabilities from Polymarket that could impact BTC and ETH prices.
            Monitor Fed policy, recession risks, and key economic events.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {KEY_MARKETS.map((market, index) => {
            // Try multiple ways to find the market data
            const marketData = marketDataMap.get(market.id) 
              || marketDataMap.get(market.id.replace(/-/g, "_"))
              || marketDataMap.get(market.id.replace(/_/g, "-"))
              || marketsArray.find(m => m.id === market.id || m.slug === market.id || m.id?.includes(market.id) || m.slug?.includes(market.id));
            
            console.log(`[MacroEconomic] Market ${market.id} data:`, marketData ? "found" : "not found", marketData);
            
            return (
              <motion.div
                key={market.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <MarketCard
                  market={market}
                  data={marketData}
                />
              </motion.div>
            );
          })}
        </div>

        {/* BTC/ETH Impact Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-6 h-6 text-bitcoin" />
              <h3 className="font-display font-bold text-2xl">Crypto Market Impact</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Fed Rate Cuts → Positive for Crypto
                </h4>
                <p className="text-sm text-muted-foreground">
                  Lower interest rates typically increase liquidity and risk appetite, which historically 
                  benefits BTC and ETH. More rate cuts = higher probability of crypto price appreciation.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Recession Risk → Mixed Impact
                </h4>
                <p className="text-sm text-muted-foreground">
                  Economic recessions can drive both risk-off sentiment (negative) and increased 
                  demand for alternative assets like BTC (positive). Monitor probability trends.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {isLoading && marketsArray.length === 0 && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground mt-4">Loading market data...</p>
          </div>
        )}
        
        {isError && marketsArray.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Failed to load market data. Using fallback data.</p>
          </div>
        )}
      </div>
    </section>
  );
}

