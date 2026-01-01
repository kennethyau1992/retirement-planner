/**
 * Retirement Calculator Math Tests (Canadian Edition)
 *
 * This file tests all the core financial calculations to ensure accuracy.
 * Run with: npx tsx src/tests/calculations.test.ts
 */

import { calculateAccumulation } from '../utils/projections';
import { calculateWithdrawals } from '../utils/withdrawals';
import {
  calculateTotalFederalTax,
  calculateProvincialTax,
} from '../utils/taxes';
import { getRRIFFactor, RRIF_START_AGE, BASIC_PERSONAL_AMOUNT, CAPITAL_GAINS_INCLUSION_RATE_BASE } from '../utils/constants';
import { Account, Profile, Assumptions } from '../types';

// Test utilities
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ ${message}`);
    failedTests++;
  }
}

function assertApprox(actual: number, expected: number, tolerance: number, message: string): void {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log(`  ✓ ${message} (got ${actual.toFixed(2)}, expected ${expected.toFixed(2)})`);
    passedTests++;
  } else {
    console.error(`  ✗ ${message} (got ${actual.toFixed(2)}, expected ${expected.toFixed(2)}, diff: ${diff.toFixed(2)})`);
    failedTests++;
  }
}

function section(name: string): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${name}`);
  console.log('='.repeat(60));
}

// =============================================================================
// TAX CALCULATION TESTS
// =============================================================================

function testTaxCalculations(): void {
  section('TAX CALCULATIONS (CANADA)');

  console.log('\n--- Federal Income Tax ---');

  // 2024 Brackets:
  // 15% on first $55,867
  // BPA Credit: 15% of $15,705 = $2,355.75

  // Test 1: Income below BPA
  // Tax should be 0 (credits exceed calculated tax)
  const tax1 = calculateTotalFederalTax(10000, 0, 'single');
  assertApprox(tax1, 0, 0.01, '$10k income = $0 tax (below BPA)');

  // Test 2: Income $50,000 (1st bracket)
  // Tax = $50,000 * 0.15 = $7,500
  // Less BPA credit $2,355.75
  // Net = $5,144.25
  const tax2 = calculateTotalFederalTax(50000, 0, 'single');
  assertApprox(tax2, 5144.25, 0.01, '$50k income = $5,144.25 tax');

  console.log('\n--- Capital Gains Tax ---');

  // $100k Capital Gains
  // Taxable portion = $50k (50% inclusion)
  // Tax on $50k ordinary income (calculated above) = $5,144.25
  const tax3 = calculateTotalFederalTax(0, 100000, 'single');
  assertApprox(tax3, 5144.25, 0.01, '$100k Cap Gains (no other income) = same tax as $50k ordinary');

  // Mixed: $50k Ordinary + $20k Cap Gains
  // Taxable Gains = $10k
  // Total Income = $60k
  // Tax on $60k:
  // First $55,867 @ 15% = $8,380.05
  // Remaining $4,133 @ 20.5% = $847.27
  // Total Raw Tax = $9,227.32
  // Less BPA Credit ($2,355.75) = $6,871.57
  const tax4 = calculateTotalFederalTax(50000, 20000, 'single');
  assertApprox(tax4, 6871.57, 0.01, '$50k ordinary + $20k gains ($60k taxable) = $6,871.57');

  console.log('\n--- Provincial Tax ---');

  // Flat rate 10% on total taxable income
  // $50k ordinary + $20k gains = $60k taxable
  // Tax = $6,000
  const provTax = calculateProvincialTax(50000, 20000, 0.10);
  assertApprox(provTax, 6000, 0.01, 'Provincial tax flat 10% on $60k taxable = $6,000');
}

// =============================================================================
// RRIF TESTS
// =============================================================================

function testRRIFCalculations(): void {
  section('RRIF CALCULATIONS');

  // RRIF starts at age 72 (payment start)
  const factor71 = getRRIFFactor(71);
  assertApprox(factor71, 0, 0.01, 'No RRIF min at age 71 (must convert by end of year)');

  const factor72 = getRRIFFactor(72);
  assertApprox(factor72, 0.0540, 0.0001, 'RRIF factor at age 72 = 5.40%');

  const factor95 = getRRIFFactor(95);
  assertApprox(factor95, 0.20, 0.01, 'RRIF factor capped at 20% for 95+');
}

// =============================================================================
// ACCUMULATION TESTS
// =============================================================================

function testAccumulation(): void {
  section('ACCUMULATION');

  const account: Account = {
    id: 'rrsp',
    name: 'RRSP',
    type: 'rrsp',
    balance: 100000,
    annualContribution: 10000,
    contributionGrowthRate: 0,
    returnRate: 0.05,
  };

  const profile: Profile = {
    currentAge: 30,
    retirementAge: 31,
    lifeExpectancy: 90,
    filingStatus: 'single',
    provinceTaxRate: 0.10,
  };

  const result = calculateAccumulation([account], profile);
  // Year 1: $100k * 1.05 + $10k = $115,000
  assertApprox(result.totalAtRetirement, 115000, 0.01, '1 year growth + contribution');
  assertApprox(result.breakdownByTaxTreatment.pretax, 115000, 0.01, 'Correctly categorized as Pre-tax');
}

