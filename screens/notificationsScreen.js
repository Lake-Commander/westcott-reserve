import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import { supabase } from '../services/supabaseClient';
import { getAppSettings } from '../services/appSettingsService';

export default function NotificationsScreen({ navigation }) {
  const { theme } = useAppTheme();
  const [notifications, setNotifications] = useState([]);
  const [inAppNotificationsEnabled, setInAppNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

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
          if (!settings.in_app_notifications_enabled) {
            if (active) setNotifications([]);
            return;
          }

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
            .select('id,title,message,created_at')
            .order('created_at', { ascending: false })
            .limit(100);
          if (error) throw error;
          if (!active) return;
          setNotifications((current) => {
            const merged = new Map(current.map((item) => [item.id, item]));
            for (const notification of data || []) merged.set(notification.id, notification);
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Notifications</Text>
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
          <View
            key={notification.id}
            style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
          >
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{notification.title}</Text>
            <Text style={[styles.message, { color: theme.textSecondary }]}>{notification.message}</Text>
            <Text style={[styles.date, { color: theme.textMuted }]}>
              {new Date(notification.created_at).toLocaleString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10 },
  backCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  content: { padding: 18, gap: 12 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  message: { fontSize: 14, lineHeight: 21 },
  date: { fontSize: 11 },
});
