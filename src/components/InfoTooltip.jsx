import { useState } from 'react';

const InfoTooltip = ({ text }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-xs font-bold leading-none flex items-center justify-center hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label={text}
      >
        ?
      </button>
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-50 leading-relaxed">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  );
};

export default InfoTooltip;
