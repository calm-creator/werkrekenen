/**
 * Nederlandse formattering voor bedragen, getallen en datums
 */

const nlCurrencyFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const nlCurrencyNoDecimalsFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const nlNumberFormatter = new Intl.NumberFormat('nl-NL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const nlIntegerFormatter = new Intl.NumberFormat('nl-NL', {
  maximumFractionDigits: 0
});

export function formatCurrency(amount: number, showDecimals = true): string {
  if (isNaN(amount) || !isFinite(amount)) return '€ 0,00';
  return showDecimals
    ? nlCurrencyFormatter.format(amount)
    : nlCurrencyNoDecimalsFormatter.format(amount);
}

export function formatNumber(value: number, decimals = 2): string {
  if (isNaN(value) || !isFinite(value)) return '0';
  if (decimals === 0) return nlIntegerFormatter.format(value);
  return new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(value);
}

export function formatPercentage(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0%';
  return `${formatNumber(value, 1)}%`;
}

export function parseDutchNumber(input: string): number {
  if (!input) return 0;
  // Replace euro sign, trim
  let cleaned = input.replace(/[€\s]/g, '');
  // If input contains dots as thousand separators and comma as decimal separator
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