// =============================================================================
// WITHDRAWAL STRATEGY TESTS
// =============================================================================

function testWithdrawalStrategy(): void {
  section('WITHDRAWAL STRATEGY');

  const rrsp: Account = {
    id: 'rrsp',
    name: 'RRSP',
    type: 'rrsp',
    balance: 500000,
    annualContribution: 0,
    contributionGrowthRate: 0,
    returnRate: 0,
  };

  const tfsa: Account = {
    id: 'tfsa',
    name: 'TFSA',
    type: 'tfsa',
    balance: 100000,
    annualContribution: 0,
    contributionGrowthRate: 0,
    returnRate: 0,
  };

  const profile: Profile = {
    currentAge: 65,
    retirementAge: 65,
    lifeExpectancy: 66,
    filingStatus: 'single',
    provinceTaxRate: 0.10,
    cppOasBenefit: 0,
    cppOasStartAge: 65,
  };

  const assumptions: Assumptions = {
    inflationRate: 0,
    safeWithdrawalRate: 0.04, // $24k withdrawal (4% of $600k)
    retirementReturnRate: 0,
  };

  const accumulation = calculateAccumulation([rrsp, tfsa], profile);
  const result = calculateWithdrawals([rrsp, tfsa], profile, assumptions, accumulation);

  const year1 = result.yearlyWithdrawals[0];

  // Strategy:
  // 1. RRIF Min (Age 65 < 72, so 0)
  // 2. Fill Bracket 1 (Top ~55k) with RRSP.
  // 3. TFSA.
  // We need $24k.
  // RRSP withdrawal should fill need because $24k < $55k bracket.
  // So all should come from RRSP. TFSA preserved.

  assert(year1.withdrawals['rrsp'] >= 24000, 'Withdraws from RRSP first (fill low bracket)');
  assert(year1.withdrawals['tfsa'] === 0, 'TFSA preserved when RRSP fits in low bracket');

  // Test High Need (exceeding bracket 1)
  const highNeedAssumptions: Assumptions = {
    ...assumptions,
    safeWithdrawalRate: 0.20, // $120k needed
  };

  const highResult = calculateWithdrawals([rrsp, tfsa], profile, highNeedAssumptions, accumulation);
  const highYear1 = highResult.yearlyWithdrawals[0];

  // Need $120k.
  // Bracket 1 is ~55k.
  // Should take ~55k from RRSP.
  // Then take from TFSA (Tax Free) -> $100k available.
  // Need remaining: $120k - $55k = $65k.
  // TFSA has $100k. Should take $65k from TFSA.
  // Wait, logic says:
  // 1. RRIF (0)
  // 2. Fill Bracket 1 (~55k) from RRSP.
  // 3. TFSA (Take what is needed).
  // 4. Non-Reg (0).
  // 5. Additional RRSP.

  // So expected: ~55k RRSP, ~65k TFSA.
  // Let's see.
  
  // Note: performTaxOptimizedWithdrawal logic:
  // Step 2: Fill up to top of 1st Federal Bracket (~$55k) with additional RRSP
  // Step 3: Use Tax-Free accounts (TFSA) for remaining needs
  
  assert(highYear1.withdrawals['rrsp'] >= 55000, 'RRSP fills first bracket');
  assert(highYear1.withdrawals['tfsa'] > 0, 'TFSA used for excess need');
  
  // Actually, if TFSA runs out or isn't enough, it would go back to RRSP.
  // Here TFSA has $100k, need is $65k more. Should cover it.
  // So RRSP total should be around 55k?
  // Let's check if it took more from RRSP.
  // The logic Step 5 is "Additional RRSP".
  // Since TFSA had enough, Step 5 shouldn't be reached.
  
  // However, `bracket1Max` is a constant in code. 55867.
  // assertApprox(highYear1.withdrawals['rrsp'], 55867, 1000, 'RRSP limited to bracket 1'); 
  // Wait, `performTaxOptimizedWithdrawal` takes `targetSpending`. 
  // If `remainingNeed` is satisfied by TFSA, RRSP should stop at bracket top.
  
  // Note: My implementation of `performTaxOptimizedWithdrawal` in `withdrawals.ts`
  // Step 2: `const additionalRRSP = Math.min(roomInBracket1, remainingNeed);`
  // Step 3: TFSA loop.
  // So yes, RRSP is capped at bracket 1 if TFSA exists.
  
}

function runAllTests(): void {
  console.log('\n' + '🧪 RETIREMENT CALCULATOR TESTS (CANADA) '.padEnd(60, '='));
  testTaxCalculations();
  testRRIFCalculations();
  testAccumulation();
  testWithdrawalStrategy();

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`  ✓ Passed: ${passedTests}`);
  console.log(`  ✗ Failed: ${failedTests}`);
  console.log(`  Total: ${passedTests + failedTests}`);
  console.log('='.repeat(60) + '\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests();