import { useState } from 'react';
import InfoTooltip from './InfoTooltip';

/**
 * Currency input that displays formatted numbers with commas.
 * - Stores raw numeric string in state (passed up via onChange)
 * - Shows comma-formatted display when not focused
 * - Optional suffix for % fields
 */
const CurrencyInput = ({
  value,
  onChange,
  placeholder = '',
  label,
  tooltip,
  prefix = '$',
  suffix = '',
  className = '',
  inputClassName = '',
  labelClassName = '',
  disabled = false,
}) => {
  const [focused, setFocused] = useState(false);

  const handleChange = (e) => {
    // Allow digits and a single decimal point
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimals
    const parts = raw.split('.');
    const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
    onChange(cleaned);
  };

  const displayValue = () => {
    if (!value && value !== 0) return '';
    if (focused) return String(value);
    const num = parseFloat(String(value)) || 0;
    if (num === 0 && value === '') return '';
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className={`text-sm font-medium text-slate-700 flex items-center gap-1 ${labelClassName}`}>
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-slate-400 text-sm select-none pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={displayValue()}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full border border-slate-300 rounded-lg py-2 text-sm bg-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed
            transition-colors
            ${prefix ? 'pl-7' : 'pl-3'}
            ${suffix ? 'pr-10' : 'pr-3'}
            ${inputClassName}
          `}
        />
        {suffix && (
          <span className="absolute right-3 text-slate-400 text-sm select-none pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export default CurrencyInput;
