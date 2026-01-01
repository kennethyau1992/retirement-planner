import { Profile } from '../types';
import { NumberInput } from './NumberInput';

interface ProfileFormProps {
  profile: Profile;
  onChange: (profile: Profile) => void;
}

const inputClassName = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white";

export function ProfileForm({ profile, onChange }: ProfileFormProps) {
  const handleChange = (field: keyof Profile, value: number | string | boolean | Profile | undefined) => {
    onChange({
      ...profile,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">Personal Information</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Current Age
          </label>
          <NumberInput
            value={profile.currentAge}
            onChange={(val) => handleChange('currentAge', val)}
            min={18}
            max={100}
            defaultValue={35}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Retirement Age
          </label>
          <NumberInput
            value={profile.retirementAge}
            onChange={(val) => handleChange('retirementAge', val)}
            min={18}
            max={100}
            defaultValue={65}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Life Expectancy
          </label>
          <NumberInput
            value={profile.lifeExpectancy}
            onChange={(val) => handleChange('lifeExpectancy', val)}
            min={18}
            max={120}
            defaultValue={120}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filing Status
          </label>
          <select
            value="single"
            disabled
            className={`${inputClassName} bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-500`}
          >
            <option value="single">Individual (Canada)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Provincial Tax Rate (%)
          </label>
          <NumberInput
            value={profile.provinceTaxRate}
            onChange={(val) => handleChange('provinceTaxRate', val)}
            min={0}
            max={25}
            isPercentage
            decimals={1}
            defaultValue={0.10}
            className={inputClassName}
          />
        </div>
      </div>

      <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">Contribution Room & Eligibility</h4>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Annual Pre-Tax Income ($)
            </label>
            <NumberInput
              value={profile.annualIncome || 0}
              onChange={(val) => handleChange('annualIncome', val)}
              min={0}
              defaultValue={0}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Annual Spending ($)
              <span className="text-gray-500 text-xs ml-1" title="Used to calculate remaining cash flow for savings">
                ⓘ
              </span>
            </label>
            <NumberInput
              value={profile.annualSpending || 0}
              onChange={(val) => handleChange('annualSpending', val)}
              min={0}
              defaultValue={0}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="fhsa-toggle"
            type="checkbox"
            checked={profile.isFirstTimeHomeBuyer || false}
            onChange={(e) => handleChange('isFirstTimeHomeBuyer', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="fhsa-toggle" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            I am a First-Time Home Buyer (Eligible for FHSA)
          </label>
        </div>
      </div>

      <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">Government Benefits (CPP & OAS)</h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Annual Benefit (today's $)
            <span className="text-gray-500 text-xs ml-1" title="Estimated combined CPP and OAS benefit in today's dollars">
              ⓘ
            </span>
          </label>
          <NumberInput
            value={profile.cppOasBenefit || 0}
            onChange={(val) => handleChange('cppOasBenefit', val)}
            min={0}
            placeholder="0"
            defaultValue={0}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Age
          </label>
          <NumberInput
            value={profile.cppOasStartAge || 65}
            onChange={(val) => handleChange('cppOasStartAge', val)}
            min={60}
            max={70}
            defaultValue={65}
            className={inputClassName}
          />
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Spouse / Partner</h3>
          <div className="flex items-center">
            <input
              id="spouse-toggle"
              type="checkbox"
              checked={!!profile.spouse}
              onChange={(e) => {
                if (e.target.checked) {
                  // Initialize spouse with defaults
                  handleChange('spouse', {
                    name: 'Spouse',
                    currentAge: profile.currentAge,
                    retirementAge: profile.retirementAge,
                    lifeExpectancy: 120,
                    filingStatus: 'single', // Taxed individually
                    provinceTaxRate: profile.provinceTaxRate,
                    annualIncome: 0,
                    annualSpending: 0,
                    isFirstTimeHomeBuyer: false,
                    cppOasBenefit: 0,
                    cppOasStartAge: 65,
                  });
                } else {
                  handleChange('spouse', undefined);
                }
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="spouse-toggle" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Include Spouse
            </label>
          </div>
        </div>

        {profile.spouse && (
          <div className="space-y-4 pl-4 border-l-2 border-purple-200 dark:border-purple-800">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={profile.spouse.name || 'Spouse'}
                onChange={(e) => handleChange('spouse', { ...profile.spouse!, name: e.target.value })}
                className={inputClassName}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Age
                </label>
                <NumberInput
                  value={profile.spouse.currentAge}
                  onChange={(val) => handleChange('spouse', { ...profile.spouse!, currentAge: val })}
                  min={18}
                  max={100}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Retirement Age
                </label>
                <NumberInput
                  value={profile.spouse.retirementAge}
                  onChange={(val) => handleChange('spouse', { ...profile.spouse!, retirementAge: val })}
                  min={18}
                  max={100}
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Annual Pre-Tax Income ($)
                </label>
                <NumberInput
                  value={profile.spouse.annualIncome || 0}
                  onChange={(val) => handleChange('spouse', { ...profile.spouse!, annualIncome: val })}
                  min={0}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Annual Spending ($)
                </label>
                <NumberInput
                  value={profile.spouse.annualSpending || 0}
                  onChange={(val) => handleChange('spouse', { ...profile.spouse!, annualSpending: val })}
                  min={0}
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="spouse-fhsa"
                type="checkbox"
                checked={profile.spouse.isFirstTimeHomeBuyer || false}
                onChange={(e) => handleChange('spouse', { ...profile.spouse!, isFirstTimeHomeBuyer: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="spouse-fhsa" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                First-Time Home Buyer (Eligible for FHSA)
              </label>
            </div>

            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-2">Government Benefits</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Annual Benefit ($)
                </label>
                <NumberInput
                  value={profile.spouse.cppOasBenefit || 0}
                  onChange={(val) => handleChange('spouse', { ...profile.spouse!, cppOasBenefit: val })}
                  min={0}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Age
                </label>
                <NumberInput
                  value={profile.spouse.cppOasStartAge || 65}
                  onChange={(val) => handleChange('spouse', { ...profile.spouse!, cppOasStartAge: val })}
                  min={60}
                  max={70}
                  className={inputClassName}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}