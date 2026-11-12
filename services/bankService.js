// services/bankService.js
import { supabase } from './supabaseClient';

export const BankService = {
  getAccountOverview: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  getTransactions: async (userId) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getTransferredBeneficiaries: async (userId) => {
    try {
      if (!userId) return [];

      // 1. Fetch transactions using your actual schema columns (including 'reference')
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('counterparty, bank_name, receiver_name, account_number, reference')
        .eq('user_id', userId)
        .eq('type', 'DEBIT')
        .order('created_at', { ascending: false });

      if (txError) throw txError;

      // 2. Fetch profiles using your actual schema columns
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, name, username, account_number');
        
      const profiles = allProfiles || [];
      const map = new Map();

      for (const tx of txs || []) {
        const rawTarget = tx.counterparty || tx.reference;
        if (!rawTarget) continue;

        const bankName = tx.bank_name || 'Westcott Reserve Bank';
        const isWestcott = bankName.toLowerCase().includes('westcott') || rawTarget.startsWith('@');
        
        if (isWestcott) {
          const cleanTarget = rawTarget.replace(/^@/, '').trim().toLowerCase();
          const txAccNum = tx.account_number ? tx.account_number.replace(/[^0-9]/g, '').trim() : null;
          
          // Match against your profiles table columns (username or account_number)
          const matchedProfile = profiles.find(p => 
            (p.username && p.username.toLowerCase() === cleanTarget) || 
            p.account_number === cleanTarget ||
            (txAccNum && p.account_number === txAccNum)
          );

          const finalUsername = matchedProfile?.username || (rawTarget.startsWith('@') ? cleanTarget : null);
          const finalAccNum = matchedProfile?.account_number || txAccNum || (rawTarget.match(/^[0-9]+$/) ? rawTarget : null);
          const finalName = matchedProfile?.name || tx.receiver_name || rawTarget;
          const finalId = finalUsername ? `@${finalUsername}` : finalAccNum;

          if (finalId && !map.has(`westcott:${finalId}`)) {
            map.set(`westcott:${finalId}`, {
              id: `westcott:${finalId}`,
              name: finalName,
              username: finalUsername,
              accountNumber: finalAccNum,
              identifier: finalId,
              bank: 'Westcott Reserve Bank',
              isWestcott: true
            });
          }
        } else {
          const cleanAccNum = tx.account_number ? tx.account_number.replace(/[^0-9]/g, '').trim() : rawTarget.replace(/[^0-9]/g, '').trim();
          const beneficiaryKey = `${bankName.toLowerCase()}:${cleanAccNum || rawTarget}`.toLowerCase();

          if (!map.has(beneficiaryKey)) {
            map.set(beneficiaryKey, {
              id: beneficiaryKey,
              name: tx.receiver_name || rawTarget,
              username: null,
              accountNumber: cleanAccNum,
              identifier: cleanAccNum || rawTarget,
              bank: bankName,
              isWestcott: false
            });
          }
        }
      }

      return Array.from(map.values());
    } catch (err) {
      console.warn('Beneficiaries query fallback executed:', err.message);
      return [];
    }
  },

  deleteBeneficiary: async (userId, beneficiaryId) => {
    try {
      if (!userId || !beneficiaryId) return false;
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', userId)
        .eq('type', 'DEBIT')
        .eq('counterparty', beneficiaryId);
      if (error) throw error;
      return true;
    } catch (err) {
      return false;
    }
  },

  saveBeneficiary: async (userId, { name, identifier, bank, isWestcott, accountNumber }) => {
    try {
      if (!userId) return false;
      const { error } = await supabase.from('transactions').insert([{
        user_id: userId,
        type: 'DEBIT',
        amount: 0.0,
        receiver_name: name,
        counterparty: identifier,
        account_number: accountNumber || (!isWestcott ? identifier : null),
        bank_name: bank || 'Westcott Reserve Bank',
        note: 'Saved Beneficiary',
        created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      return true;
    } catch (err) {
      return false;
    }
  },

  resolveRecipient: async (query, currentUserId) => {
    const clean = query?.trim().replace(/^@/, '');
    if (!clean) return null;
    const { data, error } = await supabase.rpc('resolve_transfer_recipient', { p_query: clean });
    if (error) throw error;
    const recipient = data?.[0];
    if (!recipient) return null;
    if (recipient.is_self || recipient.id === currentUserId) return { isSelf: true, name: recipient.name };
    return {
      id: recipient.id,
      name: recipient.name,
      username: recipient.username,
      accountNumber: recipient.account_number,
      isSelf: false,
    };
  },

  executeNipTransfer: async ({ senderId, receiverAccount, receiverName, bankName, amount, note, currency = 'USD', idempotencyKey = null }) => {
    const { data: transferBlocked, error: restrictionError } = await supabase.rpc('is_account_transfer_blocked');
    if (restrictionError) throw restrictionError;
    if (transferBlocked === true) throw new Error('We could not process this transfer. Please contact support@westcott.com for assistance.');

    const { data: transfersEnabled, error: featureError } = await supabase.rpc('is_feature_enabled', { p_feature_key: 'transfers' });
    if (featureError) throw featureError;
    if (transfersEnabled !== true) throw new Error('Transfers are temporarily unavailable.');

    const token = idempotencyKey || `wr-tx-${senderId.slice(0, 8)}_${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const { data, error } = await supabase.rpc('process_banking_transfer', {
      p_sender_id: senderId,
      p_receiver_acc: receiverAccount,
      p_receiver_name: receiverName,
      p_bank_name: bankName || 'Westcott Reserve Bank',
      p_amount: parseFloat(amount),
      p_currency: currency,
      p_note: note || 'Transfer',
      p_idempotency_key: token,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.message || 'Transaction rejected.');
    return data;
  },

  subscribeToUpdates: (userId, onUpdate) => {
    const channel = supabase
      .channel(`user-sync-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => onUpdate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, () => onUpdate())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },
};