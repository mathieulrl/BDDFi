import { useQuery } from "@tanstack/react-query";

interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  description?: string;
  endDate?: string;
  volume?: number;
  liquidity?: number;
  outcomes?: {
    outcome: string;
    price: number;
    volume?: number;
  }[];
  probability?: number;
}

// Specific market slugs we want to track (from Polymarket URLs)
const TRACKED_MARKET_SLUGS = [
  "how-many-fed-rate-cuts-in-2026",
  "us-recession-by-end-of-2026",
];

// Fetch specific market by slug using Gamma API
// Documentation: https://docs.polymarket.com/gamma-endpoints/markets
async function fetchMarketBySlug(slug: string): Promise<PolymarketMarket | null> {
  // Try different endpoint formats since Polymarket API structure may vary
  const endpoints = [
    `https://gamma-api.polymarket.com/markets?slug=${slug}`,
    `https://gamma-api.polymarket.com/markets/${slug}`,
    `https://clob.polymarket.com/markets/${slug}`,
  ];
  
  for (const url of endpoints) {
    try {
      console.log(`[Polymarket] Trying endpoint: ${url}`);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle different response formats
        let marketData = data;
        if (Array.isArray(data) && data.length > 0) {
          marketData = data[0];
        } else if (data.data) {
          marketData = Array.isArray(data.data) ? data.data[0] : data.data;
        } else if (data.markets && Array.isArray(data.markets) && data.markets.length > 0) {
          marketData = data.markets[0];
        }
        
        const transformed = transformGammaMarket(marketData);
        console.log(`[Polymarket] Successfully fetched market ${slug}`);
        return transformed;
      } else {
        console.log(`[Polymarket] Endpoint ${url} returned ${response.status}`);
      }
    } catch (error) {
      console.log(`[Polymarket] Endpoint ${url} failed:`, error);
      continue;
    }
  }
  
  // If all endpoints fail, return null (will use mock data)
  console.warn(`[Polymarket] Could not fetch market ${slug} from any endpoint`);
  return null;
}

// Transform Gamma API market format to our interface
function transformGammaMarket(market: any): PolymarketMarket {
  // Extract outcomes and prices from various possible formats
  let outcomes: { outcome: string; price: number; volume?: number }[] = [];
  
  if (market.outcomes && Array.isArray(market.outcomes)) {
    outcomes = market.outcomes.map((outcome: any) => ({
      outcome: outcome.title || outcome.name || outcome.outcome || String(outcome),
      price: outcome.price || outcome.probability || 0,
      volume: outcome.volume || 0,
    }));
  } else if (market.condition?.outcomes) {
    outcomes = market.condition.outcomes.map((outcome: any) => ({
      outcome: outcome.title || outcome.name || outcome.outcome || String(outcome),
      price: outcome.price || 0,
      volume: outcome.volume || 0,
    }));
  }
  
  // Calculate probability from outcomes (usually the highest price outcome)
  const probability = outcomes.length > 0 
    ? Math.max(...outcomes.map(o => o.price))
    : market.probability || 0;
  
  return {
    id: market.id || market.slug || market.question_id || "",
    question: market.question || market.title || "",
    slug: market.slug || market.id || "",
    description: market.description || market.rules || "",
    endDate: market.endDate || market.end_date_iso || market.endDateISO || "",
    volume: market.volume || market.volume24h || market.volume_24h || 0,
    liquidity: market.liquidity || 0,
    outcomes: outcomes,
    probability: probability,
  };
}

// Fetch markets from Polymarket - fetch specific tracked markets
async function fetchPolymarketMarkets(tags?: string[]): Promise<PolymarketMarket[]> {
  // Fetch the specific markets we're tracking
  const markets: PolymarketMarket[] = [];
  
  for (const slug of TRACKED_MARKET_SLUGS) {
    try {
      const market = await fetchMarketBySlug(slug);
      if (market) {
        markets.push(market);
      }
    } catch (error) {
      console.error(`Error fetching market ${slug}:`, error);
    }
  }
  
  // If we got markets from API, return them
  if (markets.length > 0) {
    console.log(`[Polymarket] Successfully fetched ${markets.length} markets from API`);
    return markets;
  }
  
  // Otherwise, return mock data as fallback
  console.log(`[Polymarket] Using mock data as fallback`);
  return getMockMarkets();
}

// Mock data for development/fallback
function getMockMarkets(): PolymarketMarket[] {
  return [
    {
      id: "how-many-fed-rate-cuts-in-2026",
      question: "How many Fed rate cuts in 2026?",
      slug: "how-many-fed-rate-cuts-in-2026",
      description: "This market will resolve according to the exact amount of cuts of 25 basis points in 2026 by the Fed",
      endDate: "2026-12-31",
      volume: 660673,
      liquidity: 100000,
      outcomes: [
        { outcome: "3 (75 bps)", price: 0.24, volume: 44713 },
        { outcome: "4 (100 bps)", price: 0.20, volume: 43901 },
        { outcome: "2 (50 bps)", price: 0.16, volume: 54902 },
        { outcome: "5 (125 bps)", price: 0.10, volume: 63610 },
      ],
      probability: 0.24, // Most likely outcome
    },
    {
      id: "us-recession-by-end-of-2026",
      question: "US recession by end of 2026?",
      slug: "us-recession-by-end-of-2026",
      description: "This market will resolve to 'Yes' if either GDP is negative for two consecutive quarters or NBER declares a recession",
      endDate: "2027-01-31",
      volume: 57856,
      liquidity: 50000,
      outcomes: [
        { outcome: "Yes", price: 0.31, volume: 20000 },
        { outcome: "No", price: 0.69, volume: 37856 },
      ],
      probability: 0.31,
    },
  ];
}

// Fetch specific market by ID (alias for slug)
async function fetchMarketById(marketId: string): Promise<PolymarketMarket | null> {
  return fetchMarketBySlug(marketId);
}

export function usePolymarketMarkets(tags?: string[]) {
  return useQuery({
    queryKey: ["polymarket", "markets", tags],
    queryFn: () => fetchPolymarketMarkets(tags),
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  });
}

export function usePolymarketMarket(marketId: string) {
  return useQuery({
    queryKey: ["polymarket", "market", marketId],
    queryFn: () => fetchMarketById(marketId),
    enabled: !!marketId,
    staleTime: 60000,
    refetchInterval: 300000,
  });
}
