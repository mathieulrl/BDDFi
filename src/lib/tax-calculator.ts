// Tax calculator for US federal capital gains tax (2025 brackets)
// Based on filing status, income level, and holding period

export type FilingStatus = "single" | "mfj" | "mfs" | "hoh" | "qw";
export type IncomeBand = 1 | 2 | 3 | 4;
export type HoldingPeriod = "short-term" | "long-term";
export type LombardRelevance = "low" | "medium" | "high" | "very_high";

export interface TaxCalculationResult {
  capitalGainType: "short-term" | "long-term";
  federalRate: number;
  federalRateRange?: string; // For short-term (e.g., "22-32%")
  niit: number;
  niitApplies: boolean;
  effectiveFederalRate: number;
  lombardRelevance: LombardRelevance;
  profile: string;
}

// Income band thresholds for 2025 (MAGI ranges)
const INCOME_THRESHOLDS: Record<FilingStatus, { [key in IncomeBand]: [number, number] }> = {
  single: {
    1: [0, 48350],
    2: [48351, 200000],
    3: [200001, 533400],
    4: [533401, Infinity],
  },
  mfj: {
    1: [0, 96700],
    2: [96701, 250000],
    3: [250001, 600050],
    4: [600051, Infinity],
  },
  mfs: {
    1: [0, 48350],
    2: [48351, 125000],
    3: [125001, 300000],
    4: [300001, Infinity],
  },
  hoh: {
    1: [0, 64750],
    2: [64751, 200000],
    3: [200001, 566700],
    4: [566701, Infinity],
  },
  qw: {
    // Same as MFJ
    1: [0, 96700],
    2: [96701, 250000],
    3: [250001, 600050],
    4: [600051, Infinity],
  },
};

// NIIT thresholds (3.8% Net Investment Income Tax)
const NIIT_THRESHOLDS: Record<FilingStatus, number> = {
  single: 200000,
  mfj: 250000,
  mfs: 125000,
  hoh: 200000,
  qw: 250000,
};

// Long-term capital gains rates (2025)
const LTCG_RATES: Record<FilingStatus, { [key in IncomeBand]: number }> = {
  single: { 1: 0, 2: 15, 3: 15, 4: 20 },
  mfj: { 1: 0, 2: 15, 3: 15, 4: 20 },
  mfs: { 1: 0, 2: 15, 3: 15, 4: 20 },
  hoh: { 1: 0, 2: 15, 3: 15, 4: 20 },
  qw: { 1: 0, 2: 15, 3: 15, 4: 20 },
};

// Short-term capital gains (ordinary income) approximate rates
const STCG_RATES: Record<FilingStatus, { [key in IncomeBand]: { range: string; base: number } }> = {
  single: {
    1: { range: "10–12%", base: 12 },
    2: { range: "22–32%", base: 24 },
    3: { range: "32–37%", base: 35 },
    4: { range: "32–37%", base: 37 },
  },
  mfj: {
    1: { range: "10–12%", base: 12 },
    2: { range: "22–24%", base: 22 },
    3: { range: "24–32%", base: 32 },
    4: { range: "32–37%", base: 37 },
  },
  mfs: {
    1: { range: "10–12%", base: 12 },
    2: { range: "22–24%", base: 22 },
    3: { range: "24–32%", base: 32 },
    4: { range: "32–37%", base: 37 },
  },
  hoh: {
    1: { range: "10–12%", base: 12 },
    2: { range: "22–24%", base: 22 },
    3: { range: "24–32%", base: 32 },
    4: { range: "32–37%", base: 37 },
  },
  qw: {
    1: { range: "10–12%", base: 12 },
    2: { range: "22–24%", base: 22 },
    3: { range: "24–32%", base: 32 },
    4: { range: "32–37%", base: 37 },
  },
};

export function calculateTax(
  filingStatus: FilingStatus,
  incomeBand: IncomeBand,
  holdingPeriod: HoldingPeriod
): TaxCalculationResult {
  // Normalize QW to MFJ
  const status = filingStatus === "qw" ? "mfj" : filingStatus;
  
  if (holdingPeriod === "long-term") {
    return calculateLongTermGains(status, incomeBand);
  } else {
    return calculateShortTermGains(status, incomeBand);
  }
}

