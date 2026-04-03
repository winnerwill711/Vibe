import CurrencyInput from '../components/CurrencyInput';
import InfoTooltip from '../components/InfoTooltip';
import { calcHomeSale } from '../utils/calculations';
import { fmtDollar, fmtPct } from '../utils/format';

const SectionCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const ResultRow = ({ label, value, isDeduction, isTotal, tooltip }) => (
  <div className={`flex items-center justify-between py-2.5 ${isTotal ? 'border-t-2 border-slate-300 mt-1 pt-3' : 'border-b border-slate-100'}`}>
    <span className={`text-sm flex items-center gap-1.5 ${isTotal ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
      {isDeduction && <span className="text-red-400 text-xs">−</span>}
      {label}
      {tooltip && <InfoTooltip text={tooltip} />}
    </span>
    <span className={`text-sm font-semibold tabular-nums ${
      isTotal
        ? value >= 0 ? 'text-emerald-600 text-base' : 'text-red-600 text-base'
        : isDeduction ? 'text-red-600' : 'text-slate-800'
    }`}>
      {isDeduction ? `(${fmtDollar(value)})` : fmtDollar(value)}
    </span>
  </div>
);

const HomeSaleSection = ({ state, update }) => {
  const calc = calcHomeSale(state);
  const hasData = calc.salePrice > 0;

  return (
    <section id="home-sale" className="print-section scroll-mt-6">
      {/* Section header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">1</span>
          <h2 className="text-xl font-bold text-slate-800">Home Sale Calculator</h2>
        </div>
        <p className="text-slate-500 text-sm ml-11">See exactly how much money you walk away with after selling.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Inputs ── */}
        <SectionCard className="p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Sale Details</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <CurrencyInput
              label="Estimated Sale Price"
              tooltip="Your best estimate of what the home will sell for."
              value={state.salePrice}
              onChange={(v) => update('salePrice', v)}
              placeholder="500,000"
            />
            <CurrencyInput
              label="Remaining Mortgage Balance"
              tooltip="What you still owe on your current mortgage."
              value={state.mortgageBalance}
              onChange={(v) => update('mortgageBalance', v)}
              placeholder="200,000"
            />
            <CurrencyInput
              label="Original Purchase Price"
              tooltip="Used to calculate capital gains. Leave blank to skip capital gains calculation."
              value={state.originalPurchasePrice}
              onChange={(v) => update('originalPurchasePrice', v)}
              placeholder="250,000"
            />
            <CurrencyInput
              label="Realtor Commission"
              tooltip="Typically 5–6% split between buyer's and seller's agents."
              value={state.realtorCommission}
              onChange={(v) => update('realtorCommission', v)}
              prefix=""
              suffix="%"
              placeholder="5.5"
            />
            <CurrencyInput
              label="Seller Closing Costs"
              tooltip="Title insurance, transfer taxes, attorney fees. Typically 1–2% of sale price."
              value={state.sellerClosingCosts}
              onChange={(v) => update('sellerClosingCosts', v)}
              prefix=""
              suffix="%"
              placeholder="1.5"
            />
            <CurrencyInput
              label="Repairs & Staging Costs"
              tooltip="Pre-sale repairs, painting, staging, or landscaping improvements."
              value={state.repairsStaging}
              onChange={(v) => update('repairsStaging', v)}
              placeholder="0"
            />
            <CurrencyInput
              label="HOA Transfer Fees"
              tooltip="Fee charged by your HOA when the home is sold and ownership transfers. Optional."
              value={state.hoaTransferFees}
              onChange={(v) => update('hoaTransferFees', v)}
              placeholder="0"
            />
            <CurrencyInput
              label="Moving Costs"
              tooltip="Movers, truck rental, storage. Subtracted from net proceeds to find your available down payment."
              value={state.movingCosts}
              onChange={(v) => update('movingCosts', v)}
              placeholder="5,000"
            />
          </div>

          {/* Filing status toggle */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                Tax Filing Status
                <InfoTooltip text="Affects the primary residence capital gains exclusion: $500k for married filing jointly, $250k for single." />
              </span>
              <div className="flex rounded-lg overflow-hidden border border-slate-300">
                {['married', 'single'].map((status) => (
                  <button
                    key={status}
                    onClick={() => update('filingStatus', status)}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      state.filingStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {status === 'married' ? 'Married' : 'Single'}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {state.filingStatus === 'married'
                ? '$500,000 primary residence exclusion applied'
                : '$250,000 primary residence exclusion applied'}
            </p>
          </div>
        </SectionCard>

        {/* ── Results ── */}
        <SectionCard className="p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Sale Proceeds Breakdown</h3>

          {!hasData ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
              <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Enter a sale price to see your breakdown</p>
            </div>
          ) : (
            <div>
              <ResultRow label="Gross Sale Proceeds" value={calc.salePrice} />
              <ResultRow
                label={`Realtor Commission (${fmtPct(calc.realtorCommissionPct)})`}
                value={calc.realtorCommission}
                isDeduction
              />
              <ResultRow
                label={`Seller Closing Costs (${fmtPct(calc.sellerClosingCostsPct)})`}
                value={calc.sellerClosingCosts}
                isDeduction
                tooltip="Title insurance, transfer taxes, attorney fees."
              />
              {calc.repairs > 0 && (
                <ResultRow label="Repairs & Staging" value={calc.repairs} isDeduction />
              )}
              {calc.hoaTransfer > 0 && (
                <ResultRow label="HOA Transfer Fees" value={calc.hoaTransfer} isDeduction />
              )}
              <ResultRow
                label="Remaining Mortgage Balance"
                value={calc.mortgageBalance}
                isDeduction
              />
              {calc.capitalGainsTax > 0 && (
                <ResultRow
                  label="Capital Gains Tax (15%)"
                  value={calc.capitalGainsTax}
                  isDeduction
                  tooltip={`Taxable gain: ${fmtDollar(calc.taxableGain)} after ${fmtDollar(calc.exclusion)} exclusion.`}
                />
              )}
              {calc.capitalGainsTax === 0 && calc.salePrice > 0 && (
                <div className="py-2 border-b border-slate-100">
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    No capital gains tax — within primary residence exclusion
                  </span>
                </div>
              )}

              <ResultRow
                label="NET Proceeds"
                value={calc.netProceeds}
                isTotal
              />

              {/* Down payment callout */}
              <div className={`mt-4 rounded-lg p-4 ${calc.availableForDownPayment > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Available for Down Payment
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">After moving costs of {fmtDollar(calc.movingCosts)}</p>
                  </div>
                  <span className={`text-2xl font-bold tabular-nums ${calc.availableForDownPayment > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {fmtDollar(calc.availableForDownPayment)}
                  </span>
                </div>
                {calc.availableForDownPayment > 0 && (
                  <p className="text-xs text-emerald-600 mt-2">
                    This amount has been auto-populated as your down payment in Section 2.
                  </p>
                )}
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </section>
  );
};

export default HomeSaleSection;
