import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

export async function uploadProfileAvatar(uri, mimeType = 'image/jpeg') {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Your session has expired. Please sign in again.');

  const base64 = await FileSystemLegacy.readAsStringAsync(uri, {
    encoding: FileSystemLegacy.EncodingType.Base64,
  });
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : 'https://westcottreserve.com');
  const response = await fetch(`${apiBaseUrl.replace(/\/+$/, '')}/api/profile-avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ base64, mimeType }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `Profile photo upload failed (HTTP ${response.status}).`);
  }
  return result.avatarUrl;
}
