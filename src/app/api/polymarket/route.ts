import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Proxy route to fetch Polymarket data (bypasses CORS)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");
    const marketId = searchParams.get("id");

    if (!slug && !marketId) {
      return NextResponse.json(
        { error: "Missing slug or id parameter" },
        { status: 400 }
      );
    }

    // Try multiple Polymarket API endpoints
    const endpoints = slug
      ? [
          `https://gamma-api.polymarket.com/markets?slug=${slug}`,
          `https://gamma-api.polymarket.com/markets/${slug}`,
        ]
      : [
          `https://gamma-api.polymarket.com/markets/${marketId}`,
          `https://clob.polymarket.com/markets/${marketId}`,
        ];

    for (const url of endpoints) {
      try {
        console.log(`[Polymarket API] Trying endpoint: ${url}`);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; BuyBorrowDie/1.0)",
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`[Polymarket API] Successfully fetched from ${url}`);
          return NextResponse.json(data);
        } else {
          console.log(`[Polymarket API] Endpoint ${url} returned ${response.status}`);
        }
      } catch (error) {
        console.log(`[Polymarket API] Endpoint ${url} failed:`, error);
        continue;
      }
    }

    return NextResponse.json(
      { error: "Could not fetch market from any endpoint" },
      { status: 404 }
    );
  } catch (error) {
    console.error("[Polymarket API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

