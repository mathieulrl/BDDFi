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

// Fetch specific market by slug using our API route (bypasses CORS)
async function fetchMarketBySlug(slug: string): Promise<PolymarketMarket | null> {
  try {
    console.log(`[Polymarket] Fetching market via API route: ${slug}`);
    
    const response = await fetch(`/api/polymarket?slug=${encodeURIComponent(slug)}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[Polymarket] Raw API response for ${slug}:`, JSON.stringify(data, null, 2).substring(0, 1000));
      
      // Handle different response formats
      let marketData = data;
      if (Array.isArray(data)) {
        if (data.length > 0) {
          marketData = data[0];
          console.log(`[Polymarket] Extracted first item from array (${data.length} items)`);
        } else {
          console.warn(`[Polymarket] Array is empty for ${slug}`);
          return null;
        }
      } else if (data.data) {
        marketData = Array.isArray(data.data) ? (data.data.length > 0 ? data.data[0] : null) : data.data;
        if (!marketData) {
          console.warn(`[Polymarket] No market data found in data field for ${slug}`);
          return null;
        }
        console.log(`[Polymarket] Extracted from data field`);
      } else if (data.markets && Array.isArray(data.markets)) {
        if (data.markets.length > 0) {
          marketData = data.markets[0];
          console.log(`[Polymarket] Extracted from markets array`);
        } else {
          console.warn(`[Polymarket] Markets array is empty for ${slug}`);
          return null;
        }
      }
      
      // Check if we have valid market data
      if (!marketData || (!marketData.id && !marketData.slug && !marketData.question)) {
        console.warn(`[Polymarket] Invalid market data for ${slug}:`, marketData);
        return null;
      }
      
      console.log(`[Polymarket] Market data before transformation (outcomes structure):`, {
        outcomes: marketData.outcomes,
        outcomesType: typeof marketData.outcomes,
        outcomesIsArray: Array.isArray(marketData.outcomes),
        outcomePrices: marketData.outcomePrices,
        outcomePricesType: typeof marketData.outcomePrices,
        outcomePricesIsArray: Array.isArray(marketData.outcomePrices),
        tokens: marketData.tokens?.length || 0,
        clobTokenIds: marketData.clobTokenIds?.length || 0,
        bestBid: marketData.bestBid,
        bestAsk: marketData.bestAsk,
      });
      const transformed = transformGammaMarket(marketData);
      console.log(`[Polymarket] Successfully transformed market ${slug}:`, transformed);
      return transformed;
    } else {
      const errorText = await response.text();
      console.log(`[Polymarket] API route returned ${response.status}: ${errorText}`);
      return null;
    }
  } catch (error) {
    console.error(`[Polymarket] Failed to fetch market ${slug}:`, error);
    return null;
  }
}

