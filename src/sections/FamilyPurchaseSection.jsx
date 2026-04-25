import { useState } from 'react';
import CurrencyInput from '../components/CurrencyInput';
import InfoTooltip from '../components/InfoTooltip';
import { calcHomeSale, calcMortgageScenario, calcExpenses } from '../utils/calculations';
import { parseCurrency, fmtDollar, fmtPct } from '../utils/format';

const p = parseCurrency;

// ─── Rate toggle options ─────────────────────────────────────────────────────
const RATE_OPTIONS = [
  { key: 'optimistic',  label: 'Best',     field: 'fpRateOptimistic' },
  { key: 'expected',    label: 'Expected', field: 'fpRateExpected' },
  { key: 'pessimistic', label: 'Worst',    field: 'fpRatePessimistic' },
  { key: 'custom',      label: 'Custom',   field: 'fpCustomRate' },
];

// ─── Scenario card ────────────────────────────────────────────────────────────
const ScenarioCard = ({ label, rate, loanAmount, loanTerm, propertyTax, homeInsurance, color, active, onClick }) => {
  const scenario = calcMortgageScenario(
    loanAmount + p(propertyTax) * 0, // purchase price = loan amount for display
    0,                                // no extra down payment (already reflected in loanAmount)
    loanTerm,
    rate,
    0,                                // tax handled separately
    p(homeInsurance),
    0
  );

  // Manual PITI using loanAmount directly
  const monthlyPI = scenario ? scenario.monthlyPI : 0;
  const monthlyTax = p(propertyTax);
  const monthlyIns = p(homeInsurance);
  const totalPITI = monthlyPI + monthlyTax + monthlyIns;

  const colorMap = {
    emerald: {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50',
      header: 'bg-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700',
      ring: 'ring-emerald-400',
    },
    blue: {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      header: 'bg-blue-600',
      badge: 'bg-blue-100 text-blue-700',
      ring: 'ring-blue-400',
    },
    red: {
      border: 'border-red-200',
      bg: 'bg-red-50',
      header: 'bg-red-600',
      badge: 'bg-red-100 text-red-700',
      ring: 'ring-red-400',
    },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 overflow-hidden text-left transition-all ${c.border} ${active ? `ring-2 ${c.ring}` : 'opacity-80 hover:opacity-100'}`}
    >
      <div className={`${c.header} px-4 py-3 text-white`}>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
        <p className="text-2xl font-bold">{rate.toFixed(2)}%</p>
      </div>
      <div className={`${c.bg} px-4 py-3 space-y-2 text-sm`}>
        <div className="flex justify-between">
          <span className="text-slate-500">P&amp;I</span>
          <span className="font-semibold tabular-nums">{fmtDollar(monthlyPI)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Property Tax</span>
          <span className="font-semibold tabular-nums">{fmtDollar(monthlyTax)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Insurance</span>
          <span className="font-semibold tabular-nums">{fmtDollar(monthlyIns)}</span>
        </div>
        <div className={`flex justify-between rounded-lg px-2 py-1 ${c.badge} mt-1`}>
          <span className="font-bold">Total PITI</span>
          <span className="font-bold tabular-nums">{fmtDollar(totalPITI)}</span>
        </div>
      </div>
    </button>
  );
};

// ─── Small result row ─────────────────────────────────────────────────────────
const Row = ({ label, value, highlight, indent, tooltip }) => (
  <div className={`flex items-center justify-between py-2 ${indent ? 'pl-4' : ''} ${highlight ? 'border-t border-slate-200 mt-1 pt-3' : 'border-b border-slate-100'}`}>
    <span className={`text-sm ${highlight ? 'font-semibold text-slate-800' : 'text-slate-600'} flex items-center gap-1`}>
      {label}
      {tooltip && <InfoTooltip text={tooltip} />}
    </span>
    <span className={`text-sm tabular-nums ${highlight ? 'font-bold text-slate-900 text-base' : 'text-slate-700'}`}>{value}</span>
  </div>
);

// "Apr 17, 2025" from "2025-04-17"
const fmtFredDate = (d) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Section ──────────────────────────────────────────────────────────────────
const FamilyPurchaseSection = ({ state, update, updateMultiple, fredRate, fredDate, fredLoading, onFredRefresh }) => {
  const [activeRateKey, setActiveRateKey] = useState('expected');
  const [loanTerm, setLoanTerm] = useState(30);

  const purchasePrice = p(state.fpPurchasePrice);
  const parentLoan    = p(state.fpParentLoan);
  const giftedEquity  = purchasePrice - parentLoan;
  const giftedPct     = purchasePrice > 0 ? (giftedEquity / purchasePrice) * 100 : 0;

  const rateOptimistic  = p(state.fpRateOptimistic);
  const rateExpected    = p(state.fpRateExpected);
  const ratePessimistic = p(state.fpRatePessimistic);
  const rateCustom      = p(state.fpCustomRate);

  const effectiveRate =
    activeRateKey === 'optimistic'  ? rateOptimistic  :
    activeRateKey === 'expected'    ? rateExpected    :
    activeRateKey === 'pessimistic' ? ratePessimistic :
    rateCustom;

  // Monthly P&I for selected rate
  const { calcMonthlyPI } = { calcMonthlyPI: (loan, rate, term) => {
    if (!loan || !rate || !term) return 0;
    const r = rate / 100 / 12;
    const n = term * 12;
    if (r === 0) return loan / n;
    return loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }};

  const monthlyPIOptimistic  = calcMonthlyPI(parentLoan, rateOptimistic,  loanTerm);
  const monthlyPIExpected    = calcMonthlyPI(parentLoan, rateExpected,    loanTerm);
  const monthlyPIPessimistic = calcMonthlyPI(parentLoan, ratePessimistic, loanTerm);

  const monthlyTax = p(state.fpPropertyTax);
  const monthlyIns = p(state.fpHomeInsurance);

  const pitiOptimistic  = monthlyPIOptimistic  + monthlyTax + monthlyIns;
  const pitiExpected    = monthlyPIExpected    + monthlyTax + monthlyIns;
  const pitiPessimistic = monthlyPIPessimistic + monthlyTax + monthlyIns;

  const pitiMap = { optimistic: pitiOptimistic, expected: pitiExpected, pessimistic: pitiPessimistic };
  const effectivePITI =
    activeRateKey === 'custom'
      ? calcMonthlyPI(parentLoan, rateCustom, loanTerm) + monthlyTax + monthlyIns
      : pitiMap[activeRateKey] ?? pitiExpected;

  // Bridge period
  const bridgeMonths  = p(state.fpBridgeMonths);
  const bridgePayment = p(state.fpBridgePayment);
  const bridgeTotal   = bridgeMonths * bridgePayment;

  // NJ proceeds
  const homeSale    = calcHomeSale(state);
  const njProceeds  = homeSale.netProceeds;
  const afterPayoff = njProceeds - parentLoan;
  const afterBridge = afterPayoff - bridgeTotal;

  // Expenses
  const expenses      = calcExpenses(state);
  const netIncome     = p(state.netMonthlyIncome);
  const totalMonthly  = effectivePITI + expenses.totalNonHousing;
  const cashRemaining = netIncome > 0 ? netIncome - totalMonthly : 0;

  return (
    <section id="family-purchase" className="print-section scroll-mt-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-sm font-bold">5</span>
          <h2 className="text-xl font-bold text-slate-800">Family Purchase Scenario</h2>
        </div>
        <p className="text-slate-500 text-sm ml-11">
          Parents buy the home in cash ($600k), you owe them $450k. The $150k difference is a gift of equity.
          Model your informal loan, bridge period, and post-NJ-sale financial picture.
        </p>
      </div>

      <div className="space-y-8">

        {/* ── 1. Gift & Equity ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-purple-50">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden="true">🎁</span>
              <h3 className="font-semibold text-slate-800 text-sm">1 · Gift &amp; Equity Breakdown</h3>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <CurrencyInput
                label="Parents' Purchase Price"
                tooltip="The price parents paid to buy the home in cash."
                value={state.fpPurchasePrice}
                onChange={(v) => update('fpPurchasePrice', v)}
              />
              <CurrencyInput
                label="Amount You Owe Parents (Informal Loan)"
                tooltip="The principal you'll repay to your parents over time."
                value={state.fpParentLoan}
                onChange={(v) => update('fpParentLoan', v)}
              />
            </div>
            {/* Summary */}
            <div className="bg-slate-50 rounded-xl p-4">
              <Row label="Parents' Purchase Price" value={fmtDollar(purchasePrice)} />
              <Row label="Informal Loan to Parents" value={`– ${fmtDollar(parentLoan)}`} />
              <Row
                label="Gift of Equity"
                value={`${fmtDollar(giftedEquity)}  (${fmtPct(giftedPct, 1)})`}
                highlight
                tooltip="The portion of the home value given to you as a gift. Not a debt."
              />
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Gift of equity counts as your down payment for LTV purposes. No PMI with &gt;20% equity.
            </p>
          </div>
        </div>

        {/* ── 2. Loan to Parents — rate scenarios ──────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-blue-50">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden="true">📊</span>
              <h3 className="font-semibold text-slate-800 text-sm">2 · Loan Payment Scenarios</h3>
            </div>
          </div>
          <div className="px-6 py-5 space-y-5">
            {/* Inputs row */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <CurrencyInput
                label="Best Rate (%)"
                suffix="%"
                value={state.fpRateOptimistic}
                onChange={(v) => update('fpRateOptimistic', v)}
              />
              <CurrencyInput
                label="Expected Rate (%)"
                suffix="%"
                value={state.fpRateExpected}
                onChange={(v) => update('fpRateExpected', v)}
              />
              <CurrencyInput
                label="Worst Rate (%)"
                suffix="%"
                value={state.fpRatePessimistic}
                onChange={(v) => update('fpRatePessimistic', v)}
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Loan Term</label>
                <div className="flex rounded-lg border border-slate-300 overflow-hidden text-sm">
                  {[15, 30].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setLoanTerm(yr)}
                      className={`flex-1 py-2 transition-colors ${loanTerm === yr ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {yr} yr
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* FRED live rate attribution */}
            {fredDate && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
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

            {/* Pre-filled tax + insurance */}
            <div className="grid sm:grid-cols-2 gap-3">
              <CurrencyInput
                label="Monthly Property Tax"
                tooltip="Pre-filled based on the home's assessed value. Adjust as needed."
                value={state.fpPropertyTax}
                onChange={(v) => update('fpPropertyTax', v)}
              />
              <CurrencyInput
                label="Monthly Homeowner's Insurance"
                value={state.fpHomeInsurance}
                onChange={(v) => update('fpHomeInsurance', v)}
              />
            </div>

            {/* 3 scenario cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ScenarioCard
                label="Best Case"
                rate={rateOptimistic}
                loanAmount={parentLoan}
                loanTerm={loanTerm}
                propertyTax={state.fpPropertyTax}
                homeInsurance={state.fpHomeInsurance}
                color="emerald"
                active={activeRateKey === 'optimistic'}
                onClick={() => setActiveRateKey('optimistic')}
              />
              <ScenarioCard
                label="Expected"
                rate={rateExpected}
                loanAmount={parentLoan}
                loanTerm={loanTerm}
                propertyTax={state.fpPropertyTax}
                homeInsurance={state.fpHomeInsurance}
                color="blue"
                active={activeRateKey === 'expected'}
                onClick={() => setActiveRateKey('expected')}
              />
              <ScenarioCard
                label="Worst Case"
                rate={ratePessimistic}
                loanAmount={parentLoan}
                loanTerm={loanTerm}
                propertyTax={state.fpPropertyTax}
                homeInsurance={state.fpHomeInsurance}
                color="red"
                active={activeRateKey === 'pessimistic'}
                onClick={() => setActiveRateKey('pessimistic')}
              />
            </div>

            {/* Custom rate */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveRateKey('custom')}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${activeRateKey === 'custom' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}
              >
                Custom Rate
              </button>
              {activeRateKey === 'custom' && (
                <div className="relative w-32">
                  <input
                    type="text" inputMode="decimal"
                    value={state.fpCustomRate}
                    onChange={(e) => update('fpCustomRate', e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="e.g. 7.0"
                    className="w-full border border-slate-300 rounded-lg py-1.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
              )}
            </div>

            {/* Active summary */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
              <p className="text-blue-700 font-semibold mb-2">
                Selected: {RATE_OPTIONS.find(r => r.key === activeRateKey)?.label} @ {effectiveRate.toFixed(2)}% — {loanTerm}-year term
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'P&I',           value: effectivePITI - monthlyTax - monthlyIns },
                  { label: 'Property Tax',  value: monthlyTax },
                  { label: 'Insurance',     value: monthlyIns },
                  { label: 'Total PITI',    value: effectivePITI },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-lg p-2.5 text-center border border-blue-100">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-bold tabular-nums text-slate-800">{fmtDollar(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Bridge Period ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-amber-50">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden="true">🌉</span>
              <h3 className="font-semibold text-slate-800 text-sm">3 · Bridge Period (Before NJ House Closes)</h3>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-slate-500">
              The gap between moving into the family home and receiving NJ sale proceeds.
              During this time you may make voluntary payments to your parents.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <CurrencyInput
                label="Months Until NJ House Closes"
                tooltip="Estimated months until your New Jersey home sale completes and you receive proceeds."
                value={state.fpBridgeMonths}
                onChange={(v) => update('fpBridgeMonths', v)}
              />
              <CurrencyInput
                label="Monthly Payment to Parents (optional)"
                tooltip="Any voluntary monthly payments made to parents before NJ sale closes. Can be $0."
                value={state.fpBridgePayment}
                onChange={(v) => update('fpBridgePayment', v)}
              />
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <Row label={`Bridge Duration`} value={`${bridgeMonths} month${bridgeMonths !== 1 ? 's' : ''}`} />
              <Row label="Monthly Bridge Payment" value={fmtDollar(bridgePayment)} />
              <Row label="Total Bridge Payments" value={fmtDollar(bridgeTotal)} highlight />
            </div>
          </div>
        </div>

        {/* ── 4. NJ Proceeds & Payoff ───────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden="true">💵</span>
              <h3 className="font-semibold text-slate-800 text-sm">4 · NJ Sale Proceeds &amp; Parent Payoff</h3>
            </div>
          </div>
          <div className="px-6 py-5">
            {njProceeds <= 0 ? (
              <p className="text-sm text-slate-400 italic">
                Fill in your Home Sale details in Section 1 to see projected proceeds here.
              </p>
            ) : (
              <>
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <Row
                    label="NJ Net Sale Proceeds"
                    value={fmtDollar(njProceeds)}
                    tooltip="From Section 1 — sale price minus realtor, closing costs, repairs, mortgage balance, and capital gains tax."
                  />
                  <Row label="Less: Bridge Payments Already Made" value={`– ${fmtDollar(bridgeTotal)}`} />
                  <Row label="Less: Parent Loan Payoff ($450k)" value={`– ${fmtDollar(parentLoan)}`} />
                  <Row
                    label="Remaining Cash After Payoff"
                    value={fmtDollar(afterBridge)}
                    highlight
                  />
                </div>
                {afterBridge < 0 && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    ⚠️ NJ proceeds fall <strong>{fmtDollar(Math.abs(afterBridge))}</strong> short of fully repaying the parent loan.
                    Consider a longer bridge period, higher bridge payments, or a lower loan amount.
                  </div>
                )}
                {afterBridge >= 0 && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                    ✅ NJ proceeds cover the full parent payoff with <strong>{fmtDollar(afterBridge)}</strong> remaining as a cash cushion.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── 5. Monthly Budget Snapshot ────────────────────────────────────── */}
        <div className="bg-slate-800 rounded-xl p-5 text-white">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">5 · Monthly Budget Snapshot</h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Best Rate',     piti: pitiOptimistic },
              { label: 'Expected Rate', piti: pitiExpected   },
              { label: 'Worst Rate',    piti: pitiPessimistic },
            ].map(({ label, piti }) => {
              const total    = piti + expenses.totalNonHousing;
              const cash     = netIncome > 0 ? netIncome - total : 0;
              const positive = cash >= 0;
              return (
                <div key={label} className="bg-slate-700 rounded-xl p-4">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">{label}</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-300">PITI</span>
                      <span className="tabular-nums font-medium">{fmtDollar(piti)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Non-housing expenses</span>
                      <span className="tabular-nums font-medium">{fmtDollar(expenses.totalNonHousing)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-600 pt-1.5">
                      <span className="text-slate-300">Total Outflow</span>
                      <span className="tabular-nums font-semibold">{fmtDollar(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Take-home</span>
                      <span className="tabular-nums font-medium">{fmtDollar(netIncome)}</span>
                    </div>
                    <div className={`flex justify-between rounded-lg px-2 py-1.5 mt-1 ${positive ? 'bg-emerald-600' : 'bg-red-600'}`}>
                      <span className="font-bold">{positive ? 'Surplus' : 'Deficit'}</span>
                      <span className="tabular-nums font-bold">{fmtDollar(Math.abs(cash))}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400">
            Take-home income pulled from Section 3 ({fmtDollar(netIncome)}/mo).
            Non-housing expenses pulled from Section 3 ({fmtDollar(expenses.totalNonHousing)}/mo).
          </p>
        </div>

      </div>
    </section>
  );
};

export default FamilyPurchaseSection;
