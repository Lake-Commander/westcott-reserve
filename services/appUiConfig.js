export const UI_ACTIONS = [
  { id: 'transfers', label: 'Transfer', icon: 'swap-horizontal-outline', route: 'transferMenu' },
  { id: 'cards', label: 'Cards', icon: 'card-outline', route: 'Cards' },
  { id: 'pay_bills', label: 'Pay Bills', icon: 'flash-outline', route: 'payBills' },
  { id: 'savings', label: 'Savings', icon: 'shield-checkmark-outline', route: 'savings' },
  { id: 'global_accounts', label: 'Global', icon: 'globe-outline', route: 'globalAccounts' },
  { id: 'history', label: 'Activity', icon: 'receipt-outline', route: 'History' },
  { id: 'customer_care', label: 'Support', icon: 'chatbubble-ellipses-outline', route: 'contactUs' },
];

export const UI_ACTION_BY_ID = Object.fromEntries(
  UI_ACTIONS.map((action) => [action.id, action])
);

export const DEFAULT_UI_CONFIG = {
  version: 1,
  theme: {
    accent: '#7052FF',
    lightBackground: '#F1F5F9',
    lightCard: '#FFFFFF',
    darkBackground: '#0A0A0C',
    darkCard: '#16161A',
  },
  home: {
    heroEnabled: true,
    heroTitle: 'A more personal banking experience',
    heroSubtitle: 'Manage your account with clarity and confidence.',
    heroButtonLabel: 'Explore transfers',
    heroAction: 'transfers',
    promoEnabled: true,
    promoTitle: 'Make your money work harder',
    promoDescription: 'Explore savings options designed around your goals.',
    promoButtonLabel: 'Explore savings',
    promoAction: 'savings',
    quickActions: [
      { id: 'pay_bills', label: 'Pay Bills', enabled: true },
      { id: 'savings', label: 'Savings', enabled: true },
      { id: 'global_accounts', label: 'Global', enabled: true },
      { id: 'cards', label: 'Cards', enabled: true },
    ],
  },
  banks: [
    { id: 'westcott', name: 'Westcott Reserve', country: 'United States', internal: true },
    { id: 'chase', name: 'JPMorgan Chase', country: 'United States', internal: false },
    { id: 'bank-of-america', name: 'Bank of America', country: 'United States', internal: false },
    { id: 'wells-fargo', name: 'Wells Fargo', country: 'United States', internal: false },
    { id: 'citi-us', name: 'Citi', country: 'United States', internal: false },
    { id: 'us-bank', name: 'U.S. Bank', country: 'United States', internal: false },
    { id: 'capital-one', name: 'Capital One', country: 'United States', internal: false },
    { id: 'pnc', name: 'PNC Bank', country: 'United States', internal: false },
    { id: 'td-us', name: 'TD Bank', country: 'United States', internal: false },
    { id: 'barclays', name: 'Barclays', country: 'United Kingdom', internal: false },
    { id: 'hsbc-uk', name: 'HSBC UK', country: 'United Kingdom', internal: false },
    { id: 'lloyds', name: 'Lloyds Bank', country: 'United Kingdom', internal: false },
    { id: 'natwest', name: 'NatWest', country: 'United Kingdom', internal: false },
    { id: 'deutsche-bank', name: 'Deutsche Bank', country: 'Germany', internal: false },
    { id: 'commerzbank', name: 'Commerzbank', country: 'Germany', internal: false },
    { id: 'bnp-paribas', name: 'BNP Paribas', country: 'France', internal: false },
    { id: 'societe-generale', name: 'Société Générale', country: 'France', internal: false },
    { id: 'ubs', name: 'UBS', country: 'Switzerland', internal: false },
    { id: 'ing', name: 'ING', country: 'Netherlands', internal: false },
    { id: 'santander', name: 'Santander', country: 'Spain', internal: false },
    { id: 'unicredit', name: 'UniCredit', country: 'Italy', internal: false },
    { id: 'aib', name: 'AIB', country: 'Ireland', internal: false },
  ],
};

export function cloneUIConfig(config) {
  return JSON.parse(JSON.stringify(config));
}

export function normalizeUIConfig(value) {
  if (!value || value.version !== 1) return cloneUIConfig(DEFAULT_UI_CONFIG);
  return {
    version: 1,
    theme: { ...DEFAULT_UI_CONFIG.theme, ...(value.theme || {}) },
    home: {
      ...DEFAULT_UI_CONFIG.home,
      ...(value.home || {}),
      quickActions: Array.isArray(value.home?.quickActions)
        ? value.home.quickActions.filter((item) => UI_ACTION_BY_ID[item?.id])
        : cloneUIConfig(DEFAULT_UI_CONFIG.home.quickActions),
    },
    banks: Array.isArray(value.banks) && value.banks.length
      ? value.banks.filter(
          (bank) =>
            bank &&
            typeof bank.id === 'string' &&
            typeof bank.name === 'string' &&
            typeof bank.country === 'string'
        )
      : cloneUIConfig(DEFAULT_UI_CONFIG.banks),
  };
}
