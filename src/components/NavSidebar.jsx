import { useState } from 'react';

const NAV_ITEMS = [
  { id: 'home-sale', label: 'Home Sale', icon: '🏠', short: 'Sale' },
  { id: 'mortgage', label: 'Mortgage Scenarios', icon: '📊', short: 'Mortgage' },
  { id: 'expenses', label: 'Monthly Expenses', icon: '💳', short: 'Expenses' },
  { id: 'financial-health', label: 'Financial Health', icon: '❤️', short: 'Health' },
];

const NavSidebar = ({ activeSection, setActiveSection }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id) => {
    setActiveSection(id);
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="no-print hidden lg:flex flex-col w-60 min-h-screen bg-white border-r border-slate-200 fixed left-0 top-0 z-30 shadow-sm">
        <div className="p-5 border-b border-slate-200">
          <h1 className="text-base font-bold text-slate-800 leading-tight">Family Home</h1>
          <p className="text-xs text-slate-500 mt-0.5">Financial Planner</p>
        </div>
        <nav className="flex-1 py-4 px-3">
          {NAV_ITEMS.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`
                w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors
                ${activeSection === item.id
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
              `}
            >
              <span className="w-6 text-center text-base" aria-hidden="true">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              <span className="text-xs font-medium text-slate-400 tabular-nums">{idx + 1}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Summary
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex shadow-lg">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`
              flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors
              ${activeSection === item.id ? 'text-blue-600' : 'text-slate-500'}
            `}
          >
            <span className="text-lg mb-0.5" aria-hidden="true">{item.icon}</span>
            <span className="font-medium">{item.short}</span>
          </button>
        ))}
        <button
          onClick={() => window.print()}
          className="flex-1 flex flex-col items-center justify-center py-2 text-xs text-slate-500"
        >
          <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span className="font-medium">Print</span>
        </button>
      </nav>
    </>
  );
};

export default NavSidebar;
