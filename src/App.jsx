import { useState, useEffect, useCallback } from 'react';
import NavSidebar from './components/NavSidebar';
import HomeSaleSection from './sections/HomeSaleSection';
import MortgageSection from './sections/MortgageSection';
import ExpensesSection from './sections/ExpensesSection';
import FinancialHealthSection from './sections/FinancialHealthSection';
import { calcHomeSale } from './utils/calculations';

const initialState = {
  // ── Section 1: Home Sale ─────────────────────────────────────────────────
  salePrice: '',
  mortgageBalance: '',
  originalPurchasePrice: '',
  realtorCommission: '5.5',
  sellerClosingCosts: '1.5',
  repairsStaging: '',
  hoaTransferFees: '',
  filingStatus: 'married',
  movingCosts: '',

  // ── Section 2: Mortgage ──────────────────────────────────────────────────
  purchasePrice: '',
  downPayment: '',
  downPaymentManual: false,
  loanTerm: 30,
  rateOptimistic: '6.0',
  rateExpected: '6.75',
  ratePessimistic: '7.5',
  propertyTaxRate: '1.2',
  homeInsurance: '',
  hoaFees: '',

  // ── Section 3: Household Bills ───────────────────────────────────────────
  electric: '',
  gasUtility: '',
  waterSewer: '',
  trash: '',
  internet: '',
  cellPhones: '',
  streaming: '',

  // Food — pre-filled from budget data
  weeklyGroceries: '331',   // $331/wk × 52/12 ≈ $1,433/mo
  diningOut: '600',

  // Kids — childcare
  daycare1: '1000',         // Child 1 daycare
  daycare2: '0',            // Child 2 (TBD)
  backupChildcare: '',
  diapers: '',
  kidsClothing: '',

  // Kids — healthcare
  pediatricCopays: '',
  kidsRx: '',

  // Healthcare & insurance — pre-filled from budget data
  healthInsurance: '257',   // Health & Wellness
  dentalInsurance: '',
  visionInsurance: '',
  outOfPocketMedical: '110', // Medical out-of-pocket

  // Transportation — pre-filled from budget data
  // Current auto & transport $253 split across gas/insurance/maintenance
  // New car lease: $500
  carPayment1: '500',       // New car lease
  carPayment2: '',
  gasVehicle1: '100',       // Part of current auto $253
  gasVehicle2: '',
  autoInsurance: '100',     // Part of current auto $253
  carMaintenance: '53',     // Part of current auto $253

  // Lifestyle & Discretionary — pre-filled from budget data
  shopping: '1091',
  personalCare: '134',
  entertainment: '404',
  homeGarden: '74',
  softwareTech: '30',

  // Income
  grossMonthlyIncome: '',
  netMonthlyIncome: '',
};

// Track which section is in view for the sidebar highlight
const useSectionObserver = (setActiveSection) => {
  useEffect(() => {
    const ids = ['home-sale', 'mortgage', 'expenses', 'financial-health'];
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

function App() {
  const [state, setState] = useState(initialState);
  const [activeSection, setActiveSection] = useState('home-sale');

  useSectionObserver(setActiveSection);

  const update = useCallback((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateMultiple = useCallback((updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Auto-populate down payment from net sale proceeds (unless user overrode it)
  useEffect(() => {
    if (state.downPaymentManual) return;
    const homeSale = calcHomeSale(state);
    if (homeSale.availableForDownPayment > 0) {
      setState((prev) => ({
        ...prev,
        downPayment: String(Math.round(homeSale.availableForDownPayment)),
      }));
    }
  }, [
    state.salePrice, state.mortgageBalance, state.originalPurchasePrice,
    state.realtorCommission, state.sellerClosingCosts, state.repairsStaging,
    state.hoaTransferFees, state.filingStatus, state.movingCosts,
    state.downPaymentManual,
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <NavSidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* Main content — offset for sidebar */}
      <main className="lg:ml-60 pb-20 lg:pb-8">
        {/* Page header */}
        <header className="no-print bg-white border-b border-slate-200 px-6 lg:px-10 py-5 sticky top-0 z-20 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">
                Family Home Financial Planner
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Family of 4 · 2 kids under 5 · All calculations run in your browser
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Export Summary
            </button>
          </div>
        </header>

        {/* Sections */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-16">
          <HomeSaleSection state={state} update={update} />
          <div className="border-t border-slate-200" />
          <MortgageSection state={state} update={update} updateMultiple={updateMultiple} />
          <div className="border-t border-slate-200" />
          <ExpensesSection state={state} update={update} />
          <div className="border-t border-slate-200" />
          <FinancialHealthSection state={state} />
        </div>

        {/* Footer */}
        <footer className="no-print max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pb-6 pt-2">
          <p className="text-xs text-slate-400 text-center">
            All calculations are estimates for planning purposes only. Consult a licensed financial advisor, real estate attorney,
            and mortgage professional before making financial decisions. Capital gains tax shown at federal 15% long-term rate —
            state taxes may apply.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
