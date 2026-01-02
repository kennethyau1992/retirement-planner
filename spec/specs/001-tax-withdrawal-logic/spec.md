# Specification: Document existing Tax-Optimized Withdrawal Strategy logic

## 1. Overview
The Retirement Planner implements a specific "Tax-Optimized Withdrawal Strategy" to extend portfolio longevity. This strategy intelligently sources funds from different account types (RRSP/RRIF, TFSA, Taxable) to minimize tax liability in any given year. This specification documents the existing logic found in the codebase to serve as a baseline for future changes.

## 2. User Scenarios
### 2.1. Retirement Income Simulation
**Actor**: User (Pre-retiree or Retiree)
**Trigger**: Views the "Retirement Projections" or "Yearly Details" tab.
**Preconditions**:
- User has entered account balances (RRSP, TFSA, Taxable).
- User has defined retirement age and life expectancy.
- "Safe Withdrawal Rate" and "Inflation" assumptions are set.
**Flow**:
1. System calculates the annual "Target Spending" based on portfolio size at retirement * Safe Withdrawal Rate.
2. For each year of retirement:
   - System calculates fixed income (CPP/OAS).
   - System determines "Remaining Need" = Target Spending - Fixed Income.
   - System withdraws funds from accounts in a specific order to minimize taxes (RRIF Minimums -> Bracket Fill -> TFSA -> Taxable -> Excess RRSP).
   - Taxes are calculated (Federal + Provincial).
   - Balances are updated with investment returns.
3. User sees the "After-Tax Income" and "Portfolio Longevity" (depletion age).

### 2.2. Tax Analysis
**Actor**: User
**Flow**:
1. User views the "Taxes" chart.
2. System displays the breakdown of Federal vs. Provincial taxes paid each year.
3. User verifies that taxes are lower in early years due to the optimization strategy (blending TFSA/RRSP).

## 3. Functional Requirements

### 3.1. Withdrawal Priority Order
The system MUST withdraw funds in the following strict order for each year:
1.  **Mandatory RRIF Withdrawals**:
    -   Convert all RRSP balances to RRIF logic (conceptually).
    -   Withdraw the legal minimum based on age (using `getRRIFFactor`).
    -   This amount is taxable ordinary income.
2.  **Federal Bracket Filling (RRSP/RRIF)**:
    -   If the mandatory withdrawal is *below* the top of the first Federal Tax Bracket (~$53k-$55k), withdraw additional funds from RRSP/RRIF.
    -   **Goal**: "Fill" the lowest tax bracket with fully taxable income while rates are low.
    -   **Constraint**: Stop exactly at the bracket threshold to avoid jumping to the next marginal rate.
    -   **Household Logic**: If a spouse exists, the target bracket room is doubled (simulating income splitting or dual-incomes).
3.  **Tax-Free Accounts (TFSA)**:
    -   If spending needs are still unmet, withdraw from Tax-Free accounts.
    -   **Goal**: Satisfy spending without increasing taxable income (to keep it in the lowest bracket).
4.  **Taxable Accounts (Non-Registered)**:
    -   If spending needs are still unmet, withdraw from Taxable accounts.
    -   **Capital Gains**: Calculate the "Gain" portion of the withdrawal based on Cost Basis.
    -   **Inclusion Rate**: Include 50% of the gain as taxable income.
5.  **Excess RRSP/RRIF**:
    -   If spending needs are *still* unmet (TFSA and Taxable are empty), withdraw remaining need from RRSP/RRIF.
    -   **Consequence**: This income will be taxed at higher marginal rates (bracket 2+).

### 3.2. Tax Calculations (Canada/Ontario)
The system MUST calculate taxes on the total withdrawn income + CPP/OAS:
1.  **Income Classification**:
    -   *Ordinary Income*: RRSP withdrawals, CPP, OAS.
    -   *Capital Gains*: 50% of realized gains from Taxable accounts.
2.  **Federal Tax**:
    -   Apply 2024 Federal Brackets.
    -   Subtract "Basic Personal Amount" (BPA) tax credit.
3.  **Provincial Tax (Ontario Model)**:
    -   Apply Provincial Brackets.
    -   Subtract Provincial BPA credit.
    -   **Surtaxes**: Apply Ontario Surtax 1 (20% of tax > threshold) and Surtax 2 (36% of tax > threshold).
    -   **Health Premium**: Apply Ontario Health Premium based on taxable income tiers (up to ~$900).

### 3.3. Inflation & Returns
1.  **Inflation**: "Target Spending" and "CPP/OAS Benefits" must grow by the `inflationRate` assumption each year.
2.  **Returns**: Investment returns (`retirementReturnRate`) are applied to the *remaining* balance at the end of the year (after withdrawals).

## 4. Success Criteria
-   **Verification**: The logic matches the existing TypeScript implementation in `src/utils/withdrawals.ts` and `taxes.ts`.
-   **Test Coverage**: Existing tests in `src/tests/calculations.test.ts` pass.
-   **Outcome**: The "Depletion Age" calculated by this logic is greater than or equal to a naive strategy (e.g., "Spend all RRSP first"), demonstrating the "optimization" value.

## 5. Assumptions & Constraints
-   **Geography**: Tax logic is hardcoded for **Canada (Federal) + Ontario (Provincial)**.
-   **Bracket Indexing**: Tax brackets are static (2024 values) and do *not* inflate, while spending *does* inflate (conservative assumption).
-   **Income Splitting**: The logic assumes perfect utilization of both spouses' tax brackets (effectively full income splitting) for the "Bracket Fill" step.
-   **Cost Basis**: For taxable accounts without history, the system assumes 50% of the initial balance is "Growth" (unrealized gains) for tax estimates.
