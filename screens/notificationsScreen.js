import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import { supabase } from '../services/supabaseClient';
import { getAppSettings } from '../services/appSettingsService';
import { showLocalNotification } from '../services/pushNotificationService';

export default function NotificationsScreen({ navigation }) {
  const { theme } = useAppTheme();
  const [notifications, setNotifications] = useState([]);
  const [inAppNotificationsEnabled, setInAppNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let notificationChannel;
      const loadNotifications = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          const userId = sessionData.session?.user?.id;
          if (!userId) throw new Error('Sign in to view your notifications.');

          const settings = await getAppSettings(userId);
          if (active) setInAppNotificationsEnabled(settings.in_app_notifications_enabled);

          notificationChannel = supabase
            .channel(`app-notifications-${userId}`)
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
              (payload) => {
                const notification = payload.new;
                if (!active || (notification.audience_user_id && notification.audience_user_id !== userId)) {
                  return;
                }
                if (settings.push_notifications_enabled) {
                  showLocalNotification(notification.title, notification.message).catch((error) => {
                    console.warn('Unable to show notification alert:', error);
                  });
                }
                if (!settings.in_app_notifications_enabled) return;
                setNotifications((current) => [
                  notification,
                  ...current.filter((item) => item.id !== notification.id),
                ].slice(0, 100));
              }
            )
            .subscribe((status) => {
              if (active && (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')) {
                setErrorMessage('Live notifications are temporarily unavailable. Reopen this screen to retry.');
              }
            });

          const { data, error } = await supabase
            .from('admin_notifications')
            .select('id,title,message,created_at,audience_user_id')
            .order('created_at', { ascending: false })
            .limit(100);
          if (error) throw error;
          if (!active) return;
          if (!settings.in_app_notifications_enabled) {
            setNotifications([]);
            return;
          }
          const { data: states, error: stateError } = await supabase
            .from('notification_states')
            .select('notification_id,read_at,dismissed_at')
            .eq('user_id', userId);
          if (stateError) throw stateError;
          const stateMap = new Map((states || []).map((state) => [state.notification_id, state]));
          const visible = (data || []).filter((item) => !stateMap.get(item.id)?.dismissed_at);
          setUnreadCount(visible.filter((item) => !stateMap.get(item.id)?.read_at).length);
          setNotifications((current) => {
            const merged = new Map(current.map((item) => [item.id, item]));
            for (const notification of visible) {
              merged.set(notification.id, {
                ...notification,
                read_at: stateMap.get(notification.id)?.read_at || null,
              });
            }
            return [...merged.values()]
              .sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
              .slice(0, 100);
          });
        } catch (error) {
          if (active) setErrorMessage(error.message || 'Unable to load notifications.');
        } finally {
          if (active) setLoading(false);
        }
      };
      loadNotifications();
      return () => {
        active = false;
        if (notificationChannel) supabase.removeChannel(notificationChannel);
      };
    }, [])
  );

  const markRead = async (notification) => {
    const { error } = await supabase.from('notification_states').upsert({
      notification_id: notification.id,
      user_id: (await supabase.auth.getUser()).data.user.id,
      read_at: new Date().toISOString(),
    }, { onConflict: 'notification_id,user_id' });
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setNotifications((items) => items.map((item) =>
      item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item
    ));
    setUnreadCount((count) => Math.max(0, count - (notification.read_at ? 0 : 1)));
  };

  const clearNotifications = async () => {
    const userId = (await supabase.auth.getUser()).data.user.id;
    const { error } = await supabase.from('notification_states').upsert(
      notifications.map((notification) => ({
        notification_id: notification.id,
        user_id: userId,
        dismissed_at: new Date().toISOString(),
      })),
      { onConflict: 'notification_id,user_id' }
    );
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <ScreenWrapper>
      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.backCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearNotifications} style={styles.clearButton}>
            <Text style={{ color: theme.accent, fontWeight: '700' }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {loading && <ActivityIndicator color="#7052FF" />}
        {!!errorMessage && <Text style={{ color: theme.textSecondary }}>{errorMessage}</Text>}
        {!loading && !errorMessage && notifications.length === 0 && (
          <Text style={{ color: theme.textSecondary }}>
            {inAppNotificationsEnabled ? 'You’re all caught up.' : 'In-app notifications are turned off in Notification Settings.'}
          </Text>
        )}
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            onPress={() => markRead(notification)}
            style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
          >
            <View style={styles.cardHeading}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{notification.title}</Text>
              {!notification.read_at && <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />}
            </View>
            <Text style={[styles.message, { color: theme.textSecondary }]}>{notification.message}</Text>
            <Text style={[styles.date, { color: theme.textMuted }]}>
              {new Date(notification.created_at).toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10 },
  backCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  clearButton: { marginLeft: 'auto', padding: 8 },
  cardHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unreadDot: { width: 9, height: 9, borderRadius: 5 },
  content: { padding: 18, gap: 12 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  message: { fontSize: 14, lineHeight: 21 },
  date: { fontSize: 11 },
});
