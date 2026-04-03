import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { calcHomeSale, calcMortgageScenario, calcExpenses, calcFinancialHealth } from '../utils/calculations';
import { parseCurrency } from '../utils/format';
import { fmtDollar, fmtPct } from '../utils/format';
import InfoTooltip from '../components/InfoTooltip';

// ── Gauge bar ────────────────────────────────────────────────────────────────
const GaugeBar = ({ value, max, warnAt, dangerAt, label, unit = '%', description }) => {
  const pct = Math.min(100, (value / max) * 100);
  const color = value >= dangerAt ? 'bg-red-500' : value >= warnAt ? 'bg-amber-400' : 'bg-emerald-500';
  const textColor = value >= dangerAt ? 'text-red-600' : value >= warnAt ? 'text-amber-600' : 'text-emerald-600';
  const bgColor = value >= dangerAt ? 'bg-red-50 border-red-200' : value >= warnAt ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200';

  return (
    <div className={`rounded-xl border p-4 ${bgColor}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        </div>
        <span className={`text-xl font-bold tabular-nums ${textColor}`}>
          {value > 0 ? fmtPct(value) : '—'}
        </span>
      </div>
      <div className="relative h-2 bg-white/70 rounded-full overflow-visible mt-3">
        {/* Threshold markers */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-amber-400 rounded z-10"
          style={{ left: `${(warnAt / max) * 100}%` }}
          title={`Warning: ${warnAt}${unit}`}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-red-500 rounded z-10"
          style={{ left: `${(dangerAt / max) * 100}%` }}
          title={`Danger: ${dangerAt}${unit}`}
        />
        {/* Fill */}
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>0{unit}</span>
        <span className="text-amber-500">warn {warnAt}{unit}</span>
        <span className="text-red-500">max {dangerAt}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};

// ── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, variant = 'default' }) => {
  const variants = {
    default: 'bg-white border-slate-200 text-slate-800',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    yellow: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-600',
  };
  return (
    <div className={`rounded-xl border p-4 ${variants[variant]}`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${variants[variant].split(' ')[2]}`}>{value}</p>
      {sub && <p className="text-xs mt-1 text-slate-400">{sub}</p>}
    </div>
  );
};

// ── Chart colors ─────────────────────────────────────────────────────────────
const CHART_COLORS = ['#6366f1', '#0ea5e9', '#ec4899', '#f43f5e', '#f97316', '#f59e0b', '#10b981'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="font-semibold">{payload[0].name}</p>
        <p>{fmtDollar(payload[0].value)}/mo</p>
      </div>
    );
  }
  return null;
};

