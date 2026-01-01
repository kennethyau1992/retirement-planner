import { TaxBracket, RRIFEntry } from '../types';

// 2024 Canadian Federal Tax Brackets
export const TAX_BRACKETS_FEDERAL: TaxBracket[] = [
  { min: 0, max: 55867, rate: 0.15 },
  { min: 55867, max: 111733, rate: 0.205 },
  { min: 111733, max: 173205, rate: 0.26 },
  { min: 173205, max: 246752, rate: 0.29 },
  { min: 246752, max: Infinity, rate: 0.33 },
];

// 2024 Ontario Tax Brackets (Proxy for Provincial)
export const TAX_BRACKETS_PROVINCIAL: TaxBracket[] = [
  { min: 0, max: 51446, rate: 0.0505 },
  { min: 51446, max: 102892, rate: 0.0915 },
  { min: 102892, max: 150000, rate: 0.1116 },
  { min: 150000, max: 220000, rate: 0.1216 },
  { min: 220000, max: Infinity, rate: 0.1316 },
];

export const ONTARIO_SURTAX_1_THRESHOLD = 5315;
export const ONTARIO_SURTAX_1_RATE = 0.20;
export const ONTARIO_SURTAX_2_THRESHOLD = 6802;
export const ONTARIO_SURTAX_2_RATE = 0.36;

// 2024 Basic Personal Amount (Federal)
export const BASIC_PERSONAL_AMOUNT = 15705;

// CPP & EI Premiums (2024)
export const CPP_PREMIUM_RATE = 0.0595;
export const CPP_MAX_PENSIONABLE_EARNINGS = 68500;
export const CPP_EXEMPTION = 3500;
export const CPP_MAX_CONTRIBUTION = 3867.50;

export const EI_PREMIUM_RATE = 0.0166;
export const EI_MAX_INSURABLE_EARNINGS = 63200;
export const EI_MAX_CONTRIBUTION = 1049.12;

// Contribution Limits (2024/2025)
export const RRSP_CONTRIBUTION_RATE = 0.18;
export const RRSP_MAX_LIMIT = 31560; // 2024 limit
export const TFSA_ANNUAL_LIMIT = 7000; // 2024 limit
export const FHSA_ANNUAL_LIMIT = 8000;
export const FHSA_LIFETIME_LIMIT = 40000;

// Capital Gains Inclusion Rate (Simplified, usually 50%, 66.67% over 250k as of June 2024)
// For simplicity in this v1, we'll use 50% as the base, or maybe conservative 66.67%?
// Let's stick to 50% for < 250k which is most people's annual withdrawal, but better to be precise.
// We will define it here, logic will be in taxes.ts
export const CAPITAL_GAINS_INCLUSION_RATE_BASE = 0.50;

// RRIF must be established by end of year you turn 71. Payments start year you turn 72.
export const RRIF_START_AGE = 72;

// RRIF Minimum Withdrawal Factors (Age at start of year)
export const RRIF_TABLE: RRIFEntry[] = [
  { age: 70, factor: 0.0500 },
  { age: 71, factor: 0.0528 },
  { age: 72, factor: 0.0540 },
  { age: 73, factor: 0.0553 },
  { age: 74, factor: 0.0567 },
  { age: 75, factor: 0.0582 },
  { age: 76, factor: 0.0598 },
  { age: 77, factor: 0.0617 },
  { age: 78, factor: 0.0636 },
  { age: 79, factor: 0.0658 },
  { age: 80, factor: 0.0682 },
  { age: 81, factor: 0.0708 },
  { age: 82, factor: 0.0738 },
  { age: 83, factor: 0.0771 },
  { age: 84, factor: 0.0808 },
  { age: 85, factor: 0.0851 },
  { age: 86, factor: 0.0899 },
  { age: 87, factor: 0.0955 },
  { age: 88, factor: 0.1021 },
  { age: 89, factor: 0.1099 },
  { age: 90, factor: 0.1192 },
  { age: 91, factor: 0.1306 },
  { age: 92, factor: 0.1449 },
  { age: 93, factor: 0.1634 },
  { age: 94, factor: 0.1879 },
  { age: 95, factor: 0.2000 }, // Capped at 20% for 95+
];

export function getRRIFFactor(age: number): number {
  if (age < RRIF_START_AGE) return 0;
  const entry = RRIF_TABLE.find(e => e.age === age);
  if (entry) return entry.factor;
  if (age >= 95) return 0.20;
  return 0;
}

// Chart colors
export const CHART_COLORS = {
  pretax: '#3b82f6', // blue (RRSP)
  tax_free: '#10b981', // green (TFSA/FHSA)
  taxable: '#f59e0b', // amber (Non-Reg)
  tax: '#ef4444', // red
  socialSecurity: '#6366f1', // indigo (CPP/OAS)
  spending: '#0d9488', // teal
};

// Default values for new app state
export const DEFAULT_PROFILE = {
  name: 'Primary',
  currentAge: 35,
  retirementAge: 65,
  lifeExpectancy: 120,
  filingStatus: 'single' as const,
  provinceTaxRate: 0.10, // Approx average provincial tax
  cppOasBenefit: 0, // Set to 0 as requested
  cppOasStartAge: 65,
};

export const DEFAULT_ASSUMPTIONS = {
  inflationRate: 0.025, // Bank of Canada target is 2%, but let's be safe
  safeWithdrawalRate: 0.04,
  retirementReturnRate: 0.05,
};
