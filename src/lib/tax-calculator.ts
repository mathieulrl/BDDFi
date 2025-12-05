// Tax calculator for US federal capital gains tax (2025 brackets)
// Based on filing status, income level, and holding period

export type FilingStatus = "single" | "mfj" | "mfs" | "hoh" | "qw";
export type IncomeBand = 1 | 2 | 3 | 4;
export type HoldingPeriod = "short-term" | "long-term";
export type LombardRelevance = "low" | "medium" | "high" | "very_high";
export type StateTaxProfile = "no_state_capital_gains_tax" | "wa_capital_gains_excise" | "standard_state_income_tax";

export type USState = 
  | "AL" | "AK" | "AZ" | "AR" | "CA" | "CO" | "CT" | "DE" | "FL" | "GA"
  | "HI" | "ID" | "IL" | "IN" | "IA" | "KS" | "KY" | "LA" | "ME" | "MD"
  | "MA" | "MI" | "MN" | "MS" | "MO" | "MT" | "NE" | "NV" | "NH" | "NJ"
  | "NM" | "NY" | "NC" | "ND" | "OH" | "OK" | "OR" | "PA" | "RI" | "SC"
  | "SD" | "TN" | "TX" | "UT" | "VT" | "VA" | "WA" | "WV" | "WI" | "WY" | "DC";

