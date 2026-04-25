import { useState, useEffect, useCallback } from 'react';
import NavSidebar from './components/NavSidebar';
import ScenarioTabs from './components/ScenarioTabs';
import HomeSaleSection from './sections/HomeSaleSection';
import MortgageSection from './sections/MortgageSection';
import ExpensesSection from './sections/ExpensesSection';
import FinancialHealthSection from './sections/FinancialHealthSection';
import FamilyPurchaseSection from './sections/FamilyPurchaseSection';
import { calcHomeSale } from './utils/calculations';
import { useFredRate } from './hooks/useFredRate';

// ─── Default values for one scenario ────────────────────────────────────────
const SCENARIO_DEFAULTS = {
  // ── Section 1: Home Sale ────────────────────────────────────────────────
  salePrice: '',
  mortgageBalance: '',
  originalPurchasePrice: '',
  realtorCommission: '5.5',
  sellerClosingCosts: '1.5',
  repairsStaging: '',
  hoaTransferFees: '',
  filingStatus: 'married',
  movingCosts: '',

  // ── Section 2: Mortgage ─────────────────────────────────────────────────
  purchasePrice: '',
  downPayment: '',
  downPaymentManual: false,
  loanTerm: 30,
  rateOptimistic: '6.0',
  rateExpected: '6.75',
  ratePessimistic: '7.5',
  propertyTaxRate: '2.78',   // pre-filled
  homeInsurance: '175',      // pre-filled: $175/mo
  hoaFees: '',

  // ── Section 3: Household Bills ──────────────────────────────────────────
  electric: '143',
  gasUtility: '112',
  waterSewer: '110',
  trash: '35',
  internet: '75',
  cellPhones: '0',           // covered by employer
  streaming: '100',

  // Food
  weeklyGroceries: '331',    // $331/wk × 52/12 ≈ $1,433/mo
  diningOut: '500',

  // Kids — childcare
  daycare1: '1000',
  daycare2: '0',             // 2nd child TBD
  backupChildcare: '',
  diapers: '',
  kidsClothing: '',

  // Kids — healthcare
  pediatricCopays: '',
  kidsRx: '',

  // Healthcare & insurance
  healthInsurance: '257',    // Health & Wellness
  dentalInsurance: '',
  visionInsurance: '',
  outOfPocketMedical: '110', // Medical out-of-pocket

  // Transportation
  carPayment1: '500',        // New car lease
  carPayment2: '',
  gasVehicle1: '',           // EV — no gas
  gasVehicle2: '',
  autoInsurance: '320',      // Car insurance
  carMaintenance: '53',

  // Lifestyle & Discretionary
  shopping: '1091',
  personalCare: '134',
  entertainment: '404',
  homeGarden: '74',
  softwareTech: '30',

  // Income
  grossMonthlyIncome: '',
  netMonthlyIncome: '8700',  // take-home pay

  // ── Rate toggle (used by Financial Health section) ──────────────────────
  activeRateView: 'expected',
  customRate: '',

  // ── Family Purchase Scenario tab ─────────────────────────────────────────
  fpPurchasePrice: '600000',   // parents bought in cash
  fpParentLoan: '450000',      // what I owe parents
  fpLoanTerm: 30,
  fpRateOptimistic: '6.0',
  fpRateExpected: '6.75',
  fpRatePessimistic: '7.5',
  fpCustomRate: '',
  fpPropertyTax: '565',        // monthly (pre-filled)
  fpHomeInsurance: '120.83',   // monthly (pre-filled)
  fpBridgeMonths: '3',         // months until NJ house closes
  fpBridgePayment: '0',        // optional monthly payment to parents during bridge
};

const makeScenario = (name) => ({ name, data: { ...SCENARIO_DEFAULTS } });

const INITIAL_APP_STATE = {
  currentScenarioIndex: 0,
  scenarios: [
    makeScenario('Scenario 1'),
    makeScenario('Scenario 2'),
    makeScenario('Scenario 3'),
  ],
};