// ── Main Component ───────────────────────────────────────────────────────────
const FinancialHealthSection = ({ state }) => {
  const homeSale = calcHomeSale(state);
  const purchasePrice = parseCurrency(state.purchasePrice);
  const downPayment = parseCurrency(state.downPayment);
  const loanTerm = parseInt(state.loanTerm) || 30;
  const propertyTaxRate = parseCurrency(state.propertyTaxRate);
  const homeInsurance = parseCurrency(state.homeInsurance);
  const hoaFees = parseCurrency(state.hoaFees);
  const rateExpected = parseCurrency(state.rateExpected);

  const mortgageExpected = calcMortgageScenario(
    purchasePrice, downPayment, loanTerm, rateExpected,
    propertyTaxRate, homeInsurance, hoaFees
  );

  const expenses = calcExpenses(state);
  const health = calcFinancialHealth(state, homeSale, mortgageExpected, expenses);

  const netIncome = parseCurrency(state.netMonthlyIncome);
  const grossIncome = parseCurrency(state.grossMonthlyIncome);
  const hasData = grossIncome > 0 || netIncome > 0 || mortgageExpected;

  // Cash remaining color
  const cashVariant =
    health.cashRemaining <= 0 ? 'red'
    : health.cashRemaining < netIncome * 0.05 ? 'yellow'
    : 'green';

  // DTI variant
  const dtiVariant =
    health.dti >= 43 ? 'red'
    : health.dti >= 36 ? 'yellow'
    : health.dti > 0 ? 'green'
    : 'default';

  // Housing % variant
  const housingVariant =
    health.housingPct >= 36 ? 'red'
    : health.housingPct >= 28 ? 'yellow'
    : health.housingPct > 0 ? 'green'
    : 'default';

  // Donut chart data
  const pitiAmt = mortgageExpected ? mortgageExpected.monthlyPITI : 0;
  const chartData = [
    { name: 'Housing (PITI)', value: Math.round(pitiAmt) },
    { name: 'Household Bills', value: Math.round(expenses.householdTotal) },
    { name: 'Food & Groceries', value: Math.round(expenses.foodTotal) },
    { name: 'Childcare', value: Math.round(expenses.kidsChildcareTotal) },
    { name: "Kids' Healthcare", value: Math.round(expenses.kidsHealthTotal) },
    { name: 'Healthcare/Insurance', value: Math.round(expenses.healthcareTotal) },
    { name: 'Transportation', value: Math.round(expenses.transportTotal) },
  ].filter(d => d.value > 0);

  // Alert messages
  const alerts = [];
  if (health.dti >= 43 && health.suggestedPrice) {
    alerts.push({
      type: 'danger',
      msg: `Your DTI is ${fmtPct(health.dti)} — lenders typically cap at 43%. Consider a purchase price of ${fmtDollar(health.suggestedPrice)} or lower to stay within guidelines.`,
    });
  } else if (health.dti >= 36 && health.dti < 43) {
    alerts.push({
      type: 'warning',
      msg: `Your DTI is ${fmtPct(health.dti)} — above the preferred 36% threshold. You may still qualify, but reducing other debts or the purchase price would strengthen your position.`,
    });
  }
  if (health.housingPct >= 36) {
    alerts.push({
      type: 'danger',
      msg: `Housing costs represent ${fmtPct(health.housingPct)} of your take-home pay — well above the recommended 28%. This leaves limited cushion for childcare and savings.`,
    });
  } else if (health.housingPct >= 28) {
    alerts.push({
      type: 'warning',
      msg: `Housing costs are ${fmtPct(health.housingPct)} of take-home pay. The 28% guideline is a reasonable target; you're slightly above it.`,
    });
  }
  if (health.cashRemaining < 0 && netIncome > 0) {
    alerts.push({
      type: 'danger',
      msg: `At the Expected rate, your total monthly expenses exceed take-home pay by ${fmtDollar(Math.abs(health.cashRemaining))}. Review daycare costs, transportation, and purchase price.`,
    });
  }

  return (
    <section id="financial-health" className="print-section scroll-mt-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">4</span>
          <h2 className="text-xl font-bold text-slate-800">Financial Health Snapshot</h2>
        </div>
        <p className="text-slate-500 text-sm ml-11">
          A clear summary of your financial position using the <strong>Expected</strong> rate scenario.
        </p>
      </div>

      {!hasData ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-300">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">Fill in income in Section 3 and purchase details in Section 2 to see your financial health summary.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Alert banners */}
          {alerts.length > 0 && (
            <div className="space-y-3">
              {alerts.map((a, i) => (
                <div
                  key={i}
                  className={`flex gap-3 rounded-xl p-4 border text-sm ${
                    a.type === 'danger'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <span className="text-xl flex-shrink-0" aria-hidden="true">
                    {a.type === 'danger' ? '⚠️' : '💡'}
                  </span>
                  <p>{a.msg}</p>
                </div>
              ))}
            </div>
          )}

          {/* Bottom line */}
          <div className={`rounded-xl p-5 border-2 ${
            health.cashRemaining > 0
              ? cashVariant === 'green' ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bottom Line</p>
            <p className={`text-lg font-bold ${health.cashRemaining >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {netIncome > 0 && mortgageExpected
                ? health.cashRemaining >= 0
                  ? `After all expenses, you have ${fmtDollar(health.cashRemaining)} left each month (Expected rate scenario).`
                  : `Your monthly expenses exceed take-home pay by ${fmtDollar(Math.abs(health.cashRemaining))} at the Expected rate.`
                : 'Enter income and mortgage details to see your monthly surplus.'}
            </p>
          </div>

          {/* Key metrics grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Monthly PITI"
              value={mortgageExpected ? fmtDollar(mortgageExpected.monthlyPITI) : '—'}
              sub="Expected rate scenario"
              variant={mortgageExpected ? 'default' : 'default'}
            />
            <StatCard
              label="Total Monthly Expenses"
              value={fmtDollar(health.totalMonthly)}
              sub="Housing + all family costs"
            />
            <StatCard
              label="Monthly Cash Remaining"
              value={netIncome > 0 ? fmtDollar(health.cashRemaining) : '—'}
              sub="After all expenses"
              variant={netIncome > 0 ? cashVariant : 'default'}
            />
            <StatCard
              label="Emergency Runway"
              value={health.monthsCovered > 0 ? `${health.monthsCovered.toFixed(1)} mo` : '—'}
              sub="Net proceeds cover expenses"
              variant={health.monthsCovered > 3 ? 'green' : health.monthsCovered > 1 ? 'yellow' : health.monthsCovered > 0 ? 'red' : 'default'}
            />
          </div>

          {/* DTI & Housing gauges */}
          <div className="grid sm:grid-cols-2 gap-4">
            <GaugeBar
              label="Debt-to-Income Ratio (DTI)"
              description="Housing + car payments ÷ gross income"
              value={health.dti}
              max={60}
              warnAt={36}
              dangerAt={43}
            />
            <GaugeBar
              label="Housing Cost % of Take-Home"
              description="PITI ÷ net monthly income"
              value={health.housingPct}
              max={60}
              warnAt={28}
              dangerAt={36}
            />
          </div>

          {/* Chart + breakdown */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-semibold text-slate-700 mb-4">Monthly Spending Breakdown</h3>
              <div className="flex flex-col lg:flex-row gap-6 items-center">
                {/* Donut chart */}
                <div className="w-full lg:w-72 flex-shrink-0 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="80%"
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend / breakdown table */}
                <div className="flex-1 w-full">
                  <div className="space-y-2">
                    {chartData.map((item, i) => {
                      const total = chartData.reduce((s, d) => s + d.value, 0);
                      const pct = total > 0 ? (item.value / total) * 100 : 0;
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          <span className="text-sm text-slate-600 flex-1">{item.name}</span>
                          <span className="text-xs text-slate-400 tabular-nums w-10 text-right">{fmtPct(pct, 0)}</span>
                          <span className="text-sm font-semibold tabular-nums w-20 text-right">{fmtDollar(item.value)}</span>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-200 mt-2">
                      <span className="w-3 h-3 flex-shrink-0" />
                      <span className="text-sm font-semibold text-slate-700 flex-1">Total</span>
                      <span className="text-xs w-10" />
                      <span className="text-sm font-bold tabular-nums w-20 text-right">
                        {fmtDollar(chartData.reduce((s, d) => s + d.value, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DTI interpretation table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                DTI Reference Guide
                <InfoTooltip text="Lenders evaluate your back-end DTI (all debt + housing) when deciding whether to approve a mortgage." />
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { range: 'Below 36%', label: 'Excellent', desc: 'Most lenders love this. You\'re in a strong position.', color: 'text-emerald-600', dot: 'bg-emerald-500' },
                { range: '36% – 43%', label: 'Acceptable', desc: 'Conventional loans typically allow up to 43%. You may face stricter scrutiny.', color: 'text-amber-600', dot: 'bg-amber-400' },
                { range: 'Above 43%', label: 'High Risk', desc: 'Many lenders will not approve. Consider a lower purchase price or paying off debt first.', color: 'text-red-600', dot: 'bg-red-500' },
              ].map(({ range, label, desc, color, dot }) => (
                <div key={range} className="flex items-start gap-4 px-6 py-4">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700 tabular-nums">{range}</span>
                      <span className={`text-xs font-medium ${color}`}>{label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  {health.dti > 0 && (
                    <span className="text-xs text-slate-400 mt-0.5">
                      {health.dti < 36 && range === 'Below 36%' ? '← You are here' :
                       health.dti >= 36 && health.dti <= 43 && range === '36% – 43%' ? '← You are here' :
                       health.dti > 43 && range === 'Above 43%' ? '← You are here' : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FinancialHealthSection;
