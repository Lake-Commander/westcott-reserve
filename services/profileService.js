import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

export async function uploadProfileAvatar(uri, mimeType = 'image/jpeg') {
  const base64 = await FileSystemLegacy.readAsStringAsync(uri, {
    encoding: FileSystemLegacy.EncodingType.Base64,
  });

  const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const apiBaseUrl =
    configuredApiUrl && !configuredApiUrl.includes('your-project.vercel.app')
      ? configuredApiUrl
      : Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.origin
        : 'https://www.westcottreserve.com';
  const endpoint = `${apiBaseUrl.replace(/\/+$/, '')}/api/profile-avatar`;
  const payload = JSON.stringify({ base64, mimeType });

  async function sendUpload(accessToken) {
    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: payload,
      });
    } catch {
      throw new Error(
        `Unable to reach the profile photo server at ${endpoint}. Check EXPO_PUBLIC_API_URL and your network connection.`
      );
    }

    const result = await response.json().catch(() => ({}));
    return { response, result };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  let token = sessionData.session?.access_token;
  if (!token) throw new Error('Your session has expired. Please sign in again.');

  let { response, result } = await sendUpload(token);
  if (response.status === 401) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.session?.access_token) {
      throw new Error('Your session has expired. Sign in again before updating your picture.');
    }
    token = refreshed.session.access_token;
    ({ response, result } = await sendUpload(token));
  }

  if (!response.ok) {
    throw new Error(result.error || `Profile photo upload failed (HTTP ${response.status}).`);
  }
  return result.avatarUrl;
}
