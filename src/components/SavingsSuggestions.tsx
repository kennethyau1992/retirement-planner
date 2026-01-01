import { Profile } from '../types';
import { calculateAnnualLimits, ContributionLimits } from '../utils/limits';

interface SavingsSuggestionsProps {
  profile: Profile;
  onSync: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
}

function LimitBar({ label, value, colorClass, bgClass, maxLimit }: { label: string, value: number, colorClass: string, bgClass: string, maxLimit?: number }) {
  if (value <= 0 && (!maxLimit || maxLimit <= 0)) return null;
  
  const width = maxLimit && maxLimit > 0 ? Math.min(100, (value / maxLimit) * 100) : 100;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={`font-medium ${colorClass}`}>{label}</span>
        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(value)}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className={`${bgClass} h-2 rounded-full`} style={{ width: `${width}%` }}></div>
      </div>
    </div>
  );
}

function PersonSection({ name, limits, isSpouse = false }: { name: string, limits: ContributionLimits, isSpouse?: boolean }) {
  return (
    <div className={isSpouse ? "mt-4 pt-4 border-t border-gray-200 dark:border-gray-700" : ""}>
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">{name}</h4>
      
      {/* Budget Breakdown */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2 mb-3 text-xs space-y-1">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Gross Income:</span>
          <span>{formatCurrency(limits.grossIncome)}</span>
        </div>
        <div className="flex justify-between text-red-600 dark:text-red-400">
          <span>Federal Tax:</span>
          <span>-{formatCurrency(limits.federalTax)}</span>
        </div>
        <div className="flex justify-between text-red-600 dark:text-red-400">
          <span>Provincial Tax:</span>
          <span>-{formatCurrency(limits.provincialTax)}</span>
        </div>
        <div className="flex justify-between text-orange-600 dark:text-orange-400">
          <span>CPP/EI:</span>
          <span>-{formatCurrency(limits.cppEi)}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 pb-1">
          <span>Spending:</span>
          <span>-{formatCurrency(limits.annualSpending)}</span>
        </div>
        <div className="flex justify-between font-medium text-gray-900 dark:text-white pt-1">
          <span>Available to Save:</span>
          <span>{formatCurrency(limits.availableSavings)}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <LimitBar 
          label="FHSA" 
          value={limits.fhsa} 
          colorClass="text-purple-600 dark:text-purple-400" 
          bgClass="bg-purple-600" 
        />
        <LimitBar 
          label="TFSA" 
          value={limits.tfsa} 
          colorClass="text-green-600 dark:text-green-400" 
          bgClass="bg-green-600" 
        />
        <LimitBar 
          label="RRSP" 
          value={limits.rrsp} 
          colorClass="text-blue-600 dark:text-blue-400" 
          bgClass="bg-blue-600" 
        />
        <LimitBar 
          label="Non-Registered" 
          value={limits.nonRegistered} 
          colorClass="text-amber-600 dark:text-amber-400" 
          bgClass="bg-amber-600" 
        />
        
        <div className="pt-2 flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total Savings</span>
          <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(limits.total)}</span>
        </div>
      </div>
    </div>
  );
}

export function SavingsSuggestions({ profile, onSync }: SavingsSuggestionsProps) {
  const limits = calculateAnnualLimits(profile);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Recommended Savings
          </h3>
        </div>
        <button
          onClick={onSync}
          className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800 transition-colors"
          title="Create or update accounts with these contribution amounts"
        >
          Apply to Accounts
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Based on your income and spending, we suggest prioritizing registered accounts (FHSA, RRSP, TFSA) before non-registered savings.
      </p>

      <PersonSection name={profile.name || 'Primary'} limits={limits} />
      
      {profile.spouse && limits.spouse && (
        <PersonSection name={profile.spouse.name || 'Spouse'} limits={limits.spouse} isSpouse />
      )}
    </div>
  );
}