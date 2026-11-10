const RATE_SOURCE = 'Frankfurter API / European Central Bank reference rates';

export async function getIndicativeFxRate(fromCurrency, toCurrency) {
  const from = String(fromCurrency || '').toUpperCase();
  const to = String(toCurrency || '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
    throw new Error('Enter valid three-letter source and target currency codes.');
  }
  if (from === to) {
    throw new Error('Choose a target currency different from the current account currency.');
  }

  const url = new URL('https://api.frankfurter.dev/v1/latest');
  url.searchParams.set('base', from);
  url.searchParams.set('symbols', to);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`The reference-rate service returned HTTP ${response.status}.`);
  }

  const result = await response.json();
  const rate = result?.rates?.[to];
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(result?.date || '') ||
    typeof rate !== 'number' ||
    !Number.isFinite(rate) ||
    rate <= 0
  ) {
    throw new Error(`No current reference rate is available for ${from} to ${to}.`);
  }

  return {
    fromCurrency: from,
    toCurrency: to,
    rate,
    rateDate: result.date,
    source: RATE_SOURCE,
  };
}

export function formatCurrencyAmount(amount, currency) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${currency} —`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
