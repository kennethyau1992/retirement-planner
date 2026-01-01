import { useState, useCallback } from 'react';
import { Account, Profile, Assumptions } from './types';
import { DEFAULT_PROFILE, DEFAULT_ASSUMPTIONS } from './utils/constants';
import { useRetirementCalc } from './hooks/useRetirementCalc';
import { useLocalStorage, useDarkMode } from './hooks/useLocalStorage';
import { Layout } from './components/Layout';
import { AccountList } from './components/AccountList';
import { ProfileForm } from './components/ProfileForm';
import { AssumptionsForm } from './components/AssumptionsForm';
import { SavingsSuggestions } from './components/SavingsSuggestions';
import { SummaryCards } from './components/SummaryCards';
import { ChartAccumulation } from './components/ChartAccumulation';
import { ChartDrawdown } from './components/ChartDrawdown';
import { ChartIncome } from './components/ChartIncome';
import { ChartTax } from './components/ChartTax';
import { ChartComposition } from './components/ChartComposition';
import { MethodologyPanel } from './components/MethodologyPanel';
import { DataTableAccumulation } from './components/DataTableAccumulation';
import { DataTableWithdrawal } from './components/DataTableWithdrawal';
import { calculateAnnualLimits } from './utils/limits';
import { v4 as uuidv4 } from 'uuid';

// Default accounts for demonstration
const createDefaultAccounts = (): Account[] => [
  {
    id: uuidv4(),
    name: 'Group RRSP',
    type: 'rrsp',
    owner: 'primary',
    balance: 0,
    annualContribution: 15000,
    contributionGrowthRate: 0.03,
    returnRate: 0.05,
    employerMatchPercent: 0.5, // 50% match ratio
    matchableSalaryPercent: 0.05, // Up to 5% of salary
    employerMatchLimit: 20000,
  },
  {
    id: uuidv4(),
    name: 'TFSA',
    type: 'tfsa',
    owner: 'primary',
    balance: 0,
    annualContribution: 7000,
    contributionGrowthRate: 0,
    returnRate: 0.05,
  },
  {
    id: uuidv4(),
    name: 'Non-Registered',
    type: 'non_registered',
    owner: 'primary',
    balance: 0,
    annualContribution: 0,
    contributionGrowthRate: 0.03,
    returnRate: 0.05,
  },
];

type TabType = 'accumulation' | 'retirement' | 'summary' | 'methodology';

