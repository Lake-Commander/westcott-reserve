// services/sandboxBankApi.js
import { supabase } from './supabaseClient';

export const INSTITUTIONS = [
  { id: 'westcott', name: 'Westcott Reserve (Internal)', code: 'WR01' },
  { id: 'jpmorgan', name: 'JPMorgan Chase Bank', code: 'JPMC' },
  { id: 'barclays', name: 'Barclays Private Bank', code: 'BARC' },
  { id: 'ubs', name: 'UBS Switzerland AG', code: 'UBSW' },
  { id: 'hsbc', name: 'HSBC Private Wealth', code: 'HSBC' },
];

export const SandboxBankApi = {
  // 1. Resolve Beneficiary Name (Enquiry)
  resolveAccount: async (accountNumber, institutionId = 'westcott') => {
    // Artificial latency for realism
    await new Promise((res) => setTimeout(res, 400));

    if (!accountNumber || accountNumber.trim().length < 5) {
      return { success: false, message: 'Invalid account number or identifier.' };
    }

    const cleanAcc = accountNumber.trim();

    // Check if this account belongs to an actual user in the database
    const { data: matchedProfile } = await supabase
      .from('profiles')
      .select('name, account_number')
      .eq('account_number', cleanAcc)
      .maybeSingle();

    if (matchedProfile) {
      return {
        success: true,
        accountName: matchedProfile.name,
        accountNumber: matchedProfile.account_number,
        institution: 'Westcott Reserve (Internal Client)',
        isInternal: true,
      };
    }

    // Fallback simulated directories for external transfers
    const simulatedDirectory = {
      '1029384756': 'Alexander Wright',
      '4920192831': 'Victoria Sterling',
      '8829103948': 'Julian Vance',
    };

    const externalName = simulatedDirectory[cleanAcc] || `Account Holder (${cleanAcc.slice(-4)})`;
    const inst = INSTITUTIONS.find((i) => i.id === institutionId) || INSTITUTIONS[0];

    return {
      success: true,
      accountName: externalName,
      accountNumber: cleanAcc,
      institution: inst.name,
      isInternal: false,
    };
  },

  // 2. Authorize and Dispatch Transfer
  executeTransfer: async ({ senderId, receiverAccount, receiverName, bankName, amount, currency = 'USD', note }) => {
    const { data, error } = await supabase.rpc('process_banking_transfer', {
      p_sender_id: senderId,
      p_receiver_acc: receiverAccount,
      p_receiver_name: receiverName,
      p_bank_name: bankName || 'Westcott Reserve',
      p_amount: parseFloat(amount),
      p_currency: currency,
      p_note: note || 'Transfer',
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.message || 'Transaction could not be authorized.');

    return data;
  },

  // 3. Simulated Direct Inflow / Deposit
  simulateDirectInflow: async (userId, amount, currency = 'USD') => {
    const ref = `WR-DEP-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    const newBalance = (parseFloat(profile?.balance) || 0) + parseFloat(amount);

    await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);

    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'CREDIT',
      amount: parseFloat(amount),
      currency,
      counterparty: 'Direct Clearing Settlement',
      reference: ref,
      category: 'Deposit',
      note: 'Inbound Wire Credit',
    });

    return { success: true, reference: ref, newBalance };
  },
};