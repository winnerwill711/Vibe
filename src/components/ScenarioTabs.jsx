import { useState } from 'react';

/**
 * Scenario tabs — up to 3 independent named scenarios.
 * Click to switch; click the pencil to rename inline.
 */
const ScenarioTabs = ({ scenarios, currentIndex, onSwitch, onRename }) => {
  const [editingIdx, setEditingIdx] = useState(null);
  const [draft, setDraft] = useState('');

  const startEdit = (e, i, name) => {
    e.stopPropagation();
    setEditingIdx(i);
    setDraft(name);
  };

  const commitEdit = () => {
    if (editingIdx !== null && draft.trim()) onRename(editingIdx, draft.trim());
    setEditingIdx(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditingIdx(null);
  };

  return (
    <div className="no-print flex items-center gap-1.5 flex-wrap">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:block">
        Scenario:
      </span>
      {scenarios.map((sc, i) => (
        <div
          key={i}
          className={`
            flex items-center gap-1.5 rounded-lg border transition-colors cursor-pointer select-none
            ${i === currentIndex
              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
              : 'bg-white border-slate-300 text-slate-600 hover:border-blue-300 hover:text-blue-600'}
          `}
          onClick={() => onSwitch(i)}
        >
          {editingIdx === i ? (
            <input
              className="w-24 text-xs font-semibold bg-blue-700 text-white rounded px-2 py-1.5 outline-none"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span className="text-xs font-semibold px-3 py-1.5">{sc.name}</span>
              <button
                className={`pr-2 opacity-50 hover:opacity-100 transition-opacity ${i === currentIndex ? 'text-blue-200' : 'text-slate-400'}`}
                onClick={(e) => startEdit(e, i, sc.name)}
                title="Rename scenario"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default ScenarioTabs;
