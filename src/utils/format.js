/**
 * Parse a currency string or number to a plain float.
 * Returns 0 for empty/invalid input.
 */
export const parseCurrency = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Format a number with commas (no dollar sign, no decimals).
 */
export const formatNum = (num) => {
  if (!num && num !== 0) return '0';
  return Math.round(Math.abs(num)).toLocaleString('en-US');
};

/**
 * Format as a dollar amount: $1,234
 */
export const fmtDollar = (num) => {
  if (!num && num !== 0) return '$0';
  if (num < 0) return '-$' + formatNum(Math.abs(num));
  return '$' + formatNum(num);
};

/**
 * Format as a percentage: 36.0%
 */
export const fmtPct = (num, decimals = 1) => {
  if (!num && num !== 0) return '0%';
  return num.toFixed(decimals) + '%';
};
