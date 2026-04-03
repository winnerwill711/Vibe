import CurrencyInput from '../components/CurrencyInput';
import InfoTooltip from '../components/InfoTooltip';
import { calcExpenses } from '../utils/calculations';
import { parseCurrency } from '../utils/format';
import { fmtDollar } from '../utils/format';

const CategoryBlock = ({ title, icon, children, total, totalLabel = 'Subtotal' }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">{icon}</span>
        <h3 className="font-semibold text-slate-700 text-sm">{title}</h3>
      </div>
      <span className="text-sm font-bold text-slate-800 tabular-nums bg-slate-100 px-2.5 py-1 rounded-lg">
        {fmtDollar(total)}
      </span>
    </div>
    <div className="grid sm:grid-cols-2 gap-3">
      {children}
    </div>
  </div>
);

const ExpensesSection = ({ state, update }) => {
  const exp = calcExpenses(state);
  const grossIncome = parseCurrency(state.grossMonthlyIncome);
  const netIncome = parseCurrency(state.netMonthlyIncome);

  return (
    <section id="expenses" className="print-section scroll-mt-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">3</span>
          <h2 className="text-xl font-bold text-slate-800">Monthly Family Expenses</h2>
        </div>
        <p className="text-slate-500 text-sm ml-11">Enter your estimated monthly costs. All fields are blank — fill in your actual numbers.</p>
      </div>

      <div className="space-y-5">
        {/* Income — put at top so DTI updates live */}
        <div className="bg-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg" aria-hidden="true">💰</span>
            <h3 className="font-semibold text-sm">Family Income</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-blue-100 flex items-center gap-1">
                Combined Gross Monthly Income
                <InfoTooltip text="Total pre-tax household income per month. Used to calculate your debt-to-income ratio (DTI)." />
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={state.grossMonthlyIncome
                    ? Number(state.grossMonthlyIncome).toLocaleString('en-US', { maximumFractionDigits: 0 })
                    : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, '');
                    update('grossMonthlyIncome', raw);
                  }}
                  placeholder="0"
                  className="w-full border border-blue-400 bg-blue-500 text-white placeholder-blue-300 rounded-lg py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-blue-100 flex items-center gap-1">
                Combined Net (Take-Home) Monthly Income
                <InfoTooltip text="After-tax take-home pay per month. Used to calculate your true budget surplus." />
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={state.netMonthlyIncome
                    ? Number(state.netMonthlyIncome).toLocaleString('en-US', { maximumFractionDigits: 0 })
                    : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, '');
                    update('netMonthlyIncome', raw);
                  }}
                  placeholder="0"
                  className="w-full border border-blue-400 bg-blue-500 text-white placeholder-blue-300 rounded-lg py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Household Bills */}
        <CategoryBlock title="Household Bills" icon="🏡" total={exp.householdTotal}>
          <CurrencyInput label="Electric" value={state.electric} onChange={(v) => update('electric', v)} placeholder="" />
          <CurrencyInput label="Gas (Utility)" value={state.gasUtility} onChange={(v) => update('gasUtility', v)} placeholder="" />
          <CurrencyInput label="Water / Sewer" value={state.waterSewer} onChange={(v) => update('waterSewer', v)} placeholder="" />
          <CurrencyInput label="Trash & Recycling" value={state.trash} onChange={(v) => update('trash', v)} placeholder="" />
          <CurrencyInput label="Internet" value={state.internet} onChange={(v) => update('internet', v)} placeholder="" />
          <CurrencyInput label="Cell Phones" value={state.cellPhones} onChange={(v) => update('cellPhones', v)} placeholder="" />
          <CurrencyInput label="Streaming / Subscriptions" value={state.streaming} onChange={(v) => update('streaming', v)} placeholder="" />
        </CategoryBlock>

        {/* Groceries & Food */}
        <CategoryBlock title="Groceries & Food" icon="🛒" total={exp.foodTotal}>
          <div className="flex flex-col gap-1">
            <CurrencyInput
              label="Weekly Grocery Budget"
              tooltip="Converted to monthly automatically (× 52 ÷ 12)."
              value={state.weeklyGroceries}
              onChange={(v) => update('weeklyGroceries', v)}
              placeholder=""
            />
            {exp.monthlyGroceries > 0 && (
              <p className="text-xs text-slate-400">{fmtDollar(exp.monthlyGroceries)}/mo</p>
            )}
          </div>
          <CurrencyInput label="Dining Out / Takeout" value={state.diningOut} onChange={(v) => update('diningOut', v)} placeholder="" />
        </CategoryBlock>

        {/* Kids — Daycare & Childcare */}
        <CategoryBlock title="Kids — Daycare & Childcare (2 kids under 5)" icon="👶" total={exp.kidsChildcareTotal}>
          <CurrencyInput
            label="Daycare — Child 1"
            tooltip="Monthly daycare or preschool cost for your first child."
            value={state.daycare1}
            onChange={(v) => update('daycare1', v)}
            placeholder=""
          />
          <CurrencyInput
            label="Daycare — Child 2"
            tooltip="Monthly daycare or preschool cost for your second child."
            value={state.daycare2}
            onChange={(v) => update('daycare2', v)}
            placeholder=""
          />
          <CurrencyInput label="Backup Childcare / Babysitting" value={state.backupChildcare} onChange={(v) => update('backupChildcare', v)} placeholder="" />
          <CurrencyInput label="Diapers, Formula & Baby Supplies" value={state.diapers} onChange={(v) => update('diapers', v)} placeholder="" />
          <CurrencyInput label="Kids' Clothing & Gear" value={state.kidsClothing} onChange={(v) => update('kidsClothing', v)} placeholder="" />
        </CategoryBlock>

        {/* Kids — Healthcare */}
        <CategoryBlock title="Kids — Healthcare" icon="🩺" total={exp.kidsHealthTotal}>
          <CurrencyInput label="Pediatric Copays / Visits" value={state.pediatricCopays} onChange={(v) => update('pediatricCopays', v)} placeholder="" />
          <CurrencyInput label="Kids' Prescriptions" value={state.kidsRx} onChange={(v) => update('kidsRx', v)} placeholder="" />
        </CategoryBlock>

        {/* Healthcare & Insurance */}
        <CategoryBlock title="Healthcare & Insurance (Family)" icon="🏥" total={exp.healthcareTotal}>
          <CurrencyInput
            label="Monthly Health Insurance Premium"
            tooltip="Your share of employer-sponsored coverage or marketplace premium."
            value={state.healthInsurance}
            onChange={(v) => update('healthInsurance', v)}
            placeholder=""
          />
          <CurrencyInput label="Dental Insurance" value={state.dentalInsurance} onChange={(v) => update('dentalInsurance', v)} placeholder="" />
          <CurrencyInput label="Vision Insurance" value={state.visionInsurance} onChange={(v) => update('visionInsurance', v)} placeholder="" />
          <CurrencyInput
            label="Out-of-Pocket Medical (monthly est.)"
            tooltip="Deductibles, copays, and non-covered expenses spread monthly."
            value={state.outOfPocketMedical}
            onChange={(v) => update('outOfPocketMedical', v)}
            placeholder=""
          />
        </CategoryBlock>

        {/* Transportation */}
        <CategoryBlock title="Transportation" icon="🚗" total={exp.transportTotal}>
          <CurrencyInput label="Car Lease / Payment — Vehicle 1" value={state.carPayment1} onChange={(v) => update('carPayment1', v)} placeholder="" />
          <CurrencyInput label="Car Payment — Vehicle 2" value={state.carPayment2} onChange={(v) => update('carPayment2', v)} placeholder="" />
          <CurrencyInput label="Gas — Vehicle 1" value={state.gasVehicle1} onChange={(v) => update('gasVehicle1', v)} placeholder="" />
          <CurrencyInput label="Gas — Vehicle 2" value={state.gasVehicle2} onChange={(v) => update('gasVehicle2', v)} placeholder="" />
          <CurrencyInput label="Auto Insurance (total)" value={state.autoInsurance} onChange={(v) => update('autoInsurance', v)} placeholder="" />
          <CurrencyInput
            label="Car Maintenance / Registration (monthly est.)"
            tooltip="Oil changes, tires, registration fees spread monthly."
            value={state.carMaintenance}
            onChange={(v) => update('carMaintenance', v)}
            placeholder=""
          />
        </CategoryBlock>

        {/* Lifestyle & Discretionary */}
        <CategoryBlock title="Lifestyle & Discretionary" icon="🛍️" total={exp.lifestyleTotal}>
          <CurrencyInput
            label="Shopping"
            tooltip="Clothing, household items, Amazon, general retail."
            value={state.shopping}
            onChange={(v) => update('shopping', v)}
            placeholder=""
          />
          <CurrencyInput
            label="Personal Care"
            tooltip="Hair, grooming, gym memberships, personal wellness."
            value={state.personalCare}
            onChange={(v) => update('personalCare', v)}
            placeholder=""
          />
          <CurrencyInput
            label="Entertainment & Recreation"
            tooltip="Activities, outings, sports, hobbies, travel."
            value={state.entertainment}
            onChange={(v) => update('entertainment', v)}
            placeholder=""
          />
          <CurrencyInput
            label="Home & Garden"
            tooltip="Décor, supplies, lawn care, minor home improvements."
            value={state.homeGarden}
            onChange={(v) => update('homeGarden', v)}
            placeholder=""
          />
          <CurrencyInput
            label="Software & Tech"
            tooltip="Apps, subscriptions, tech accessories."
            value={state.softwareTech}
            onChange={(v) => update('softwareTech', v)}
            placeholder=""
          />
        </CategoryBlock>

        {/* Summary bar */}
        <div className="bg-slate-800 rounded-xl p-5 text-white">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Monthly Non-Housing Expense Summary</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Household Bills', value: exp.householdTotal, color: 'bg-violet-400' },
              { label: 'Food & Groceries', value: exp.foodTotal, color: 'bg-sky-400' },
              { label: 'Childcare (2 kids)', value: exp.kidsChildcareTotal, color: 'bg-pink-400' },
              { label: "Kids' Healthcare", value: exp.kidsHealthTotal, color: 'bg-rose-400' },
              { label: 'Healthcare & Insurance', value: exp.healthcareTotal, color: 'bg-orange-400' },
              { label: 'Transportation', value: exp.transportTotal, color: 'bg-amber-400' },
              { label: 'Lifestyle & Discretionary', value: exp.lifestyleTotal, color: 'bg-teal-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`w-2 h-8 rounded-full flex-shrink-0 ${color}`} />
                <div>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="font-semibold tabular-nums">{fmtDollar(value)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-300 font-medium">Total Non-Housing Expenses</span>
            <span className="text-2xl font-bold tabular-nums text-white">{fmtDollar(exp.totalNonHousing)}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExpensesSection;
