export type AccountType =
  | 'rrsp'
  | 'tfsa'
  | 'non_registered'
  | 'fhsa';

export type FilingStatus = 'single';

export type TaxTreatment = 'pretax' | 'tax_free' | 'taxable';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  owner: 'primary' | 'spouse'; // New field for family planning
  balance: number;
  annualContribution: number;
  contributionGrowthRate: number; // as decimal, e.g., 0.03
  returnRate: number; // as decimal
  employerMatchPercent?: number; // Match Ratio (e.g. 0.5 for 50%, 1.0 for 100%)
  matchableSalaryPercent?: number; // Max salary % matched (e.g. 0.05 for 5%)
  employerMatchLimit?: number; // RRSP only, dollar amount
}

export interface Profile {
  name: string; // "You" or user input
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  filingStatus: FilingStatus;
  provinceTaxRate: number; // as decimal (simplified)
  annualIncome?: number; // Gross annual income for contribution calculations
  annualSpending?: number; // New: For budget-based savings calculation
  isFirstTimeHomeBuyer?: boolean; // For FHSA eligibility
  cppOasBenefit?: number; // annual, in today's dollars
  cppOasStartAge?: number;
  spouse?: Profile; // Optional spouse profile
}

export interface Assumptions {
  inflationRate: number; // as decimal
  safeWithdrawalRate: number; // as decimal
  retirementReturnRate: number; // as decimal
}

export interface YearlyAccountBalance {
  age: number;
  year: number;
  balances: Record<string, number>; // accountId -> balance
  totalBalance: number;
  contributions: Record<string, number>; // accountId -> contribution that year
}

export interface AccumulationResult {
  yearlyBalances: YearlyAccountBalance[];
  finalBalances: Record<string, number>;
  totalAtRetirement: number;
  totalAtRetirementReal: number; // Value in today's dollars
  breakdownByTaxTreatment: {
    pretax: number;
    tax_free: number;
    taxable: number;
  };
  breakdownByTaxTreatmentReal: {
    pretax: number;
    tax_free: number;
    taxable: number;
  };
}

export interface YearlyWithdrawal {
  age: number;
  year: number;
  withdrawals: Record<string, number>; // accountId -> withdrawal
  remainingBalances: Record<string, number>; // accountId -> remaining balance
  totalWithdrawal: number;
  cppOasIncome: number;
  grossIncome: number;
  federalTax: number;
  provincialTax: number;
  totalTax: number;
  afterTaxIncome: number;
  targetSpending: number;
  rmdAmount: number;
  totalRemainingBalance: number;
}

export interface RetirementResult {
  yearlyWithdrawals: YearlyWithdrawal[];
  portfolioDepletionAge: number | null; // null if never depletes
  lifetimeTaxesPaid: number;
  sustainableMonthlyWithdrawal: number; // Real (Today's $)
  sustainableAnnualWithdrawal: number; // Real (Today's $)
  sustainableMonthlyWithdrawalNominal: number; // Future (Age 65 $)
  sustainableAnnualWithdrawalNominal: number; // Future (Age 65 $)
  accountDepletionAges: Record<string, number | null>; // accountId -> age when depleted
}

export interface AppState {
  accounts: Account[];
  profile: Profile;
  assumptions: Assumptions;
}

// Tax bracket structure
export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

// RRIF Minimum Withdrawal table entry
export interface RRIFEntry {
  age: number;
  factor: number; // Percentage as decimal (e.g. 0.0528)
}

// Helper function type for getting tax treatment
export function getTaxTreatment(accountType: AccountType): TaxTreatment {
  switch (accountType) {
    case 'rrsp':
      return 'pretax';
    case 'tfsa':
    case 'fhsa':
      return 'tax_free';
    case 'non_registered':
      return 'taxable';
  }
}

export function getAccountTypeLabel(type: AccountType): string {
  switch (type) {
    case 'rrsp':
      return 'RRSP';
    case 'tfsa':
      return 'TFSA';
    case 'fhsa':
      return 'FHSA';
    case 'non_registered':
      return 'Non-Registered';
  }
}

export function hasEmployerMatch(type: AccountType): boolean {
  return type === 'rrsp'; // Group RRSP
}

export function isPreTax(type: AccountType): boolean {
  return type === 'rrsp';
}
