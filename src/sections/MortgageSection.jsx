import CurrencyInput from '../components/CurrencyInput';
import InfoTooltip from '../components/InfoTooltip';
import { calcMortgageScenario } from '../utils/calculations';
import { parseCurrency } from '../utils/format';
import { fmtDollar, fmtPct } from '../utils/format';

const SCENARIOS = [
  { key: 'Optimistic', rateField: 'rateOptimistic', color: 'emerald', label: 'Optimistic' },
  { key: 'Expected',   rateField: 'rateExpected',   color: 'blue',    label: 'Expected' },
  { key: 'Pessimistic',rateField: 'ratePessimistic', color: 'red',    label: 'Pessimistic' },
];

const colorMap = {
  emerald: {
    header: 'bg-emerald-600 text-white',
    badge: 'bg-emerald-100 text-emerald-700',
    accent: 'text-emerald-700',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
  },
  blue: {
    header: 'bg-blue-600 text-white',
    badge: 'bg-blue-100 text-blue-700',
    accent: 'text-blue-700',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
  },
  red: {
    header: 'bg-red-500 text-white',
    badge: 'bg-red-100 text-red-700',
    accent: 'text-red-700',
    border: 'border-red-200',
    bg: 'bg-red-50',
  },
};

const ScenarioCard = ({ scenario, calc, rate, color }) => {
  const c = colorMap[color];
  if (!calc) return (
    <div className={`rounded-xl border ${c.border} overflow-hidden flex-1 min-w-0`}>
      <div className={`px-4 py-3 ${c.header}`}>
        <p className="font-semibold text-sm">{scenario}</p>
        <p className="text-xs opacity-80">{rate ? fmtPct(rate, 2) : '—'}</p>
      </div>
      <div className="p-4 text-center text-slate-300 text-sm py-10">
        Enter purchase details above
      </div>
    </div>
  );

  return (
    <div className={`rounded-xl border ${c.border} overflow-hidden flex-1 min-w-0`}>
      <div className={`px-4 py-3 ${c.header}`}>
        <p className="font-semibold text-sm">{scenario}</p>
        <p className="text-xs opacity-80">{fmtPct(rate, 2)} interest rate</p>
      </div>
      <div className="p-4 space-y-3">
        {/* PITI callout */}
        <div className={`rounded-lg ${c.bg} ${c.border} border p-3 text-center`}>
          <p className="text-xs text-slate-500 mb-0.5">Monthly PITI</p>
          <p className={`text-2xl font-bold tabular-nums ${c.accent}`}>
            {fmtDollar(calc.monthlyPITI)}
          </p>
          <p className="text-xs text-slate-400">full monthly payment</p>
        </div>

        {/* Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Principal & Interest</span>
            <span className="font-medium tabular-nums">{fmtDollar(calc.monthlyPI)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Property Tax</span>
            <span className="font-medium tabular-nums">{fmtDollar(calc.monthlyTax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Homeowners Insurance</span>
            <span className="font-medium tabular-nums">{fmtDollar(calc.monthlyInsurance)}</span>
          </div>
          {calc.needsPMI && (
            <div className="flex justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                PMI
                <InfoTooltip text="Private Mortgage Insurance at 0.75% annually. Auto-drops when loan balance reaches 80% of home value." />
              </span>
              <span className="font-medium tabular-nums text-amber-600">{fmtDollar(calc.monthlyPMI)}</span>
            </div>
          )}
          {calc.monthlyHOA > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">HOA Fees</span>
              <span className="font-medium tabular-nums">{fmtDollar(calc.monthlyHOA)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Loan Amount</span>
            <span className="font-medium tabular-nums">{fmtDollar(calc.loanAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Down Payment %</span>
            <span className={`font-medium tabular-nums ${calc.downPaymentPct < 20 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {fmtPct(calc.downPaymentPct, 1)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Interest Paid</span>
            <span className="font-medium tabular-nums text-slate-700">{fmtDollar(calc.totalInterest)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Cost of Loan</span>
            <span className="font-medium tabular-nums">{fmtDollar(calc.totalCost)}</span>
          </div>
        </div>

        {/* PMI badge */}
        {calc.needsPMI && calc.pmiDropYear && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs">
            <span className="font-semibold text-amber-700">PMI drops in ~{calc.pmiDropYear} yr{calc.pmiDropYear !== 1 ? 's' : ''}</span>
            <span className="text-amber-600"> (month {calc.pmiDropMonth})</span>
            <p className="text-amber-500 mt-0.5">Monthly savings: {fmtDollar(calc.monthlyPMI)} when eliminated</p>
          </div>
        )}
        {!calc.needsPMI && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-xs text-emerald-700 font-medium text-center">
            No PMI — down payment ≥ 20%
          </div>
        )}
      </div>
    </div>
  );
};