// ─── Scroll-spy for sidebar highlight ───────────────────────────────────────
const useSectionObserver = (setActiveSection) => {
  useEffect(() => {
    const ids = ['home-sale', 'mortgage', 'expenses', 'financial-health', 'family-purchase'];
    const observers = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: '-10% 0px -70% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [setActiveSection]);
};

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [appState, setAppState] = useState(INITIAL_APP_STATE);
  const [activeSection, setActiveSection] = useState('home-sale');

  useSectionObserver(setActiveSection);

  // Derive current scenario's data as `state` — this is what all sections receive
  const { currentScenarioIndex, scenarios } = appState;
  const state = scenarios[currentScenarioIndex].data;

  // ── Update helpers ────────────────────────────────────────────────────────
  const updateScenarioData = useCallback((updater) => {
    setAppState((prev) => {
      const idx = prev.currentScenarioIndex;
      const updated = [...prev.scenarios];
      updated[idx] = {
        ...updated[idx],
        data: updater(updated[idx].data),
      };
      return { ...prev, scenarios: updated };
    });
  }, []);

  const update = useCallback((key, value) => {
    updateScenarioData((data) => ({ ...data, [key]: value }));
  }, [updateScenarioData]);

  const updateMultiple = useCallback((updates) => {
    updateScenarioData((data) => ({ ...data, ...updates }));
  }, [updateScenarioData]);

  // ── Scenario management ───────────────────────────────────────────────────
  const switchScenario = useCallback((index) => {
    setAppState((prev) => ({ ...prev, currentScenarioIndex: index }));
  }, []);

  const renameScenario = useCallback((index, name) => {
    setAppState((prev) => {
      const updated = [...prev.scenarios];
      updated[index] = { ...updated[index], name };
      return { ...prev, scenarios: updated };
    });
  }, []);

  // ── FRED live rate ────────────────────────────────────────────────────────
  const { fredRate, fredDate, loading: fredLoading, fetchRate } = useFredRate();

  // Apply a fetched rate to every scenario simultaneously
  const applyFredRatesToAll = useCallback((rate) => {
    const optimistic  = (rate - 0.5).toFixed(2);
    const expected    = rate.toFixed(2);
    const pessimistic = (rate + 0.75).toFixed(2);
    setAppState((prev) => ({
      ...prev,
      scenarios: prev.scenarios.map((sc) => ({
        ...sc,
        data: {
          ...sc.data,
          rateOptimistic:    optimistic,
          rateExpected:      expected,
          ratePessimistic:   pessimistic,
          fpRateOptimistic:  optimistic,
          fpRateExpected:    expected,
          fpRatePessimistic: pessimistic,
        },
      })),
    }));
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchRate().then((rate) => { if (rate != null) applyFredRatesToAll(rate); });
  }, [fetchRate, applyFredRatesToAll]);

  // Manual refresh — bust cache and re-apply
  const handleFredRefresh = useCallback(async () => {
    const rate = await fetchRate(true);
    if (rate != null) applyFredRatesToAll(rate);
  }, [fetchRate, applyFredRatesToAll]);

  // ── Auto-populate down payment from net sale proceeds ─────────────────────
  useEffect(() => {
    if (state.downPaymentManual) return;
    const homeSale = calcHomeSale(state);
    if (homeSale.availableForDownPayment > 0) {
      updateScenarioData((data) => ({
        ...data,
        downPayment: String(Math.round(homeSale.availableForDownPayment)),
      }));
    }
  }, [
    state.salePrice, state.mortgageBalance, state.originalPurchasePrice,
    state.realtorCommission, state.sellerClosingCosts, state.repairsStaging,
    state.hoaTransferFees, state.filingStatus, state.movingCosts,
    state.downPaymentManual,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    currentScenarioIndex,
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <NavSidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      <main className="lg:ml-60 pb-20 lg:pb-8">
        {/* ── Sticky header ── */}
        <header className="no-print bg-white border-b border-slate-200 px-6 lg:px-10 py-4 sticky top-0 z-20 shadow-sm">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Title */}
            <div className="flex-shrink-0">
              <h1 className="text-lg font-bold text-slate-800 leading-tight">
                Family Home Financial Planner
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Family of 4 · 2 kids under 5 · All calculations run in your browser
              </p>
            </div>

            {/* Scenario tabs — centred */}
            <div className="flex-1 flex justify-center">
              <ScenarioTabs
                scenarios={scenarios}
                currentIndex={currentScenarioIndex}
                onSwitch={switchScenario}
                onRename={renameScenario}
              />
            </div>

            {/* Print button */}
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </header>

        {/* ── Sections ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-16">
          <HomeSaleSection state={state} update={update} />
          <div className="border-t border-slate-200" />
          <MortgageSection
            state={state} update={update} updateMultiple={updateMultiple}
            fredRate={fredRate} fredDate={fredDate} fredLoading={fredLoading}
            onFredRefresh={handleFredRefresh}
          />
          <div className="border-t border-slate-200" />
          <ExpensesSection state={state} update={update} />
          <div className="border-t border-slate-200" />
          <FinancialHealthSection state={state} update={update} />
          <div className="border-t border-slate-200" />
          <FamilyPurchaseSection
            state={state} update={update} updateMultiple={updateMultiple}
            fredRate={fredRate} fredDate={fredDate} fredLoading={fredLoading}
            onFredRefresh={handleFredRefresh}
          />
        </div>

        {/* Footer */}
        <footer className="no-print max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pb-6 pt-2">
          <p className="text-xs text-slate-400 text-center">
            All calculations are estimates for planning purposes only. Consult a licensed financial advisor,
            real estate attorney, and mortgage professional before making financial decisions.
            Capital gains tax shown at federal 15% long-term rate — state taxes may apply.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
