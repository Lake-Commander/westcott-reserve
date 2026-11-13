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

      const { data: saved, error: savedError } = await supabase
        .from('beneficiaries')
        .select('id, name, username, account_number, identifier, bank_name, is_westcott, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!savedError && saved?.length) {
        const westcottAccountNumbers = saved
          .filter((item) =>
            (item.is_westcott || String(item.bank_name || '').toLowerCase().includes('westcott')) &&
            !item.username &&
            item.account_number
          )
          .map((item) => item.account_number);
        let profileByAccount = new Map();

        if (westcottAccountNumbers.length) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('account_number, username, name')
            .in('account_number', westcottAccountNumbers);
          profileByAccount = new Map(
            (profiles || []).map((profile) => [String(profile.account_number), profile])
          );
        }

        return (saved || []).map((item) => {
          const resolvedUsername = item.username || (
            String(item.identifier || '').startsWith('@')
              ? String(item.identifier).slice(1)
              : null
          ) || profileByAccount.get(String(item.account_number))?.username || null;
          const profile = profileByAccount.get(String(item.account_number));

          return {
            id: item.id,
            name: profile?.name || item.name || resolvedUsername || item.account_number || 'Beneficiary',
            username: resolvedUsername,
            accountNumber: item.account_number || null,
            identifier: item.identifier || (resolvedUsername ? `@${resolvedUsername}` : item.account_number),
            bank: item.bank_name || 'Westcott Reserve Bank',
            isUsernameBeneficiary: Boolean(resolvedUsername),
            isWestcott:
              item.is_westcott === true ||
              Boolean(resolvedUsername) ||
              String(item.identifier || '').startsWith('@') ||
              String(item.bank_name || '').toLowerCase().includes('westcott'),
          };
        });
      }

      // Older installations may not have the dedicated table yet.
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('counterparty, bank_name, receiver_name, account_number, created_at')
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
        const rawTarget = String(
          tx.counterparty || tx.account_number || tx.receiver_name || ''
        ).trim();
        if (!rawTarget) continue;

        const bankName = String(tx.bank_name || 'Other Bank').trim();
        const isWestcott =
          rawTarget.startsWith('@') ||
          String(tx.bank_name || '').toLowerCase().includes('westcott');
        
        if (isWestcott) {
          const cleanTarget = rawTarget.replace(/^@/, '').trim().toLowerCase();
          const txAccNum = tx.account_number
            ? String(tx.account_number).replace(/[^0-9]/g, '').trim()
            : null;
          
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
              isWestcott: true,
              isUsernameBeneficiary: Boolean(finalUsername),
            });
          }
        } else {
          const cleanAccNum = tx.account_number
            ? String(tx.account_number).replace(/[^0-9]/g, '').trim()
            : rawTarget.replace(/[^0-9]/g, '').trim();
          const beneficiaryKey = `${bankName.toLowerCase()}:${cleanAccNum || rawTarget}`.toLowerCase();

          if (!map.has(beneficiaryKey)) {
            map.set(beneficiaryKey, {
              id: beneficiaryKey,
              name: tx.receiver_name || rawTarget,
              username: null,
              accountNumber: cleanAccNum,
              identifier: cleanAccNum || rawTarget,
              bank: bankName,
              isWestcott: isWestcott,
              isUsernameBeneficiary: false,
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
      const { error: beneficiaryError } = await supabase
        .from('beneficiaries')
        .delete()
        .eq('user_id', userId)
        .eq('id', beneficiaryId);
      if (!beneficiaryError) return true;

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

  saveBeneficiary: async (
    userId,
    { name, username, identifier, bank, isWestcott, accountNumber }
  ) => {
    try {
      if (!userId) return false;
      const normalizedIdentifier = String(
        identifier || accountNumber || ''
      ).trim();
      const hasUsernameIdentifier = normalizedIdentifier.startsWith('@');
      const normalizedUsername = username || hasUsernameIdentifier
        ? String(username || normalizedIdentifier.slice(1))
            .replace(/^@/, '')
            .replace(/\s+/g, '')
            .toLowerCase()
        : null;
      const { error } = await supabase.from('beneficiaries').upsert({
        user_id: userId,
        name: name || normalizedUsername || accountNumber || normalizedIdentifier,
        username: normalizedUsername,
        identifier: normalizedIdentifier,
        account_number: accountNumber || (!isWestcott ? normalizedIdentifier : null),
        bank_name: bank || 'Westcott Reserve Bank',
        is_westcott: Boolean(isWestcott),
      }, { onConflict: 'user_id,bank_name,identifier' });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Unable to save beneficiary:', err.message);
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

  executeNipTransfer: async ({
    senderId,
    receiverAccount,
    receiverName,
    receiverUsername = null,
    bankName,
    amount,
    currency = 'USD',
    note,
    idempotencyKey = null,
  }) => {
    const { data: transferBlocked, error: restrictionError } = await supabase.rpc('is_account_transfer_blocked');
    if (restrictionError) throw restrictionError;
    if (transferBlocked === true) throw new Error('We could not process this transfer. Please contact support@westcott.com for assistance.');

    const { data: transfersEnabled, error: featureError } = await supabase.rpc('is_feature_enabled', { p_feature_key: 'transfers' });
    if (featureError) throw featureError;
    if (transfersEnabled !== true) throw new Error('Transfers are temporarily unavailable.');

    const token = idempotencyKey || `wr-tx-${senderId.slice(0, 8)}_${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const transferStartedAt = new Date().toISOString();

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

    let transactionId = data.transaction_id || data.transactionId || data.transaction?.id;
    if (!transactionId) {
      const { data: recentTransaction, error: lookupError } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', senderId)
        .eq('type', 'DEBIT')
        .eq('amount', parseFloat(amount))
        .gte('created_at', transferStartedAt)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lookupError) {
        console.warn('Transfer succeeded but transaction metadata lookup failed:', lookupError.message);
      } else {
        transactionId = recentTransaction?.id;
      }
    }

    if (transactionId) {
      const { error: metadataError } = await supabase
        .from('transactions')
        .update({
          receiver_name: receiverName || null,
          account_number: receiverAccount || null,
          bank_name: bankName || 'Westcott Reserve Bank',
          counterparty: receiverUsername ? `@${receiverUsername.replace(/^@/, '')}` : receiverName,
        })
        .eq('id', transactionId)
        .eq('user_id', senderId);
      if (metadataError) {
        console.warn('Transfer succeeded but transaction metadata update failed:', metadataError.message);
      }
    }

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