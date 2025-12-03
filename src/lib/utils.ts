import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrency(value: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}

export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function calculateHealthFactor(
  collateralValueUSD: number,
  borrowedValueUSD: number,
  liquidationThreshold: number = 0.8
): number {
  if (borrowedValueUSD === 0) return Infinity;
  return (collateralValueUSD * liquidationThreshold) / borrowedValueUSD;
}

export function getHealthFactorStatus(healthFactor: number): {
  status: "critical" | "warning" | "good" | "excellent";
  color: string;
  label: string;
} {
  if (healthFactor < 1.1) {
    return { status: "critical", color: "#ef4444", label: "Critical" };
  }
  if (healthFactor < 1.5) {
    return { status: "warning", color: "#f59e0b", label: "Warning" };
  }
  if (healthFactor < 2.5) {
    return { status: "good", color: "#22c55e", label: "Good" };
  }
  return { status: "excellent", color: "#06b6d4", label: "Excellent" };
}

export function calculateBorrowPower(
  collateralValueUSD: number,
  ltv: number = 0.75
): number {
  return collateralValueUSD * ltv;
}

export function calculateLiquidationPrice(
  currentPrice: number,
  collateralAmount: number,
  borrowedAmount: number,
  liquidationThreshold: number = 0.8
): number {
  return borrowedAmount / (collateralAmount * liquidationThreshold);
}