function calculateLongTermGains(
  status: Exclude<FilingStatus, "qw">,
  incomeBand: IncomeBand
): TaxCalculationResult {
  const federalRate = LTCG_RATES[status][incomeBand];
  const niitThreshold = NIIT_THRESHOLDS[status];
  const incomeRange = INCOME_THRESHOLDS[status][incomeBand];
  
  // Check if NIIT applies (MAGI above threshold)
  const niitApplies = incomeRange[0] >= niitThreshold || (incomeRange[1] >= niitThreshold && incomeRange[0] < niitThreshold);
  const niit = niitApplies ? 3.8 : 0;
  const effectiveRate = federalRate + niit;
  
  // Determine Lombard relevance
  let lombardRelevance: LombardRelevance;
  let profile: string;
  
  if (federalRate === 0) {
    lombardRelevance = "low";
    profile = "Very low tax – selling BTC is usually cheaper than any Lombard structure.";
  } else if (federalRate === 15 && !niitApplies) {
    lombardRelevance = "medium";
    profile = "Medium tax – Lombard starts to make sense if your all-in cost is below 15%.";
  } else if (federalRate === 15 && niitApplies) {
    lombardRelevance = "high";
    profile = "High tax – Lombard is often attractive if your all-in cost is below ~18–19%.";
  } else {
    lombardRelevance = "very_high";
    profile = "Very high tax – Lombard is strongly attractive if the cost is below ~23–24%.";
  }
  
  return {
    capitalGainType: "long-term",
    federalRate,
    niit,
    niitApplies,
    effectiveFederalRate: effectiveRate,
    lombardRelevance,
    profile,
  };
}

function calculateShortTermGains(
  status: Exclude<FilingStatus, "qw">,
  incomeBand: IncomeBand
): TaxCalculationResult {
  const stcgInfo = STCG_RATES[status][incomeBand];
  const niitThreshold = NIIT_THRESHOLDS[status];
  const incomeRange = INCOME_THRESHOLDS[status][incomeBand];
  
  // Check if NIIT applies
  const niitApplies = incomeRange[0] >= niitThreshold || (incomeRange[1] >= niitThreshold && incomeRange[0] < niitThreshold);
  const niit = niitApplies ? 3.8 : 0;
  const effectiveRate = stcgInfo.base + niit;
  
  // Determine Lombard relevance
  let lombardRelevance: LombardRelevance;
  let profile: string;
  
  if (incomeBand === 1) {
    lombardRelevance = "low";
    profile = "Low short-term tax compared to high earners – but selling is still more expensive than a long-term sale.";
  } else if (incomeBand === 2) {
    lombardRelevance = "high";
    profile = "Short-term high tax – Lombard / waiting to qualify for long-term is clearly more attractive than selling now.";
  } else {
    lombardRelevance = "very_high";
    profile = "Very high short-term tax – selling BTC now is extremely tax-heavy; Lombard / waiting for long-term treatment is highly relevant.";
  }
  
  return {
    capitalGainType: "short-term",
    federalRate: stcgInfo.base,
    federalRateRange: stcgInfo.range,
    niit,
    niitApplies,
    effectiveFederalRate: effectiveRate,
    lombardRelevance,
    profile,
  };
}

// Helper to determine income band from MAGI
export function getIncomeBand(magi: number, filingStatus: FilingStatus): IncomeBand {
  const status = filingStatus === "qw" ? "mfj" : filingStatus;
  const thresholds = INCOME_THRESHOLDS[status];
  
  if (magi <= thresholds[1][1]) return 1;
  if (magi <= thresholds[2][1]) return 2;
  if (magi <= thresholds[3][1]) return 3;
  return 4;
}

// Get income range display for a band
export function getIncomeRangeDisplay(filingStatus: FilingStatus, incomeBand: IncomeBand): string {
  const status = filingStatus === "qw" ? "mfj" : filingStatus;
  const [min, max] = INCOME_THRESHOLDS[status][incomeBand];
  
  if (max === Infinity) {
    return `$${min.toLocaleString()}+`;
  }
  return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
}