// Transform Gamma API market format to our interface
function transformGammaMarket(market: any): PolymarketMarket {
  console.log(`[Polymarket] Transforming market:`, {
    hasOutcomes: !!market.outcomes,
    hasCondition: !!market.condition,
    hasTokens: !!market.tokens,
    hasOutcomesArray: Array.isArray(market.outcomes),
    hasOutcomePrices: !!market.outcomePrices,
    hasClobTokenIds: !!market.clobTokenIds,
    marketKeys: Object.keys(market || {}).slice(0, 20),
  });
  
  // Extract outcomes and prices from various possible formats
  let outcomes: { outcome: string; price: number; volume?: number }[] = [];
  
  // Helper to parse JSON strings
  const parseJsonString = (value: any): any => {
    if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.warn(`[Polymarket] Failed to parse JSON string:`, value);
        return value;
      }
    }
    return value;
  };
  
  // Try multiple sources for outcomes
  if (market.tokens && Array.isArray(market.tokens) && market.tokens.length > 0) {
    // Polymarket Gamma API often uses tokens array with outcome and price
    outcomes = market.tokens
      .filter((token: any) => token && (token.outcome || token.title || token.name))
      .map((token: any) => {
        const price = parseFloat(token.price || token.lastPrice || token.probability || "0");
        return {
          outcome: token.outcome || token.title || token.name || token.side || String(token),
          price: isNaN(price) ? 0 : price,
          volume: parseFloat(token.volume || token.volume24h || "0") || 0,
        };
      });
    console.log(`[Polymarket] Extracted ${outcomes.length} outcomes from market.tokens`);
  } else if (market.outcomePrices) {
    // outcomePrices might be a JSON string, an object, or an array
    const parsedOutcomePrices = parseJsonString(market.outcomePrices);
    const parsedOutcomes = parseJsonString(market.outcomes);
    
    if (Array.isArray(parsedOutcomePrices) && Array.isArray(parsedOutcomes) && parsedOutcomes.length === parsedOutcomePrices.length) {
      // Both are arrays - match by index
      outcomes = parsedOutcomes.map((outcome: string, index: number) => ({
        outcome: outcome,
        price: parseFloat(String(parsedOutcomePrices[index] || "0")) || 0,
        volume: 0,
      }));
      console.log(`[Polymarket] Extracted ${outcomes.length} outcomes from arrays (outcomes + outcomePrices):`, outcomes);
    } else if (typeof parsedOutcomePrices === 'object' && !Array.isArray(parsedOutcomePrices)) {
      // outcomePrices is an object mapping outcome names to prices
      outcomes = Object.entries(parsedOutcomePrices).map(([outcome, price]: [string, any]) => ({
        outcome: outcome,
        price: parseFloat(String(price || "0")) || 0,
        volume: 0,
      }));
      console.log(`[Polymarket] Extracted ${outcomes.length} outcomes from market.outcomePrices object:`, outcomes);
    } else if (Array.isArray(parsedOutcomePrices)) {
      // outcomePrices is an array of objects or values
      if (parsedOutcomePrices.length > 0 && typeof parsedOutcomePrices[0] === 'object') {
        outcomes = parsedOutcomePrices.map((item: any, index: number) => ({
          outcome: item.outcome || item.name || item.title || `Outcome ${index + 1}`,
          price: parseFloat(String(item.price || item.probability || "0")) || 0,
          volume: parseFloat(String(item.volume || "0")) || 0,
        }));
      } else if (Array.isArray(parsedOutcomes)) {
        // Both are simple arrays
        outcomes = parsedOutcomes.map((outcome: string, index: number) => ({
          outcome: outcome,
          price: parseFloat(String(parsedOutcomePrices[index] || "0")) || 0,
          volume: 0,
        }));
      }
      console.log(`[Polymarket] Extracted ${outcomes.length} outcomes from market.outcomePrices array`);
    }
  } else if (market.outcomes && typeof market.outcomes === 'object' && !Array.isArray(market.outcomes)) {
    // outcomes might be an object mapping outcome names to data
    outcomes = Object.entries(market.outcomes).map(([outcome, data]: [string, any]) => {
      // data might be a string (price), a number, or an object
      let price = 0;
      if (typeof data === 'string' || typeof data === 'number') {
        price = parseFloat(String(data)) || 0;
      } else if (data && typeof data === 'object') {
        price = parseFloat(String(data.price || data.probability || "0")) || 0;
      }
      return {
        outcome: outcome,
        price: price,
        volume: parseFloat(String(data?.volume || "0")) || 0,
      };
    });
    console.log(`[Polymarket] Extracted ${outcomes.length} outcomes from market.outcomes object:`, outcomes);
  } else if (market.outcomes && Array.isArray(market.outcomes) && market.outcomes.length > 0) {
    outcomes = market.outcomes.map((outcome: any) => ({
      outcome: outcome.title || outcome.name || outcome.outcome || String(outcome),
      price: parseFloat(outcome.price || outcome.probability || "0") || 0,
      volume: parseFloat(outcome.volume || "0") || 0,
    }));
    console.log(`[Polymarket] Extracted ${outcomes.length} outcomes from market.outcomes array`);
  } else if (market.condition?.outcomes && Array.isArray(market.condition.outcomes)) {
    outcomes = market.condition.outcomes.map((outcome: any) => ({
      outcome: outcome.title || outcome.name || outcome.outcome || String(outcome),
      price: parseFloat(outcome.price || "0") || 0,
      volume: parseFloat(outcome.volume || "0") || 0,
    }));
    console.log(`[Polymarket] Extracted ${outcomes.length} outcomes from market.condition.outcomes`);
  } else if (market.clobTokenIds && Array.isArray(market.clobTokenIds)) {
    // If we have token IDs but no prices, we can't extract outcomes
    // But we can try to use bestBid/bestAsk if available
    console.log(`[Polymarket] Found clobTokenIds but no price data, outcomes will be empty`);
  }
  
  // Calculate probability from outcomes (usually the highest price outcome, or "Yes" outcome for binary markets)
  let probability = 0;
  if (outcomes.length > 0) {
    // For binary markets (Yes/No), prefer the "Yes" outcome price
    const yesOutcome = outcomes.find(o => o.outcome.toLowerCase().includes("yes"));
    if (yesOutcome) {
      probability = yesOutcome.price;
    } else {
      // Otherwise use the highest price
      probability = Math.max(...outcomes.map(o => o.price));
    }
  } else {
    probability = parseFloat(market.probability || "0") || 0;
  }
  
  // Convert volume and liquidity from strings to numbers
  const volume = typeof market.volume === "string" 
    ? parseFloat(market.volume) || parseFloat(market.volume24h || market.volume_24h || "0") || 0
    : (market.volume || market.volume24h || market.volume_24h || 0);
  
  const liquidity = typeof market.liquidity === "string"
    ? parseFloat(market.liquidity) || 0
    : (market.liquidity || 0);
  
  const transformed = {
    id: market.id || market.slug || market.question_id || market.conditionId || "",
    question: market.question || market.title || "",
    slug: market.slug || market.id || "",
    description: market.description || market.rules || "",
    endDate: market.endDate || market.end_date_iso || market.endDateISO || "",
    volume: volume,
    liquidity: liquidity,
    outcomes: outcomes,
    probability: probability,
  };
  
  console.log(`[Polymarket] Transformed result:`, {
    id: transformed.id,
    slug: transformed.slug,
    question: transformed.question,
    outcomesCount: transformed.outcomes.length,
    probability: transformed.probability,
    volume: transformed.volume,
    liquidity: transformed.liquidity,
  });
  
  return transformed;
}