function App() {
  // Use localStorage for persistence
  const [accounts, setAccounts, resetAccounts] = useLocalStorage<Account[]>(
    'retirement-planner-accounts',
    createDefaultAccounts()
  );
  const [profile, setProfile, resetProfile] = useLocalStorage<Profile>(
    'retirement-planner-profile',
    DEFAULT_PROFILE
  );
  const [assumptions, setAssumptions, resetAssumptions] = useLocalStorage<Assumptions>(
    'retirement-planner-assumptions',
    DEFAULT_ASSUMPTIONS
  );

  // Dark mode
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  // UI state (not persisted)
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [expandedSection, setExpandedSection] = useState<string | null>('accounts');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { accumulation, retirement } = useRetirementCalc(accounts, profile, assumptions);

  const handleAddAccount = (account: Account) => {
    setAccounts(prev => [...prev, account]);
  };

  const handleUpdateAccount = (updatedAccount: Account) => {
    setAccounts(prev =>
      prev.map(acc => (acc.id === updatedAccount.id ? updatedAccount : acc))
    );
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const handleSyncSuggested = useCallback(() => {
    const limits = calculateAnnualLimits(profile);
    setAccounts(prev => {
      let next = [...prev];
      
      const syncAccount = (type: 'rrsp' | 'tfsa' | 'fhsa' | 'non_registered', amount: number, label: string, owner: 'primary' | 'spouse', incomeForMatch?: number) => {
        // Special logic for RRSP to split between Group and Individual
        if (type === 'rrsp' && amount > 0) {
          // 1. Find Group RRSP (Has 'group' in name OR has a match %)
          const groupIndex = next.findIndex(a => 
            a.type === 'rrsp' && 
            (a.owner || 'primary') === owner && 
            (a.name.toLowerCase().includes('group') || (a.employerMatchPercent || 0) > 0)
          );
          
          let remainingRRSP = amount;
          
          if (groupIndex >= 0) {
            const groupAcc = next[groupIndex];
            // Use account settings or defaults: 50% match ratio, 5% salary cap
            const matchRatio = groupAcc.employerMatchPercent || 0.5; 
            const salaryCapPercent = groupAcc.matchableSalaryPercent || 0.05;
            
            // Calculate how much user needs to contribute to max out the match
            // Target 1: Salary * SalaryCapPercent
            const targetFromSalary = (incomeForMatch || 0) * salaryCapPercent;
            
            // Target 2: Dollar Cap (Limit is usually on EMPLOYER portion, so reverse calculate user portion)
            // If employer caps at $3000 and matches 50%, user can put in $6000 to get it.
            const employerDollarCap = groupAcc.employerMatchLimit && groupAcc.employerMatchLimit > 0 
              ? groupAcc.employerMatchLimit 
              : Infinity;
            const targetFromDollarCap = matchRatio > 0 ? employerDollarCap / matchRatio : Infinity;

            const targetUserContribution = Math.min(targetFromSalary, targetFromDollarCap);

            // We contribute up to the target, limited by total available RRSP room
            const groupContribution = Math.min(remainingRRSP, targetUserContribution);
            
            next[groupIndex] = {
              ...groupAcc,
              annualContribution: groupContribution,
              employerMatchPercent: matchRatio,
              matchableSalaryPercent: salaryCapPercent,
              balance: groupAcc.balance || 0
            };
            
            remainingRRSP = Math.max(0, remainingRRSP - groupContribution);
          }
          
          // 2. Put remainder in Individual RRSP
          if (remainingRRSP > 0) {
            // Find account that is explicitly NOT group (no match, no 'group' name)
            const individualIndex = next.findIndex(a => 
              a.type === 'rrsp' && 
              (a.owner || 'primary') === owner && 
              !a.name.toLowerCase().includes('group') && 
              !(a.employerMatchPercent && a.employerMatchPercent > 0)
            );
            
            if (individualIndex >= 0) {
              next[individualIndex] = { 
                ...next[individualIndex], 
                annualContribution: remainingRRSP, 
                balance: next[individualIndex].balance || 0 
              };
            } else {
              next.push({
                id: uuidv4(),
                name: `Individual RRSP (${owner === 'primary' ? 'Primary' : 'Spouse'})`,
                type: 'rrsp',
                owner: owner,
                balance: 0,
                annualContribution: remainingRRSP,
                contributionGrowthRate: 0.03,
                returnRate: 0.07,
              });
            }
          }
          return;
        }

        // Standard logic for other accounts
        const existingIndex = next.findIndex(a => a.type === type && (a.owner || 'primary') === owner);
        if (existingIndex >= 0) {
          next[existingIndex] = { 
            ...next[existingIndex], 
            annualContribution: amount,
            balance: next[existingIndex].balance || 0
          };
        } else if (amount > 0) {
          next.push({
            id: uuidv4(),
            name: `${label} (${owner === 'primary' ? 'Primary' : 'Spouse'})`,
            type: type,
            owner: owner,
            balance: 0,
            annualContribution: amount,
            contributionGrowthRate: 0.03,
            returnRate: 0.07,
          });
        }
      };

      // Sync Primary
      syncAccount('fhsa', limits.fhsa, 'FHSA', 'primary'); 
      syncAccount('tfsa', limits.tfsa, 'TFSA', 'primary'); 
      syncAccount('rrsp', limits.rrsp, 'RRSP', 'primary', profile.annualIncome); 
      syncAccount('non_registered', limits.nonRegistered, 'Non-Registered', 'primary');

      // Sync Spouse
      if (profile.spouse && limits.spouse) {
        syncAccount('fhsa', limits.spouse.fhsa, 'FHSA', 'spouse');
        syncAccount('tfsa', limits.spouse.tfsa, 'TFSA', 'spouse');
        syncAccount('rrsp', limits.spouse.rrsp, 'RRSP', 'spouse', profile.spouse.annualIncome);
        syncAccount('non_registered', limits.spouse.nonRegistered, 'Non-Registered', 'spouse');
      }

      return next;
    });
    setExpandedSection('accounts');
  }, [profile, setAccounts]);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => (prev === section ? null : section));
  };

  const handleReset = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const confirmReset = useCallback(() => {
    resetAccounts();
    resetProfile();
    resetAssumptions();
    setShowResetConfirm(false);
    // Force reload to get fresh default accounts with new UUIDs
    window.location.reload();
  }, [resetAccounts, resetProfile, resetAssumptions]);

  const cancelReset = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'accumulation', label: 'Accumulation Phase' },
    { id: 'retirement', label: 'Retirement Phase' },
    { id: 'methodology', label: 'Methodology' },
  ];

  return (
    <Layout
      isDarkMode={isDarkMode}
      onToggleDarkMode={toggleDarkMode}
      onReset={handleReset}
    >
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Reset All Data?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This will clear all your saved accounts, profile settings, and assumptions.
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Inputs */}
        <div className="lg:col-span-1 space-y-4">
          {/* Accounts Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('accounts')}
              className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg"
            >
              <span className="font-medium text-gray-900 dark:text-white">Investment Accounts</span>
              <svg
                className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                  expandedSection === 'accounts' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSection === 'accounts' && (
              <div className="px-4 pb-4">
                <AccountList
                  accounts={accounts}
                  hasSpouse={!!profile.spouse}
                  onAdd={handleAddAccount}
                  onUpdate={handleUpdateAccount}
                  onDelete={handleDeleteAccount}
                />
              </div>
            )}
          </div>

          {/* Profile Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('profile')}
              className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg"
            >
              <span className="font-medium text-gray-900 dark:text-white">Personal Profile</span>
              <svg
                className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                  expandedSection === 'profile' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSection === 'profile' && (
              <div className="px-4 pb-4 space-y-4">
                <ProfileForm profile={profile} onChange={setProfile} />
                <SavingsSuggestions profile={profile} onSync={handleSyncSuggested} />
              </div>
            )}
          </div>

          {/* Assumptions Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('assumptions')}
              className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg"
            >
              <span className="font-medium text-gray-900 dark:text-white">Economic Assumptions</span>
              <svg
                className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                  expandedSection === 'assumptions' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSection === 'assumptions' && (
              <div className="px-4 pb-4">
                <AssumptionsForm assumptions={assumptions} onChange={setAssumptions} />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Charts and Results */}
        <div className="lg:col-span-2 space-y-6">
          {accounts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <svg
                className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Accounts Added</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Add investment accounts to see your retirement projections.
              </p>
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Summary Tab */}
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  <SummaryCards
                    profile={profile}
                    assumptions={assumptions}
                    accumulationResult={accumulation}
                    retirementResult={retirement}
                  />

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Portfolio Composition at Retirement
                    </h3>
                    <ChartComposition accounts={accounts} result={accumulation} isDarkMode={isDarkMode} />
                  </div>
                </div>
              )}

              {/* Accumulation Tab */}
              {activeTab === 'accumulation' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Account Growth (Age {profile.currentAge} to {profile.retirementAge})
                    </h3>
                    <ChartAccumulation accounts={accounts} result={accumulation} isDarkMode={isDarkMode} />
                  </div>

                  <DataTableAccumulation accounts={accounts} result={accumulation} />

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Portfolio Composition at Retirement
                    </h3>
                    <ChartComposition accounts={accounts} result={accumulation} isDarkMode={isDarkMode} />
                  </div>
                </div>
              )}

              {/* Retirement Tab */}
              {activeTab === 'retirement' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Portfolio Drawdown (Age {profile.retirementAge} to {profile.lifeExpectancy})
                    </h3>
                    <ChartDrawdown accounts={accounts} result={retirement} isDarkMode={isDarkMode} />
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Annual Retirement Income
                    </h3>
                    <ChartIncome result={retirement} isDarkMode={isDarkMode} />
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Tax Burden Over Time
                    </h3>
                    <ChartTax result={retirement} isDarkMode={isDarkMode} />
                  </div>

                  <DataTableWithdrawal accounts={accounts} result={retirement} />
                </div>
              )}

              {/* Methodology Tab */}
              {activeTab === 'methodology' && (
                <MethodologyPanel profile={profile} assumptions={assumptions} />
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default App;
