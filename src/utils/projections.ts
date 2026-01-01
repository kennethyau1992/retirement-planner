import {
  Account,
  Profile,
  Assumptions, // New import
  AccumulationResult,
  YearlyAccountBalance,
  getTaxTreatment,
  hasEmployerMatch,
} from '../types';
import { FHSA_LIFETIME_LIMIT } from './constants';

/**
 * Calculate employer match for an RRSP account (Group RRSP)
 */
function calculateEmployerMatch(account: Account): number {
  if (!hasEmployerMatch(account.type) || !account.employerMatchPercent || !account.employerMatchLimit) {
    return 0;
  }

  // Match is the lesser of:
  // 1. The match percent times the contribution
  // 2. The match limit
  const matchAmount = account.annualContribution * account.employerMatchPercent;
  return Math.min(matchAmount, account.employerMatchLimit);
}

/**
 * Project account growth during accumulation phase
 */
export function calculateAccumulation(
  accounts: Account[],
  profile: Profile,
  assumptions: Assumptions // New parameter
): AccumulationResult {
  const yearsToRetirement = profile.retirementAge - profile.currentAge;
  const currentYear = new Date().getFullYear();

  // Initialize balances
  const balances: Record<string, number> = {};
  const contributions: Record<string, number> = {};
  const cumulativeContributions: Record<string, number> = {}; // New: Track lifetime contributions

  accounts.forEach(account => {
    balances[account.id] = account.balance;
    contributions[account.id] = account.annualContribution;
    cumulativeContributions[account.id] = 0; // Start at 0 (or assume past contributions not tracked in simplified model)
  });

  const yearlyBalances: YearlyAccountBalance[] = [];

  // Record initial state (year 0)
  yearlyBalances.push({
    age: profile.currentAge,
    year: currentYear,
    balances: { ...balances },
    totalBalance: Object.values(balances).reduce((sum, b) => sum + b, 0),
    contributions: { ...contributions },
  });

  // Project each year
  for (let i = 1; i <= yearsToRetirement; i++) {
    const age = profile.currentAge + i;
    const year = currentYear + i;

    accounts.forEach(account => {
      const currentBalance = balances[account.id];
      let currentContribution = contributions[account.id];

      // Check FHSA Lifetime Limit
      if (account.type === 'fhsa') {
        const remainingSpace = FHSA_LIFETIME_LIMIT - cumulativeContributions[account.id];
        if (remainingSpace <= 0) {
          currentContribution = 0;
        } else if (currentContribution > remainingSpace) {
          currentContribution = remainingSpace;
        }
        cumulativeContributions[account.id] += currentContribution;
      }

      // 1. Apply investment return to existing balance
      const balanceAfterReturn = currentBalance * (1 + account.returnRate);

      // 2. Add contribution (with employer match if applicable)
      const employerMatch = calculateEmployerMatch({
        ...account,
        annualContribution: currentContribution,
      });
      const totalContribution = currentContribution + employerMatch;

      // Update balance
      balances[account.id] = balanceAfterReturn + totalContribution;

      // 3. Grow contribution for next year (only if not capped by FHSA rule)
      if (account.type !== 'fhsa' || cumulativeContributions[account.id] < FHSA_LIFETIME_LIMIT) {
         contributions[account.id] = currentContribution * (1 + account.contributionGrowthRate);
      } else {
         contributions[account.id] = 0;
      }
    });

    const totalBalance = Object.values(balances).reduce((sum, b) => sum + b, 0);

    yearlyBalances.push({
      age,
      year,
      balances: { ...balances },
      totalBalance,
      contributions: { ...contributions }, // Note: This records what *was* contributed this year (after cap)
    });
  }

  // Calculate breakdown by tax treatment
  const breakdownByTaxTreatment = {
    pretax: 0,
    tax_free: 0,
    taxable: 0,
  };

  accounts.forEach(account => {
    const treatment = getTaxTreatment(account.type);
    breakdownByTaxTreatment[treatment] += balances[account.id];
  });

  const totalAtRetirement = Object.values(balances).reduce((sum, b) => sum + b, 0);
  
  // Calculate value in today's dollars
  // Real = FutureValue / (1 + inflation)^years
  const discountFactor = Math.pow(1 + assumptions.inflationRate, yearsToRetirement);
  const totalAtRetirementReal = totalAtRetirement / discountFactor;

  const breakdownByTaxTreatmentReal = {
    pretax: breakdownByTaxTreatment.pretax / discountFactor,
    tax_free: breakdownByTaxTreatment.tax_free / discountFactor,
    taxable: breakdownByTaxTreatment.taxable / discountFactor,
  };

  return {
    yearlyBalances,
    finalBalances: { ...balances },
    totalAtRetirement,
    totalAtRetirementReal,
    breakdownByTaxTreatment,
    breakdownByTaxTreatmentReal,
  };
}

/**
 * Get the balance of an account at a specific age
 */
export function getBalanceAtAge(
  result: AccumulationResult,
  accountId: string,
  age: number
): number {
  const yearData = result.yearlyBalances.find(y => y.age === age);
  if (!yearData) return 0;
  return yearData.balances[accountId] || 0;
}

/**
 * Calculate total contributions made over accumulation phase
 */
export function calculateTotalContributions(
  accounts: Account[],
  profile: Profile
): Record<string, number> {
  const yearsToRetirement = profile.retirementAge - profile.currentAge;
  const totals: Record<string, number> = {};

  accounts.forEach(account => {
    let totalContribution = 0;
    let yearlyContribution = account.annualContribution;

    for (let i = 0; i < yearsToRetirement; i++) {
      const employerMatch = calculateEmployerMatch({
        ...account,
        annualContribution: yearlyContribution,
      });
      totalContribution += yearlyContribution + employerMatch;
      yearlyContribution *= (1 + account.contributionGrowthRate);
    }

    totals[account.id] = totalContribution;
  });

  return totals;
}
