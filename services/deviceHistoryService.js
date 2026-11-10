import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

const SESSION_KEY_PREFIX = '@westcottreserve_device_session:';

function getDeviceDetails() {
  return {
    platform: Platform.OS,
    model_name: Device.modelName || (Platform.OS === 'web' ? 'Web browser' : 'Unknown device'),
    os_version: Device.osVersion || String(Platform.Version || 'Unknown'),
    app_version: Constants.expoConfig?.version || 'Unknown',
  };
}

export const DeviceHistoryService = {
  getCurrentSessionId(userId) {
    return AsyncStorage.getItem(`${SESSION_KEY_PREFIX}${userId}`);
  },

  async recordSignIn(userId) {
    const storageKey = `${SESSION_KEY_PREFIX}${userId}`;
    const existingId = await AsyncStorage.getItem(storageKey);

    if (existingId) {
      const { data, error } = await supabase
        .from('device_sessions')
        .update({ last_seen_at: new Date().toISOString(), signed_out_at: null })
        .eq('id', existingId)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (data?.id) return data.id;
    }

    const { data, error } = await supabase
      .from('device_sessions')
      .insert({
        user_id: userId,
        ...getDeviceDetails(),
      })
      .select('id')
      .single();

    if (error) throw error;
    await AsyncStorage.setItem(storageKey, data.id);
    return data.id;
  },

  async recordSignOut(userId) {
    const storageKey = `${SESSION_KEY_PREFIX}${userId}`;
    const sessionId = await AsyncStorage.getItem(storageKey);
    if (!sessionId) return;

    const signedOutAt = new Date().toISOString();
    const { error } = await supabase
      .from('device_sessions')
      .update({ last_seen_at: signedOutAt, signed_out_at: signedOutAt })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
    await AsyncStorage.removeItem(storageKey);
  },
};