// "Apr 17, 2025" from "2025-04-17"
const fmtFredDate = (d) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const MortgageSection = ({ state, update, updateMultiple, fredRate, fredDate, fredLoading, onFredRefresh }) => {
  const purchasePrice = parseCurrency(state.purchasePrice);
  const downPayment = parseCurrency(state.downPayment);
  const loanTerm = parseInt(state.loanTerm) || 30;
  const propertyTaxRate = parseCurrency(state.propertyTaxRate);
  const homeInsurance = parseCurrency(state.homeInsurance);
  const hoaFees = parseCurrency(state.hoaFees);

  const scenarios = SCENARIOS.map((s) => {
    const rate = parseCurrency(state[s.rateField]);
    const calc = calcMortgageScenario(purchasePrice, downPayment, loanTerm, rate, propertyTaxRate, homeInsurance, hoaFees);
    return { ...s, rate, calc };
  });

  const handleDownPaymentChange = (v) => {
    updateMultiple({ downPayment: v, downPaymentManual: true });
  };

  return (
    <section id="mortgage" className="print-section scroll-mt-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">2</span>
          <h2 className="text-xl font-bold text-slate-800">Mortgage Rate Scenarios</h2>
        </div>
        <p className="text-slate-500 text-sm ml-11">Compare how different rates affect your monthly payment side by side.</p>
      </div>

      {/* Inputs row */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Purchase Details</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <CurrencyInput
            label="New Home Purchase Price"
            value={state.purchasePrice}
            onChange={(v) => update('purchasePrice', v)}
            placeholder="650,000"
          />
          <div>
            <CurrencyInput
              label="Down Payment"
              tooltip="Auto-populated from your net sale proceeds. Override to test different scenarios."
              value={state.downPayment}
              onChange={handleDownPaymentChange}
              placeholder="100,000"
            />
            {state.downPaymentManual && (
              <button
                onClick={() => updateMultiple({ downPaymentManual: false })}
                className="text-xs text-blue-500 hover:text-blue-700 mt-1"
              >
                Reset to sale proceeds
              </button>
            )}
          </div>
          <CurrencyInput
            label="Property Tax Rate"
            tooltip="Annual property tax as a % of home value. Check your county assessor's website."
            value={state.propertyTaxRate}
            onChange={(v) => update('propertyTaxRate', v)}
            prefix=""
            suffix="%"
            placeholder="1.2"
          />
          <CurrencyInput
            label="Monthly Homeowners Insurance"
            tooltip="Enter your estimated monthly insurance premium. Typically $100–$200/mo for a median home."
            value={state.homeInsurance}
            onChange={(v) => update('homeInsurance', v)}
            placeholder="150"
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Loan term toggle */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Loan Term</label>
            <div className="flex rounded-lg overflow-hidden border border-slate-300">
              {[30, 15].map((term) => (
                <button
                  key={term}
                  onClick={() => update('loanTerm', term)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    state.loanTerm === term
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {term}-year
                </button>
              ))}
            </div>
          </div>

          <CurrencyInput
            label="Optimistic Rate"
            tooltip="The best rate you might qualify for in favorable conditions."
            value={state.rateOptimistic}
            onChange={(v) => update('rateOptimistic', v)}
            prefix=""
            suffix="%"
            placeholder="6.0"
          />
          <CurrencyInput
            label="Expected Rate"
            tooltip="Your most realistic expectation based on current market conditions."
            value={state.rateExpected}
            onChange={(v) => update('rateExpected', v)}
            prefix=""
            suffix="%"
            placeholder="6.75"
          />
          <CurrencyInput
            label="Pessimistic Rate"
            tooltip="A higher rate scenario to stress-test your budget."
            value={state.ratePessimistic}
            onChange={(v) => update('ratePessimistic', v)}
            prefix=""
            suffix="%"
            placeholder="7.5"
          />
        </div>

        {/* FRED live rate attribution */}
        {fredDate && (
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>Source: FRED · Updated {fmtFredDate(fredDate)}</span>
            <span className="text-slate-200">·</span>
            <button
              type="button"
              onClick={onFredRefresh}
              disabled={fredLoading}
              className="flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 hover:border-slate-300 hover:text-slate-600 transition-colors disabled:opacity-40"
            >
              <svg
                className={`w-3 h-3 ${fredLoading ? 'animate-spin' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <CurrencyInput
            label="Monthly HOA Fees (optional)"
            tooltip="Monthly homeowner association dues for the new property."
            value={state.hoaFees}
            onChange={(v) => update('hoaFees', v)}
            placeholder="0"
          />
        </div>
      </div>

      {/* Scenario cards */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {scenarios.map(({ key, color, label, rate, calc }) => (
          <ScenarioCard key={key} scenario={label} calc={calc} rate={rate} color={color} />
        ))}
      </div>

      {/* Comparison table */}
      {scenarios.some(s => s.calc) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-700">Side-by-Side Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-6 text-slate-500 font-medium">Metric</th>
                  {scenarios.map(s => (
                    <th key={s.key} className="text-right py-3 px-6 font-semibold text-slate-700">{s.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Interest Rate', fmt: (c, s) => fmtPct(s.rate, 2) },
                  { label: 'Monthly P&I', fmt: (c) => c ? fmtDollar(c.monthlyPI) : '—' },
                  { label: 'Property Tax', fmt: (c) => c ? fmtDollar(c.monthlyTax) : '—' },
                  { label: 'Insurance', fmt: (c) => c ? fmtDollar(c.monthlyInsurance) : '—' },
                  { label: 'PMI', fmt: (c) => c ? (c.needsPMI ? fmtDollar(c.monthlyPMI) : 'None') : '—' },
                  { label: 'Monthly PITI', fmt: (c) => c ? fmtDollar(c.monthlyPITI) : '—', bold: true },
                  { label: 'Total Interest', fmt: (c) => c ? fmtDollar(c.totalInterest) : '—' },
                  { label: 'Total Loan Cost', fmt: (c) => c ? fmtDollar(c.totalCost) : '—' },
                ].map(({ label, fmt, bold }) => (
                  <tr key={label} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className={`py-3 px-6 text-slate-600 ${bold ? 'font-semibold text-slate-800' : ''}`}>{label}</td>
                    {scenarios.map(s => (
                      <td key={s.key} className={`py-3 px-6 text-right tabular-nums ${bold ? 'font-bold text-slate-800' : 'font-medium'}`}>
                        {fmt(s.calc, s)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default MortgageSection;
