import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

export async function registerPushNotifications(userId) {
  if (Platform.OS === 'web') {
    throw new Error('Push notifications are available in the Android and iOS app.');
  }
  if (!Device.isDevice) {
    throw new Error('Push notifications require a physical device.');
  }

  const projectId =
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    throw new Error('Push setup is incomplete: link this app to an Expo EAS project before enabling push notifications.');
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  let status = currentPermissions.status;
  if (status !== 'granted') {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    status = requestedPermissions.status;
  }
  if (status !== 'granted') {
    throw new Error('Notification permission was not granted. Enable it in device settings to continue.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Westcott Reserve alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7052FF',
    });
  }

  let tokenResult;
  try {
    tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
  } catch (error) {
    throw new Error(
      `Push token registration failed. Verify the EAS project and Firebase/FCM setup. ${error.message || ''}`.trim()
    );
  }
  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: tokenResult.data,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' }
  );
  if (error) throw error;
  return tokenResult.data;
}

export async function unregisterPushNotifications(userId) {
  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}
