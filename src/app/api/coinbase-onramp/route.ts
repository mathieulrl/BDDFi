import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

// Map network names to blockchain names for Coinbase API
const networkToBlockchain: Record<string, string> = {
  "base": "base",
  "base-sepolia": "base",
  "ethereum": "ethereum",
  "optimism": "optimism",
  "polygon": "polygon",
  "arbitrum": "arbitrum",
};

/**
 * Import private key from various formats
 * Coinbase CDP supports multiple key formats:
 * - PEM format with -----BEGIN EC PRIVATE KEY-----
 * - PEM format with -----BEGIN PRIVATE KEY----- (PKCS8)
 * - Base64 encoded string
 */
async function importPrivateKey(apiKeySecret: string): Promise<CryptoKey> {
  // Log original length for debugging (but don't log the actual key for security)
  const originalLength = apiKeySecret.length;
  console.log(`[DEBUG] Original key length: ${originalLength} characters`);
  
  // Try to parse as JSON first (if downloaded from CDP Portal as JSON file)
  let keyString = apiKeySecret.trim();
  try {
    const jsonKey = JSON.parse(keyString);
    console.log(`[DEBUG] Detected JSON format, extracting privateKey field`);
    if (jsonKey.privateKey) {
      keyString = jsonKey.privateKey;
    } else if (jsonKey.key) {
      keyString = jsonKey.key;
    } else if (jsonKey.secret) {
      keyString = jsonKey.secret;
    } else {
      // Try to find any field that looks like a base64 key
      for (const [key, value] of Object.entries(jsonKey)) {
        if (typeof value === 'string' && value.length > 50 && value.length < 500) {
          if (/^[A-Za-z0-9+/=]+$/.test(value.replace(/\s/g, ''))) {
            console.log(`[DEBUG] Found potential key in field: ${key}`);
            keyString = value;
            break;
          }
        }
      }
    }
  } catch {
    // Not JSON, continue with original string
    console.log(`[DEBUG] Not JSON format, treating as raw string`);
  }

  // Normalize and clean whitespace more aggressively
  // Remove ALL whitespace, newlines, tabs, etc.
  keyString = keyString.replace(/[\s\n\r\t]/g, "").trim();
  
  console.log(`[DEBUG] After cleaning, key length: ${keyString.length} characters`);
  
  // If the key is very long, it might contain newlines or extra characters
  // A valid base64 key for ECDSA P-256 PKCS8 should be around 120-200 characters
  if (keyString.length > 500) {
    // Try to extract base64 pattern from the string
    const base64Match = keyString.match(/[A-Za-z0-9+/]{80,}={0,2}/);
    if (base64Match && base64Match[0].length <= 500) {
      console.log(`[DEBUG] Extracted base64 pattern, length: ${base64Match[0].length}`);
      keyString = base64Match[0];
    } else {
      throw new Error(
        `Key appears too long (${keyString.length} characters after cleaning). ` +
        `A valid ECDSA P-256 private key in base64 should be around 120-200 characters. ` +
        `Please ensure your COINBASE_CDP_API_KEY_SECRET contains only the base64 key value. ` +
        `If you downloaded a JSON file from CDP Portal, extract only the 'privateKey' field value (without quotes or JSON structure).`
      );
    }
  }

  let pemKey: string;
  const isECKey = keyString.includes("-----BEGINECPRIVATEKEY-----") || 
                  keyString.toLowerCase().includes("begin ec private key");

  // Check if it's already in PEM format (even without proper spacing)
  if (keyString.includes("-----BEGIN") || keyString.includes("BEGIN")) {
    // Already in PEM format, but might have spacing issues
    // Extract just the base64 part
    const base64Match = keyString.match(/-----BEGIN[^-]+-----\s*([A-Za-z0-9+/=]+)\s*-----END[^-]+-----/);
    if (base64Match && base64Match[1]) {
      keyString = base64Match[1].replace(/\s/g, "");
    } else {
      // Try to extract base64 between BEGIN and END markers
      const beginIndex = keyString.indexOf("BEGIN");
      const endIndex = keyString.indexOf("END");
      if (beginIndex !== -1 && endIndex !== -1 && endIndex > beginIndex) {
        keyString = keyString.substring(beginIndex, endIndex)
          .replace(/-----BEGIN[^-]+-----/g, "")
          .replace(/\s/g, "");
      }
    }
  }

  // Now keyString should be just base64, wrap in PEM headers as PKCS8
  const cleanKey = keyString.replace(/[^A-Za-z0-9+/=]/g, ""); // Remove any non-base64 characters
  
  // Validate base64 format
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanKey)) {
    throw new Error(
      `Invalid base64 format. Key contains invalid characters. ` +
      `Please ensure your COINBASE_CDP_API_KEY_SECRET is a valid base64 string or PEM format.`
    );
  }

  // Check reasonable length for ECDSA P-256 key
  // PKCS8 format for ECDSA P-256 should be around 120-200 base64 characters
  if (cleanKey.length < 80 || cleanKey.length > 500) {
    throw new Error(
      `Key length (${cleanKey.length} characters) seems incorrect for ECDSA P-256. ` +
      `Expected around 120-200 characters for PKCS8 format. ` +
      `Please verify you're using the correct private key from CDP Portal.`
    );
  }

  pemKey = `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;

  // Extract base64 content from PEM (should be the same as cleanKey now)
  const base64Key = cleanKey;

  // Convert base64 to ArrayBuffer
  let keyData: ArrayBuffer;
  try {
    const decoded = Buffer.from(base64Key, "base64");
    console.log(`[DEBUG] Decoded key length: ${decoded.length} bytes`);
    
    // Validate decoded length
    // Ed25519 PKCS8 format is typically 48-80 bytes
    // Ed25519 raw key is 32 bytes (64 bytes in base64)
    // ECDSA P-256 PKCS8 format is around 120-150 bytes
    console.log(`[DEBUG] Key length after decoding: ${decoded.length} bytes`);
    
    // If it's exactly 32 bytes, it's likely a raw Ed25519 key
    // CDP Portal should provide PKCS8 format (48-80 bytes for Ed25519)
    if (decoded.length === 32) {
      throw new Error(
        `Detected 32-byte key (raw Ed25519 private key). ` +
        `Coinbase CDP requires keys in PKCS8 format. ` +
        `Please ensure you're using the complete private key from CDP Portal. ` +
        `If you downloaded a JSON file, use the full 'privateKey' field value (should be longer, ~48-80 bytes when decoded). ` +
        `The key should start with base64 characters and be longer than 64 characters in base64.`
      );
    }
    
    // Allow keys from 48 bytes (Ed25519 PKCS8 minimum) to 500 bytes (various PKCS8 formats)
    if (decoded.length < 48 || decoded.length > 500) {
      throw new Error(
        `Decoded key length (${decoded.length} bytes) is unexpected. ` +
        `Expected between 48-500 bytes for PKCS8 format. ` +
        `Ed25519 PKCS8: ~48-80 bytes, ECDSA P-256 PKCS8: ~120-150 bytes. ` +
        `Please verify you're using the complete private key from CDP Portal (not just the raw 32-byte key).`
      );
    }
    
    // Convert Buffer to ArrayBuffer properly
    // Buffer.buffer might not point to the actual data, use slice() instead
    keyData = decoded.buffer.slice(decoded.byteOffset, decoded.byteOffset + decoded.byteLength);
    console.log(`[DEBUG] ArrayBuffer length: ${keyData.byteLength} bytes`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Detected 64-byte key")) {
      throw error; // Re-throw our custom error
    }
    throw new Error(`Invalid base64 key format: ${error instanceof Error ? error.message : "Unknown"}`);
  }

  // Try to import as Ed25519 private key (EdDSA)
  // Note: crypto.subtle supports Ed25519 via "raw" format for the private key
  // Ed25519 private key is 32 bytes
  const keyLength = keyData.byteLength;
  console.log(`[DEBUG] Attempting to import Ed25519 key, ArrayBuffer size: ${keyLength} bytes`);
  
  try {
    // For Ed25519, crypto.subtle requires PKCS8 format, not raw
    // Even if the key is 32 bytes, we need to wrap it in PKCS8 structure
    // However, if it's already 32 bytes, it might be the raw key that needs conversion
    // Let's try PKCS8 first (most common format from CDP Portal)
    console.log(`[DEBUG] Attempting to import as Ed25519 PKCS8 format (${keyLength} bytes)`);
    try {
      return await crypto.subtle.importKey(
        "pkcs8",
        keyData,
        {
          name: "Ed25519",
        },
        false,
        ["sign"]
      );
    } catch (pkcs8Error) {
      // If PKCS8 fails and key is 32 bytes, it's likely a raw key
      // crypto.subtle doesn't support raw Ed25519 import in Node.js
      // We need to construct PKCS8 structure or use a library
      if (keyLength === 32) {
        throw new Error(
          `Detected 32-byte raw Ed25519 key, but crypto.subtle requires PKCS8 format. ` +
          `Please ensure your COINBASE_CDP_API_KEY_SECRET is the complete PKCS8-encoded key from CDP Portal, ` +
          `not just the raw 32-byte private key. ` +
          `If you downloaded a JSON file, use the full 'privateKey' field value. ` +
          `PKCS8 error: ${pkcs8Error instanceof Error ? pkcs8Error.message : "Unknown"}`
        );
      }
      throw pkcs8Error;
    }
  } catch (importError) {
    console.log(`[DEBUG] Ed25519 import failed: ${importError instanceof Error ? importError.message : "Unknown error"}`);
    
    // If Ed25519 fails, try ECDSA P-256 as fallback (in case it's actually ECDSA)
    if (keyLength > 100) {
      console.log(`[DEBUG] Trying ECDSA P-256 as fallback`);
      try {
        return await crypto.subtle.importKey(
          "pkcs8",
          keyData,
          {
            name: "ECDSA",
            namedCurve: "P-256",
          },
          false,
          ["sign"]
        );
      } catch (ecdsaError) {
        // Both failed
        throw new Error(
          `Failed to import key as Ed25519 or ECDSA P-256. ` +
          `Key length: ${keyLength} bytes. ` +
          `Ed25519 error: ${importError instanceof Error ? importError.message : "Unknown"}. ` +
          `ECDSA error: ${ecdsaError instanceof Error ? ecdsaError.message : "Unknown"}. ` +
          `Please verify you're using the correct private key from CDP Portal.`
        );
      }
    }
    
    throw new Error(
      `Failed to import Ed25519 key. ` +
      `Key length: ${keyLength} bytes. ` +
      `Please ensure your COINBASE_CDP_API_KEY_SECRET is the correct Ed25519 private key. ` +
      `Error: ${importError instanceof Error ? importError.message : "Unknown"}`
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, network, isOfframp } = body;

    // Get API key ID and secret from environment
    // For CDP, you need both:
    // - API Key ID (public identifier)
    // - API Key Secret (for signing JWT)
    // These are different from OnchainKit API key - you need CDP Secret API Key from https://portal.cdp.coinbase.com
    const apiKeyId = process.env.COINBASE_CDP_API_KEY_ID;
    const apiKeySecret = process.env.COINBASE_CDP_API_KEY_SECRET;
    
    const isSandbox = process.env.NEXT_PUBLIC_COINBASE_ONRAMP_ENV !== "PRODUCTION";

    if (!apiKeyId || !apiKeySecret) {
      return NextResponse.json(
        { 
          error: "API key not configured. Need both COINBASE_CDP_API_KEY_ID and COINBASE_CDP_API_KEY_SECRET from CDP Portal (https://portal.cdp.coinbase.com)." 
        },
        { status: 500 }
      );
    }

    if (!address || !network) {
      return NextResponse.json(
        { error: "Missing address or network" },
        { status: 400 }
      );
    }

    // Get client IP from request (required by Coinbase API)
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     request.headers.get("x-real-ip") || 
                     request.ip ||
                     "127.0.0.1";

    // Map network to blockchain name
    const blockchain = networkToBlockchain[network] || "base";

    // Create JWT token for Coinbase CDP API authentication
    // Documentation: https://docs.cdp.coinbase.com/get-started/authentication/jwt-authentication
    // Coinbase CDP uses ES256 (ECDSA) for JWT signing
    const now = Math.floor(Date.now() / 1000);
    
    let privateKey: CryptoKey;
    try {
      privateKey = await importPrivateKey(apiKeySecret);
    } catch (error) {
      console.error("Failed to import API key secret:", error);
      return NextResponse.json(
        { 
          error: `Invalid API key secret format. ${error instanceof Error ? error.message : "Unknown error"}. ` +
                 `Please ensure COINBASE_CDP_API_KEY_SECRET is in PEM format (-----BEGIN EC PRIVATE KEY----- or -----BEGIN PRIVATE KEY-----) or base64 encoded.`
        },
        { status: 500 }
      );
    }

    // Create and sign JWT
    // For Ed25519 keys, use EdDSA algorithm; for ECDSA, use ES256
    let token: string;
    try {
      // Determine algorithm based on key type
      // Ed25519 uses EdDSA, ECDSA P-256 uses ES256
      const keyAlgorithm = (privateKey.algorithm as any).name;
      const jwtAlgorithm = keyAlgorithm === "Ed25519" ? "EdDSA" : "ES256";
      console.log(`[DEBUG] Using algorithm: ${jwtAlgorithm} for key type: ${keyAlgorithm}`);
      
      token = await new SignJWT({
        sub: apiKeyId,
        iss: "coinbase-cloud",
      })
        .setProtectedHeader({ alg: jwtAlgorithm })
        .setIssuedAt(now)
        .setNotBefore(now)
        .setExpirationTime(now + 120) // Token expires in 2 minutes
        .setAudience("https://api.developer.coinbase.com")
        .sign(privateKey);
    } catch (error) {
      console.error("Failed to sign JWT:", error);
      return NextResponse.json(
        { 
          error: `Failed to create JWT token: ${error instanceof Error ? error.message : "Unknown error"}` 
        },
        { status: 500 }
      );
    }

    // Prepare request body according to Coinbase API documentation
    // Documentation: https://docs.cdp.coinbase.com/onramp-&-offramp/onramp-apis/generating-onramp-url#getting-a-session-token
    const requestBody = {
      addresses: [
        {
          address: address,
          blockchains: [blockchain],
        },
      ],
      assets: ["USDC"],
      clientIp: clientIp,
    };

    console.log("Calling Coinbase Onramp Session Token API:", {
      endpoint: "https://api.developer.coinbase.com/onramp/v1/token",
      isSandbox,
      network,
      blockchain,
      clientIp,
      address: address.substring(0, 10) + "...",
    });

    try {
      // Call Coinbase Onramp Session Token API with JWT authentication
      // Endpoint: https://api.developer.coinbase.com/onramp/v1/token
      const apiUrl = "https://api.developer.coinbase.com/onramp/v1/token";
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Coinbase API error:", {
          status: response.status,
          error: errorText,
        });
        return NextResponse.json(
          { error: `API error: ${errorText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log("Session token generated successfully");
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error("Fetch error details:", {
        message: fetchError instanceof Error ? fetchError.message : "Unknown",
        cause: (fetchError as any)?.cause,
      });
      throw fetchError;
    }
  } catch (error) {
    console.error("Error generating session token:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
