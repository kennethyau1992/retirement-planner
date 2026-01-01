import { FilingStatus } from '../types';
import {
  TAX_BRACKETS_FEDERAL,
  TAX_BRACKETS_PROVINCIAL,
  BASIC_PERSONAL_AMOUNT,
  CAPITAL_GAINS_INCLUSION_RATE_BASE,
  ONTARIO_SURTAX_1_THRESHOLD,
  ONTARIO_SURTAX_1_RATE,
  ONTARIO_SURTAX_2_THRESHOLD,
  ONTARIO_SURTAX_2_RATE,
} from './constants';

export function getTaxBrackets(filingStatus: FilingStatus) {
  void filingStatus;
  return TAX_BRACKETS_FEDERAL;
}

/**
 * Calculate tax based on brackets
 */
function calculateBracketTax(taxableIncome: number, brackets: typeof TAX_BRACKETS_FEDERAL): number {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  let remainingIncome = taxableIncome;
  let previousMax = 0;

  for (const bracket of brackets) {
    const bracketWidth = bracket.max - previousMax;
    const incomeInBracket = Math.min(remainingIncome, bracketWidth);

    if (incomeInBracket <= 0) break;

    tax += incomeInBracket * bracket.rate;
    remainingIncome -= incomeInBracket;
    previousMax = bracket.max;
  }

  return tax;
}

/**
 * Calculate federal income tax on total taxable income
 */
export function calculateRawFederalTax(
  taxableIncome: number
): number {
  return calculateBracketTax(taxableIncome, TAX_BRACKETS_FEDERAL);
}

/**
 * Calculate total federal tax including Capital Gains and BPA credit
 */
export function calculateTotalFederalTax(
  ordinaryIncome: number,
  capitalGains: number,
  filingStatus: FilingStatus
): number {
  void filingStatus;
  
  const taxableCapitalGains = capitalGains * CAPITAL_GAINS_INCLUSION_RATE_BASE;
  const totalTaxableIncome = ordinaryIncome + taxableCapitalGains;

  if (totalTaxableIncome <= 0) return 0;

  let tax = calculateRawFederalTax(totalTaxableIncome);

  // BPA Credit (Simplified: 15% of BPA)
  const bpaCredit = BASIC_PERSONAL_AMOUNT * TAX_BRACKETS_FEDERAL[0].rate;
  tax -= bpaCredit;

  return Math.max(0, tax);
}

/**
 * Calculate provincial tax (Ontario Model)
 * Replaces simple flat rate with progressive brackets + surtax
 */
export function calculateProvincialTax(
  ordinaryIncome: number,
  capitalGains: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _flatRate: number // Keeping signature compatible but ignoring flat rate for better accuracy
): number {
  const taxableCapitalGains = capitalGains * CAPITAL_GAINS_INCLUSION_RATE_BASE;
  const totalTaxableIncome = ordinaryIncome + taxableCapitalGains;

  if (totalTaxableIncome <= 0) return 0;

  // 1. Basic Provincial Tax
  let basicTax = calculateBracketTax(totalTaxableIncome, TAX_BRACKETS_PROVINCIAL);

  // 2. BPA Credit (Provincial) - Approx $12k for Ontario
  // Simplified: reduce basic tax by ~5.05% of 12k = ~$600
  const provincialBPA = 11865; // 2023/24 approx
  const provincialCredit = provincialBPA * TAX_BRACKETS_PROVINCIAL[0].rate;
  basicTax = Math.max(0, basicTax - provincialCredit);

  // 3. Surtax
  let surtax = 0;
  if (basicTax > ONTARIO_SURTAX_1_THRESHOLD) {
    surtax += (basicTax - ONTARIO_SURTAX_1_THRESHOLD) * ONTARIO_SURTAX_1_RATE;
  }
  if (basicTax > ONTARIO_SURTAX_2_THRESHOLD) {
    surtax += (basicTax - ONTARIO_SURTAX_2_THRESHOLD) * ONTARIO_SURTAX_2_RATE;
  }

  // 4. Health Premium (approx max $900 for high income)
  // Simplified lookup
  let healthPremium = 0;
  if (totalTaxableIncome > 200000) healthPremium = 900;
  else if (totalTaxableIncome > 72000) healthPremium = 750;
  else if (totalTaxableIncome > 48000) healthPremium = 600;
  else if (totalTaxableIncome > 36000) healthPremium = 450;
  else if (totalTaxableIncome > 20000) healthPremium = 300;

  return basicTax + surtax + healthPremium;
}

/**
 * Calculate the marginal tax rate
 */
export function getMarginalTaxRate(
  currentTotalIncome: number,
  filingStatus: FilingStatus
): number {
  void filingStatus;
  
  const brackets = TAX_BRACKETS_FEDERAL;
  for (const bracket of brackets) {
    if (currentTotalIncome <= bracket.max) {
      return bracket.rate; // Federal only? Should include provincial.
    }
  }
  return brackets[brackets.length - 1].rate;
}

/**
 * Calculate how much can be withdrawn from RRSP
 * while staying in a specific tax bracket
 */
export function getWithdrawalToFillBracket(
  currentTotalIncome: number,
  targetBracketRate: number,
  filingStatus: FilingStatus
): number {
  void filingStatus;
  const brackets = TAX_BRACKETS_FEDERAL;

  const targetBracket = brackets.find(b => b.rate === targetBracketRate);
  if (!targetBracket) return 0;

  if (currentTotalIncome >= targetBracket.max) return 0;
  
  const totalRoom = targetBracket.max - currentTotalIncome;

  return Math.max(0, totalRoom);
}

/**
 * Effective tax rate
 */
export function getEffectiveTaxRate(
  totalTax: number,
  grossIncome: number
): number {
  if (grossIncome <= 0) return 0;
  return totalTax / grossIncome;
}