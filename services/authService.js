// services/authService.js
import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHED_USER_KEY = '@westcottreserve_cached_user';

// Pattern: '80' prefix followed by 8 random digits = 10 digits total
const generate10DigitAccount = () => {
  return '80' + Math.floor(10000000 + Math.random() * 90000000).toString();
};

export const AuthService = {
  // Sign up new account
  signUp: async ({ email, password, fullName, mpin = '0000' }) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanUsername = cleanEmail.split('@')[0];

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: cleanName,
          full_name: cleanName,
          username: cleanUsername,
          mpin: mpin,
        },
      },
    });

    if (error) throw error;
    if (!data?.user) throw new Error('Account creation failed. Please check your network.');

    // Enforce 10-digit numeric account number
    const generatedAcc = generate10DigitAccount();

    const { data: profile } = await supabase
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          email: cleanEmail,
          name: cleanName,
          username: cleanUsername,
          account_number: generatedAcc,
          balance: 250000.0,
          currency: 'USD',
          mpin: mpin,
        },
        { onConflict: 'id' }
      )
      .select()
      .maybeSingle();

    if (profile) {
      await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(profile));
    }

    return { user: data.user, profile };
  },

  // Standard credentials sign-in
  signIn: async ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) throw error;
    if (!data?.user) throw new Error('Authentication succeeded but user session is empty.');

    // 1. Fetch live customer profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    // 2. Resilient Upsert: If profile row is missing or has missing name/username/account_number
    const hasLegacyOrMissingAcc =
      !profile?.account_number ||
      profile.account_number.startsWith('WR-') ||
      profile.account_number.length !== 10;

    if (!profile || !profile.name || !profile.username || hasLegacyOrMissingAcc) {
      const generatedAcc = hasLegacyOrMissingAcc
        ? generate10DigitAccount()
        : profile.account_number;

      const fallbackName =
        data.user.user_metadata?.name ||
        data.user.user_metadata?.full_name ||
        cleanEmail.split('@')[0];

      const fallbackUsername =
        profile?.username ||
        data.user.user_metadata?.username ||
        cleanEmail.split('@')[0];

      const { data: upsertedProfile } = await supabase
        .from('profiles')
        .upsert(
          {
            id: data.user.id,
            email: cleanEmail,
            name: fallbackName,
            username: fallbackUsername,
            account_number: generatedAcc,
            balance: profile?.balance !== undefined ? profile.balance : 250000.0,
            currency: profile?.currency || 'USD',
            mpin: data.user.user_metadata?.mpin || '0000',
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      profile = upsertedProfile;
    }

    if (profile) {
      await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(profile));
    }

    return { session: data.session, profile };
  },

  // Verify 4-digit quick access PIN
  verifyMpin: async (userId, inputMpin) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('mpin')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data?.mpin === inputMpin;
  },

  // Request 6-digit OTP sent to registered email
  sendPasswordResetOtp: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw error;
    return data;
  },

  // Verify OTP code and update password
  resetPasswordWithOtp: async ({ email, token, newPassword }) => {
    if (token) {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: 'recovery',
      });

      if (verifyError) throw verifyError;
      if (!verifyData?.session) {
        throw new Error('Unable to establish secure recovery session. Please check your code.');
      }
    }

    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw updateError;
    return updateData;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(CACHED_USER_KEY);
  },

  purgeSession: async () => {
    try {
      await AsyncStorage.clear();
      await supabase.auth.signOut();
    } catch {
      // Continue
    }
  },

  getCurrentSession: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data?.session?.user) return null;

    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .maybeSingle();

    if (!profile) {
      const cached = await AsyncStorage.getItem(CACHED_USER_KEY);
      if (cached) profile = JSON.parse(cached);
    }

    return profile;
  },
};