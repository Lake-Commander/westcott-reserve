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

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'DEBIT')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const map = new Map();

      for (const item of data || []) {
        const rawTarget = item.counterparty || item.reference;
        if (rawTarget && !map.has(rawTarget)) {
          const bankName = item.bank_name || 'Westcott Reserve Bank';
          const isWestcott =
            bankName.toLowerCase().includes('westcott') ||
            !item.bank_name ||
            rawTarget.startsWith('@');

          let resolvedHandle = rawTarget.startsWith('@') ? rawTarget.replace(/^@/, '') : rawTarget;
          let resolvedName = item.receiver_name || resolvedHandle;
          let accNumber = item.account_number || item.receiver_account || null;

          const cleanQuery = resolvedHandle.trim().toLowerCase();
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, username, account_number')
            .or(`username.ilike.${cleanQuery},account_number.eq.${cleanQuery},name.ilike.%${cleanQuery}%`)
            .maybeSingle();

          if (profile) {
            resolvedName = profile.name;
            resolvedHandle = profile.username || resolvedHandle;
            if (profile.account_number) {
              accNumber = profile.account_number;
            }
          }

          const cleanNumericAcc = accNumber
            ? accNumber.replace(/[^0-9]/g, '')
            : rawTarget.replace(/[^0-9]/g, '');

          const cleanHandle = resolvedHandle.toLowerCase().replace(/\s+/g, '');

          map.set(rawTarget, {
            id: rawTarget,
            name: resolvedName,
            username: cleanHandle,
            accountNumber: cleanNumericAcc || cleanHandle,
            identifier: isWestcott ? `@${cleanHandle}` : cleanNumericAcc || rawTarget,
            bank: bankName,
            isWestcott,
          });
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

      // Delete debit transaction history records for this counterparty target
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', userId)
        .eq('type', 'DEBIT')
        .or(`counterparty.eq.${beneficiaryId},reference.eq.${beneficiaryId}`);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to delete beneficiary from database:', err.message);
      return false;
    }
  },

  saveBeneficiary: async (userId, { name, identifier, bank, isWestcott }) => {
    try {
      if (!userId) return false;

      // Upsert a zero-amount transaction record to register counterparty beneficiary entry
      const { error } = await supabase.from('transactions').insert([
        {
          user_id: userId,
          type: 'DEBIT',
          amount: 0.0,
          receiver_name: name,
          counterparty: identifier,
          bank_name: bank || 'Westcott Reserve Bank',
          note: 'Saved Beneficiary',
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to save beneficiary:', err.message);
      return false;
    }
  },

  resolveRecipient: async (query, currentUserId) => {
    const clean = query.trim().replace(/^@/, '');
    if (!clean) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, username, account_number')
      .or(`account_number.eq.${clean},username.ilike.${clean}`)
      .maybeSingle();

    if (error || !data) return null;

    if (data.id === currentUserId) {
      return { isSelf: true, name: data.name };
    }

    return {
      id: data.id,
      name: data.name,
      username: data.username,
      accountNumber: data.account_number,
      isSelf: false,
    };
  },

  executeNipTransfer: async ({
    senderId,
    receiverAccount,
    receiverName,
    bankName,
    amount,
    note,
    currency = 'USD',
    idempotencyKey = null,
  }) => {
    const { data: transfersEnabled, error: featureError } = await supabase.rpc(
      'is_feature_enabled',
      { p_feature_key: 'transfers' }
    );
    if (featureError) throw featureError;
    if (transfersEnabled !== true) {
      throw new Error('Transfers are temporarily unavailable.');
    }

    const token =
      idempotencyKey ||
      `wr-tx-${senderId.slice(0, 8)}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => onUpdate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        () => onUpdate()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};