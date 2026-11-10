import { supabase } from './supabaseClient';

export const DEFAULT_APP_SETTINGS = {
  show_balance_on_launch: true,
  push_notifications_enabled: false,
  in_app_notifications_enabled: true,
};

export async function getAppSettings(userId) {
  const { data, error } = await supabase
    .from('app_user_settings')
    .select('show_balance_on_launch,push_notifications_enabled,in_app_notifications_enabled')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return { ...DEFAULT_APP_SETTINGS, ...(data || {}) };
}

export async function updateAppSettings(userId, changes) {
  const { data, error } = await supabase
    .from('app_user_settings')
    .upsert(
      { user_id: userId, ...changes, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select('show_balance_on_launch,push_notifications_enabled,in_app_notifications_enabled')
    .single();

  if (error) throw error;
  return { ...DEFAULT_APP_SETTINGS, ...data };
}
