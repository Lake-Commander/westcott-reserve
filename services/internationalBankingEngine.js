// services/internationalBankingEngine.js

export const RESERVE_CURRENCIES = {
  GBP: { symbol: '£', name: 'British Pound Sterling', locale: 'en-GB' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
};

export const CORRESPONDENT_BANKS = [
  { swift: 'WESTGB2L', name: 'Westcott Reserve (Mayfair, London)', country: 'United Kingdom' },
  { swift: 'COUTGB22', name: 'Coutts & Co. (Strand, London)', country: 'United Kingdom' },
  { swift: 'LOMBCHGG', name: 'Lombard Odier (Geneva)', country: 'Switzerland' },
  { swift: 'UBSWCHZH', name: 'UBS Switzerland AG (Zurich)', country: 'Switzerland' },
  { swift: 'JPMCUS33', name: 'J.P. Morgan Private Bank (New York)', country: 'United States' },
];

export const formatReserveMoney = (amount, currency = 'GBP') => {
  const conf = RESERVE_CURRENCIES[currency] || RESERVE_CURRENCIES.GBP;
  return new Intl.NumberFormat(conf.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

export const generateSwiftReference = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randSeq = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  return `WR-SWIFT-${randSeq}${Math.floor(100000 + Math.random() * 900000)}`;
};