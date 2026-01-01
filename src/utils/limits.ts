import { Profile } from '../types';
import {
  RRSP_CONTRIBUTION_RATE,
  RRSP_MAX_LIMIT,
  TFSA_ANNUAL_LIMIT,
  FHSA_ANNUAL_LIMIT,
  CPP_PREMIUM_RATE,
  CPP_MAX_PENSIONABLE_EARNINGS,
  CPP_EXEMPTION,
  CPP_MAX_CONTRIBUTION,
  EI_PREMIUM_RATE,
  EI_MAX_INSURABLE_EARNINGS,
  EI_MAX_CONTRIBUTION,
} from './constants';
import { calculateTotalFederalTax, calculateProvincialTax } from './taxes';

export interface ContributionLimits {
  rrsp: number;
  tfsa: number;
  fhsa: number;
  nonRegistered: number;
  total: number;
  grossIncome: number;
  totalTax: number;
  federalTax: number;
  provincialTax: number;
  cppEi: number;
  netIncome: number;
  annualSpending: number;
  availableSavings: number;
  spouse?: ContributionLimits;
}

/**
 * Calculate CPP and EI premiums
 */
function calculateDeductions(income: number): number {
  // CPP
  const cppPensionable = Math.max(0, Math.min(income, CPP_MAX_PENSIONABLE_EARNINGS) - CPP_EXEMPTION);
  const cpp = Math.min(cppPensionable * CPP_PREMIUM_RATE, CPP_MAX_CONTRIBUTION);

  // EI
  const eiInsurable = Math.min(income, EI_MAX_INSURABLE_EARNINGS);
  const ei = Math.min(eiInsurable * EI_PREMIUM_RATE, EI_MAX_CONTRIBUTION);

  return cpp + ei;
}

/**
 * Calculate limits for a single person with budget constraints
 */
function calculateIndividualLimits(
  annualIncome: number,
  annualSpending: number,
  age: number,
  isFirstTimeHomeBuyer: boolean,
  provinceTaxRate: number
): ContributionLimits {
  // 1. Calculate Theoretical Limits
  const maxRrsp = Math.min(annualIncome * RRSP_CONTRIBUTION_RATE, RRSP_MAX_LIMIT);
  const maxTfsa = age >= 18 ? TFSA_ANNUAL_LIMIT : 0;
  const maxFhsa = (age >= 18 && isFirstTimeHomeBuyer) ? FHSA_ANNUAL_LIMIT : 0;

  // 2. Calculate Budget Constraint
  const federalTax = calculateTotalFederalTax(annualIncome, 0, 'single');
  const provincialTax = calculateProvincialTax(annualIncome, 0, provinceTaxRate);
  const totalTax = federalTax + provincialTax;
  
  const cppEi = calculateDeductions(annualIncome);
  
  const netIncome = annualIncome - totalTax - cppEi;
  const availableSavings = Math.max(0, netIncome - annualSpending);

  // 3. Distribute Available Savings
  // Priority: FHSA -> TFSA -> RRSP -> Non-Registered
  
  let remainingBudget = availableSavings;

  const fhsaContribution = Math.min(remainingBudget, maxFhsa);
  remainingBudget -= fhsaContribution;

  const tfsaContribution = Math.min(remainingBudget, maxTfsa);
  remainingBudget -= tfsaContribution;

  const rrspContribution = Math.min(remainingBudget, maxRrsp);
  remainingBudget -= rrspContribution;

  const nonRegisteredContribution = remainingBudget;

  return {
    rrsp: rrspContribution,
    tfsa: tfsaContribution,
    fhsa: fhsaContribution,
    nonRegistered: nonRegisteredContribution,
    total: rrspContribution + tfsaContribution + fhsaContribution + nonRegisteredContribution,
    grossIncome: annualIncome,
    totalTax,
    federalTax,
    provincialTax,
    cppEi,
    netIncome,
    annualSpending,
    availableSavings,
  };
}

/**
 * Calculate estimated annual contribution room based on current profile.
 */
export function calculateAnnualLimits(profile: Profile): ContributionLimits {
  const primaryLimits = calculateIndividualLimits(
    profile.annualIncome || 0,
    profile.annualSpending || 0,
    profile.currentAge,
    profile.isFirstTimeHomeBuyer || false,
    profile.provinceTaxRate
  );

  if (profile.spouse) {
    const spouseLimits = calculateIndividualLimits(
      profile.spouse.annualIncome || 0,
      profile.spouse.annualSpending || 0,
      profile.spouse.currentAge,
      profile.spouse.isFirstTimeHomeBuyer || false,
      profile.spouse.provinceTaxRate ?? profile.provinceTaxRate
    );
    
    return {
      ...primaryLimits,
      spouse: {
        ...spouseLimits,
        total: spouseLimits.total
      }
    };
  }

  return primaryLimits;
}
