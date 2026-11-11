// services/authService.js
import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getAppSettings } from './appSettingsService';
import { DeviceHistoryService } from './deviceHistoryService';
import { registerPushNotifications, unregisterPushNotifications } from './pushNotificationService';
import { requiresTotpChallenge, verifyCurrentTotpCode } from './mfaService';

const CACHED_USER_KEY = '@westcottreserve_cached_user';

// Pattern: '80' prefix followed by 8 random digits = 10 digits total
const generate10DigitAccount = () => {
  return '80' + Math.floor(10000000 + Math.random() * 90000000).toString();
};

async function recordDeviceSignIn(userId) {
  try {
    await DeviceHistoryService.recordSignIn(userId);
  } catch (error) {
    console.warn('Device sign-in history could not be recorded:', error);
  }
}

async function syncPushRegistration(userId) {
  if (Platform.OS === 'web') return;
  try {
    const settings = await getAppSettings(userId);
    if (settings.push_notifications_enabled) {
      await registerPushNotifications(userId);
    }
  } catch (error) {
    console.warn('Push registration could not be synchronized:', error);
  }
}

async function clearDeviceSession(userId) {
  try {
    await DeviceHistoryService.recordSignOut(userId);
  } catch (error) {
    console.warn('Device sign-out history could not be recorded:', error);
  }
  try {
    await unregisterPushNotifications(userId);
  } catch (error) {
    console.warn('Push registration could not be removed at sign-out:', error);
  }
}

export const AuthService = {
  // Sign up new account
  signUp: async ({ email, password, fullName, mpin = '0000', phone = '' }) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanUsername = cleanEmail.split('@')[0];
    const cleanPhone = phone.trim();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: cleanName,
          full_name: cleanName,
          username: cleanUsername,
          phone: cleanPhone,
          mpin: mpin,
        },
      },
    });

    if (error) throw error;
    if (!data?.user) throw new Error('Account creation failed. Please check your network.');

    if (!data.session) {
      return {
        user: data.user,
        profile: null,
        session: null,
        requiresEmailConfirmation: true,
      };
    }

    const profile = await AuthService.ensureSignupProfile({
      user: data.user,
      email: cleanEmail,
      fullName: cleanName,
      username: cleanUsername,
      mpin,
      phone: cleanPhone,
    });
    const signedIn = await AuthService.finishSignIn(data.user, data.session, cleanEmail);
    return { ...signedIn, user: data.user, profile: signedIn.profile || profile };
  },

  // Standard credentials sign-in, followed by Supabase TOTP when enrolled.
  signIn: async ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) throw error;
    if (!data?.user) throw new Error('Authentication succeeded but user session is empty.');

    if (await requiresTotpChallenge()) {
      return { requiresMfa: true };
    }

    return AuthService.finishSignIn(data.user, data.session, cleanEmail);
  },

  verifySignInMfa: async (code) => {
    await verifyCurrentTotpCode(code);
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session?.user) {
      throw new Error('Your sign-in session expired. Please sign in again.');
    }
    return AuthService.finishSignIn(
      data.session.user,
      data.session,
      data.session.user.email || ''
    );
  },

  cancelPendingMfaSignIn: async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(CACHED_USER_KEY);
  },

  finishSignIn: async (user, session, cleanEmail) => {
    const { data: accountActive, error: accountStatusError } = await supabase.rpc(
      'is_account_active'
    );
    if (accountStatusError) {
      await clearDeviceSession(user.id);
      await supabase.auth.signOut();
      throw accountStatusError;
    }
    if (accountActive !== true) {
      await clearDeviceSession(user.id);
      await supabase.auth.signOut();
      throw new Error('This account has been temporarily suspended. Contact customer care.');
    }

    // 1. Fetch live customer profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
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
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        cleanEmail.split('@')[0];

      const fallbackUsername =
        profile?.username ||
        user.user_metadata?.username ||
        cleanEmail.split('@')[0];

      const fallbackPhone =
        profile?.phone ||
        user.user_metadata?.phone ||
        '';

      const { data: upsertedProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: cleanEmail,
            name: fallbackName,
            username: fallbackUsername,
            phone: fallbackPhone,
            account_number: generatedAcc,
            balance: profile?.balance ?? 0,
            currency: profile?.currency || 'USD',
            mpin: user.user_metadata?.mpin || '0000',
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (profileError) throw profileError;
      profile = upsertedProfile;
    }

    if (profile) {
      await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(profile));
    }
    await recordDeviceSignIn(user.id);
    await syncPushRegistration(user.id);

    return { session, profile };
  },

  ensureSignupProfile: async ({ user, email, fullName, username, mpin, phone = '' }) => {
    const cleanPhone = phone.trim();
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email,
          name: fullName,
          username,
          phone: cleanPhone,
          account_number: generate10DigitAccount(),
          balance: 0,
          currency: 'USD',
          mpin,
        },
        { onConflict: 'id' }
      )
      .select()
      .maybeSingle();
    if (error) throw error;
    return profile;
  },

  verifySignUpOtp: async ({ email, token }) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'signup',
    });
    if (error) throw error;
    if (!data.session?.user) {
      throw new Error('Unable to verify this email code. Please request a new one.');
    }
    return AuthService.finishSignIn(
      data.session.user,
      data.session,
      data.session.user.email || email.trim().toLowerCase()
    );
  },

  resendSignUpOtp: async (email) => {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    });
    if (error) throw error;
    return data;
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
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) throw error;
    return data;
  },

  // Verify OTP code and update password
  resetPasswordWithOtp: async ({ email, token, newPassword }) => {
    if (token) {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
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
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (userId) await clearDeviceSession(userId);
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

    if (await requiresTotpChallenge()) {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem(CACHED_USER_KEY);
      return null;
    }

    const { data: accountActive, error: accountStatusError } = await supabase.rpc(
      'is_account_active'
    );
    if (accountStatusError) {
      await clearDeviceSession(data.session.user.id);
      await supabase.auth.signOut();
      throw accountStatusError;
    }
    if (accountActive !== true) {
      await clearDeviceSession(data.session.user.id);
      await supabase.auth.signOut();
      return null;
    }

    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .maybeSingle();

    if (!profile) {
      const cached = await AsyncStorage.getItem(CACHED_USER_KEY);
      if (cached) profile = JSON.parse(cached);
    }

    await recordDeviceSignIn(data.session.user.id);
    await syncPushRegistration(data.session.user.id);

    return profile;
  },
};