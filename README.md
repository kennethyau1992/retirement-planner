# Retirement Planner

A comprehensive retirement planning calculator that projects portfolio growth, simulates tax-optimized withdrawals, and visualizes your financial future through retirement.

## Features

### Portfolio Management
- **Multiple Account Types**: Support for Traditional 401(k), Roth 401(k), Traditional IRA, Roth IRA, Taxable Brokerage, and HSA accounts
- **Employer Matching**: Configure employer match percentage and limits for 401(k) accounts
- **Individual Returns**: Set expected return rates per account
- **Contribution Growth**: Model salary increases affecting future contributions

### Retirement Projections
- **Accumulation Phase**: Project portfolio growth from now until retirement with compound interest and contributions
- **Withdrawal Phase**: Simulate retirement spending with tax-optimized withdrawal strategies
- **Social Security Integration**: Include Social Security benefits starting at your chosen age
- **Inflation Adjustment**: All projections account for inflation over time

### Tax-Optimized Withdrawals
The withdrawal algorithm follows a tax-efficient strategy:
1. **Required Minimum Distributions (RMDs)**: Mandatory withdrawals from traditional accounts starting at age 73
2. **Tax Bracket Optimization**: Fill lower tax brackets with traditional withdrawals
3. **Roth Withdrawals**: Tax-free withdrawals for remaining needs
4. **Taxable Account Withdrawals**: With capital gains tracking
5. **HSA**: Used last, tax-free for qualified medical expenses

### Tax Calculations
- 2024 Federal income tax brackets (Single and Married Filing Jointly)
- Long-term capital gains rates with 0%/15%/20% brackets
- State tax rate configuration
- Standard deduction applied automatically
- Social Security taxation (85% taxable)

### Visualizations
- **Accumulation Chart**: Stacked area chart showing portfolio growth by account
- **Drawdown Chart**: Portfolio balance through retirement years
- **Income Chart**: Annual retirement income breakdown (withdrawals, Social Security, taxes)
- **Tax Chart**: Tax burden over time
- **Composition Chart**: Pie chart of portfolio allocation by tax treatment

### User Experience
- **Dark Mode**: Toggle between light and dark themes
- **Data Persistence**: All data saved to localStorage automatically
- **Reset Function**: Clear all data and start fresh
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS v4** for styling
- **Recharts** for data visualization
- **UUID** for unique account identifiers

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd retirement-planner

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Docker

```bash
# Build and start in production mode
docker compose up -d --build

# Stop and remove container
docker compose down

# View logs
docker compose logs -f
```

The app will be available at `http://localhost`.

## Project Structure

```
src/
├── components/           # React components
│   ├── AccountForm.tsx      # Form for adding/editing accounts
│   ├── AccountList.tsx      # List of investment accounts
│   ├── AssumptionsForm.tsx  # Economic assumptions input
│   ├── ChartAccumulation.tsx # Portfolio growth chart
│   ├── ChartComposition.tsx  # Pie chart of allocations
│   ├── ChartDrawdown.tsx     # Retirement drawdown chart
│   ├── ChartIncome.tsx       # Retirement income chart
│   ├── ChartTax.tsx          # Tax burden chart
│   ├── Layout.tsx            # App layout with header/footer
│   ├── ProfileForm.tsx       # Personal information form
│   └── SummaryCards.tsx      # Key metrics display
├── hooks/
│   ├── useLocalStorage.ts    # localStorage persistence hook
│   └── useRetirementCalc.ts  # Main calculation orchestrator
├── types/
│   └── index.ts              # TypeScript type definitions
├── utils/
│   ├── constants.ts          # Tax brackets, RMD tables, defaults
│   ├── projections.ts        # Accumulation phase calculations
│   ├── taxes.ts              # Tax calculation functions
│   └── withdrawals.ts        # Withdrawal phase simulation
├── tests/
│   └── calculations.test.ts  # Comprehensive math tests
├── App.tsx                   # Main application component
├── index.css                 # Tailwind CSS configuration
└── main.tsx                  # Application entry point
```

## How It Works

### Accumulation Phase
For each year until retirement:
1. Apply investment returns to existing balance
2. Add annual contribution (with employer match if applicable)
3. Grow contribution amount by contribution growth rate

### Withdrawal Phase
For each year of retirement:
1. Calculate Required Minimum Distribution (if age 73+)
2. Determine target spending (safe withdrawal rate + inflation)
3. Subtract Social Security income from spending need
4. Withdraw from accounts in tax-optimized order
5. Apply investment returns to remaining balance
6. Calculate federal and state taxes

### Key Assumptions
- Investment returns are applied annually
- Contributions are made at year-end
- RMDs follow the IRS Uniform Lifetime Table
- Social Security benefits grow with inflation
- Tax brackets are 2024 values (not inflation-adjusted)

## Configuration

### Default Values
| Setting | Default |
|---------|---------|
| Current Age | 35 |
| Retirement Age | 65 |
| Life Expectancy | 90 |
| Inflation Rate | 3% |
| Safe Withdrawal Rate | 4% |
| Retirement Return Rate | 5% |
| Social Security Benefit | $30,000/year |
| Social Security Start Age | 67 |

### Account Defaults
| Setting | Default |
|---------|---------|
| Expected Return | 7% |
| Contribution Growth | 3% |

## Testing

The project includes comprehensive tests for all calculations:

```bash
npm test
```

Tests cover:
- Federal and state tax calculations
- Capital gains taxation
- RMD calculations
- Accumulation phase projections
- Withdrawal phase simulations
- Edge cases (zero balances, long retirements, etc.)

## Disclaimer

This tool provides estimates only and should not be considered financial advice. Tax laws change frequently, and individual circumstances vary. Consult a qualified financial advisor for personalized retirement planning.

## License

MIT
