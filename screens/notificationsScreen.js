import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import { supabase } from '../services/supabaseClient';

export default function NotificationsScreen({ navigation }) {
  const { theme } = useAppTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    const loadNotifications = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session?.user) throw new Error('Sign in to view your notifications.');

        const { data, error } = await supabase
          .from('admin_notifications')
          .select('id,title,message,created_at')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        if (active) setNotifications(data || []);
      } catch (error) {
        if (active) setErrorMessage(error.message || 'Unable to load notifications.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadNotifications();
    return () => {
      active = false;
    };
  }, []);

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
          <Text style={{ color: theme.textSecondary }}>You’re all caught up.</Text>
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