export interface TaxCalculationResult {
  capitalGainType: "short-term" | "long-term";
  federalRate: number;
  federalRateRange?: string; // For short-term (e.g., "22-32%")
  niit: number;
  niitApplies: boolean;
  effectiveFederalRate: number;
  stateRate: number;
  stateTaxProfile: StateTaxProfile;
  effectiveTotalRate: number; // federal + NIIT + state
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

// State tax profiles and rates
const STATE_TAX_PROFILES: Record<USState, { profile: StateTaxProfile; rate: number }> = {
  // Group 1: No state capital gains tax
  AK: { profile: "no_state_capital_gains_tax", rate: 0 },
  FL: { profile: "no_state_capital_gains_tax", rate: 0 },
  NV: { profile: "no_state_capital_gains_tax", rate: 0 },
  NH: { profile: "no_state_capital_gains_tax", rate: 0 },
  SD: { profile: "no_state_capital_gains_tax", rate: 0 },
  TN: { profile: "no_state_capital_gains_tax", rate: 0 },
  TX: { profile: "no_state_capital_gains_tax", rate: 0 },
  WY: { profile: "no_state_capital_gains_tax", rate: 0 },
  MO: { profile: "no_state_capital_gains_tax", rate: 0 }, // Removed in 2025
  
  // Group 2: Washington capital gains excise tax
  WA: { profile: "wa_capital_gains_excise", rate: 7 }, // Conservative 7%, can go up to 9.9%
  
  // Group 3: Standard state income tax (approximate top marginal rates)
  AL: { profile: "standard_state_income_tax", rate: 5.0 },
  AZ: { profile: "standard_state_income_tax", rate: 4.5 },
  AR: { profile: "standard_state_income_tax", rate: 5.5 },
  CA: { profile: "standard_state_income_tax", rate: 13.3 },
  CO: { profile: "standard_state_income_tax", rate: 4.4 },
  CT: { profile: "standard_state_income_tax", rate: 6.99 },
  DE: { profile: "standard_state_income_tax", rate: 6.6 },
  GA: { profile: "standard_state_income_tax", rate: 5.75 },
  HI: { profile: "standard_state_income_tax", rate: 11.0 },
  ID: { profile: "standard_state_income_tax", rate: 6.0 },
  IL: { profile: "standard_state_income_tax", rate: 4.95 },
  IN: { profile: "standard_state_income_tax", rate: 3.23 },
  IA: { profile: "standard_state_income_tax", rate: 6.0 },
  KS: { profile: "standard_state_income_tax", rate: 5.7 },
  KY: { profile: "standard_state_income_tax", rate: 5.0 },
  LA: { profile: "standard_state_income_tax", rate: 4.25 },
  ME: { profile: "standard_state_income_tax", rate: 7.15 },
  MD: { profile: "standard_state_income_tax", rate: 5.75 },
  MA: { profile: "standard_state_income_tax", rate: 5.0 },
  MI: { profile: "standard_state_income_tax", rate: 4.25 },
  MN: { profile: "standard_state_income_tax", rate: 9.85 },
  MS: { profile: "standard_state_income_tax", rate: 5.0 },
  MT: { profile: "standard_state_income_tax", rate: 6.75 },
  NE: { profile: "standard_state_income_tax", rate: 6.84 },
  NJ: { profile: "standard_state_income_tax", rate: 10.75 },
  NM: { profile: "standard_state_income_tax", rate: 5.9 },
  NY: { profile: "standard_state_income_tax", rate: 10.9 },
  NC: { profile: "standard_state_income_tax", rate: 4.75 },
  ND: { profile: "standard_state_income_tax", rate: 2.9 },
  OH: { profile: "standard_state_income_tax", rate: 3.99 },
  OK: { profile: "standard_state_income_tax", rate: 5.0 },
  OR: { profile: "standard_state_income_tax", rate: 9.9 },
  PA: { profile: "standard_state_income_tax", rate: 3.07 },
  RI: { profile: "standard_state_income_tax", rate: 5.99 },
  SC: { profile: "standard_state_income_tax", rate: 7.0 },
  UT: { profile: "standard_state_income_tax", rate: 4.85 },
  VT: { profile: "standard_state_income_tax", rate: 8.75 },
  VA: { profile: "standard_state_income_tax", rate: 5.75 },
  WV: { profile: "standard_state_income_tax", rate: 6.5 },
  WI: { profile: "standard_state_income_tax", rate: 7.65 },
  DC: { profile: "standard_state_income_tax", rate: 10.75 },
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
  holdingPeriod: HoldingPeriod,
  state: USState
): TaxCalculationResult {
  // Normalize QW to MFJ
  const status = filingStatus === "qw" ? "mfj" : filingStatus;
  
  // Get state tax info
  const stateTaxInfo = STATE_TAX_PROFILES[state];
  let stateRate = 0;
  
  // Calculate state rate based on profile and holding period
  if (stateTaxInfo.profile === "no_state_capital_gains_tax") {
    stateRate = 0;
  } else if (stateTaxInfo.profile === "wa_capital_gains_excise") {
    // Washington: only applies to long-term gains
    stateRate = holdingPeriod === "long-term" ? stateTaxInfo.rate : 0;
  } else {
    // Standard state income tax: applies to both short and long-term
    stateRate = stateTaxInfo.rate;
  }
  
  let result: TaxCalculationResult;
  if (holdingPeriod === "long-term") {
    result = calculateLongTermGains(status, incomeBand);
  } else {
    result = calculateShortTermGains(status, incomeBand);
  }
  
  // Add state tax to result
  result.stateRate = stateRate;
  result.stateTaxProfile = stateTaxInfo.profile;
  result.effectiveTotalRate = result.effectiveFederalRate + stateRate;
  
  // Update Lombard relevance based on total rate (federal + NIIT + state)
  // Lombard solution is only interesting if total rate is above 5%
  if (result.effectiveTotalRate < 5) {
    result.lombardRelevance = "low";
    result.profile = `Low tax (${result.effectiveTotalRate.toFixed(2)}% total) – selling BTC is usually cheaper than any Lombard structure.`;
  } else if (result.effectiveTotalRate < 15) {
    result.lombardRelevance = "medium";
    result.profile = `Medium tax (${result.effectiveTotalRate.toFixed(2)}% total) – Lombard starts to make sense if your all-in cost is below ${result.effectiveTotalRate.toFixed(2)}%.`;
  } else if (result.effectiveTotalRate < 25) {
    result.lombardRelevance = "high";
    result.profile = `High tax (${result.effectiveTotalRate.toFixed(2)}% total) – Lombard is often attractive if your all-in cost is below ~${result.effectiveTotalRate.toFixed(2)}%.`;
  } else {
    result.lombardRelevance = "very_high";
    result.profile = `Very high tax (${result.effectiveTotalRate.toFixed(2)}% total) – Lombard is strongly attractive if the cost is below ~${result.effectiveTotalRate.toFixed(2)}%.`;
  }
  
  return result;
}

function calculateLongTermGains(
  status: Exclude<FilingStatus, "qw">,
  incomeBand: IncomeBand
): TaxCalculationResult {
  const federalRate = LTCG_RATES[status][incomeBand];
  const niitThreshold = NIIT_THRESHOLDS[status];
  const incomeRange = INCOME_THRESHOLDS[status][incomeBand];
  
  // Check if NIIT applies (MAGI strictly above threshold)
  // According to documentation:
  // - Band 2: $48,351-$200,000 for Single → NIIT: no (below $200k)
  // - Band 3: $200,001-$533,400 for Single → NIIT: yes (above $200k)
  // So NIIT applies if the minimum of the income band is strictly above the threshold
  const niitApplies = incomeRange[0] > niitThreshold;
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
    stateRate: 0, // Will be set by calculateTax
    stateTaxProfile: "no_state_capital_gains_tax" as StateTaxProfile, // Will be set by calculateTax
    effectiveTotalRate: effectiveRate, // Will be updated by calculateTax
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
  
  // Check if NIIT applies (MAGI strictly above threshold)
  const niitApplies = incomeRange[0] > niitThreshold;
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
    stateRate: 0, // Will be set by calculateTax
    stateTaxProfile: "no_state_capital_gains_tax" as StateTaxProfile, // Will be set by calculateTax
    effectiveTotalRate: effectiveRate, // Will be updated by calculateTax
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
  // Normalize QW to MFJ for display
  const status = filingStatus === "qw" ? "mfj" : filingStatus;
  const [min, max] = INCOME_THRESHOLDS[status][incomeBand];
  
  if (max === Infinity) {
    return `$${min.toLocaleString("en-US")}+`;
  }
  return `$${min.toLocaleString("en-US")} – $${max.toLocaleString("en-US")}`;
}

// Get state name from code
export function getStateName(state: USState): string {
  const stateNames: Record<USState, string> = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
    CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
    HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
    KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
    MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
    MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
    NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
    OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
    SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
    VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
    DC: "Washington D.C.",
  };
  return stateNames[state];
}

// Get all US states for dropdown
export const ALL_US_STATES: { value: USState; label: string }[] = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" }, { value: "DC", label: "Washington D.C." },
];