// Fetch markets from Polymarket - fetch specific tracked markets
async function fetchPolymarketMarkets(tags?: string[]): Promise<PolymarketMarket[]> {
  // Fetch the specific markets we're tracking
  const markets: PolymarketMarket[] = [];
  
  console.log(`[Polymarket] Fetching ${TRACKED_MARKET_SLUGS.length} tracked markets`);
  
  for (const slug of TRACKED_MARKET_SLUGS) {
    try {
      console.log(`[Polymarket] Fetching market: ${slug}`);
      const market = await fetchMarketBySlug(slug);
      if (market && market.id && market.question) {
        console.log(`[Polymarket] Successfully fetched market ${slug}:`, {
          id: market.id,
          slug: market.slug,
          question: market.question,
          outcomesCount: market.outcomes?.length || 0,
        });
        markets.push(market);
      } else {
        console.warn(`[Polymarket] Market ${slug} returned invalid data, will use mock data`);
      }
    } catch (error) {
      console.error(`[Polymarket] Error fetching market ${slug}:`, error);
    }
  }
  
  // If we got all markets from API, return them
  if (markets.length === TRACKED_MARKET_SLUGS.length) {
    console.log(`[Polymarket] Successfully fetched all ${markets.length} markets from API`);
    return markets;
  }
  
  // If we got some markets, merge with mock data for missing ones
  if (markets.length > 0) {
    console.log(`[Polymarket] Fetched ${markets.length}/${TRACKED_MARKET_SLUGS.length} markets from API, filling missing with mock data`);
    const mockMarkets = getMockMarkets();
    const fetchedSlugs = new Set(markets.map(m => m.slug || m.id));
    
    // Add mock markets for missing ones
    mockMarkets.forEach(mockMarket => {
      if (!fetchedSlugs.has(mockMarket.slug) && !fetchedSlugs.has(mockMarket.id)) {
        markets.push(mockMarket);
      }
    });
    
    return markets;
  }
  
  // Otherwise, return mock data as fallback
  console.log(`[Polymarket] No markets fetched, using mock data as fallback`);
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

