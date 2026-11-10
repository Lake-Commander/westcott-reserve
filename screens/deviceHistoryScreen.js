import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import { supabase } from '../services/supabaseClient';
import { DeviceHistoryService } from '../services/deviceHistoryService';

const DeviceHistoryScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const userId = useSelector((state) => state.userReducer?.user?.id);
  const [devices, setDevices] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      if (!userId) {
        setErrorMessage('Sign in to view device history.');
        setLoading(false);
        return;
      }

      try {
        const [sessionId, result] = await Promise.all([
          DeviceHistoryService.getCurrentSessionId(userId),
          supabase
            .from('device_sessions')
            .select('id,platform,model_name,os_version,app_version,first_seen_at,last_seen_at,signed_out_at')
            .eq('user_id', userId)
            .order('last_seen_at', { ascending: false })
            .limit(50),
        ]);
        if (result.error) throw result.error;
        if (!active) return;
        setCurrentSessionId(sessionId);
        setDevices(result.data || []);
      } catch (error) {
        if (active) setErrorMessage(error.message || 'Unable to load device history.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadHistory();
    return () => {
      active = false;
    };
  }, [userId]);

  const formatDate = (value) => {
    if (!value) return 'Unavailable';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString();
  };

  return (
    <ScreenWrapper>
      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.backCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Device History</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Recent app sessions for this account, recorded when you sign in on a device.
        </Text>
        <Text style={[styles.privacyNote, { color: theme.textMuted }]}>
          Device model, platform, app version, and session times are recorded. Location is not collected.
        </Text>

        {loading && <ActivityIndicator color={theme.accent} style={styles.loading} />}
        {!!errorMessage && (
          <Text style={[styles.errorMessage, { color: '#EF4444' }]}>{errorMessage}</Text>
        )}
        {!loading && !errorMessage && devices.length === 0 && (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No device sessions are recorded yet.
          </Text>
        )}

        {devices.map((item) => {
          const isCurrent = item.id === currentSessionId && !item.signed_out_at;
          const platformName = item.platform
            ? item.platform.charAt(0).toUpperCase() + item.platform.slice(1)
            : 'Unknown platform';
          const deviceIcon = item.platform === 'web' ? 'globe-outline' : 'phone-portrait-outline';

          return (
            <View
              key={item.id}
              style={[styles.deviceCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.deviceIconCircle, { backgroundColor: theme.surfaceLight }]}>
                  <Ionicons name={deviceIcon} size={20} color={theme.accent} />
                </View>
                <View style={styles.headerTextCol}>
                  <Text style={[styles.deviceModel, { color: theme.textPrimary }]}>
                    {item.model_name || platformName}
                  </Text>
                  <Text style={[styles.deviceMeta, { color: theme.textSecondary }]}>
                    {platformName} · OS {item.os_version || 'unknown'} · App {item.app_version || 'unknown'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
              <View style={styles.dateRow}>
                <Text style={[styles.dateLabel, { color: theme.textMuted }]}>First seen</Text>
                <Text style={[styles.dateValue, { color: theme.textSecondary }]}>
                  {formatDate(item.first_seen_at)}
                </Text>
              </View>
              <View style={styles.dateRow}>
                <Text style={[styles.dateLabel, { color: theme.textMuted }]}>Last seen</Text>
                <Text style={[styles.dateValue, { color: theme.textSecondary }]}>
                  {formatDate(item.last_seen_at)}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: isCurrent ? '#10B981' : '#94A3B8' }]} />
                <Text style={[styles.statusText, { color: isCurrent ? '#10B981' : theme.textMuted }]}>
                  {isCurrent ? 'Current session' : item.signed_out_at ? `Signed out ${formatDate(item.signed_out_at)}` : 'Previous session'}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default DeviceHistoryScreen;

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: 16, paddingVertical: 8 },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  scrollContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  privacyNote: { fontSize: 11, lineHeight: 17, marginTop: 7, marginBottom: 20 },
  loading: { marginVertical: 24 },
  errorMessage: { fontSize: 13, lineHeight: 19, marginVertical: 12 },
  emptyText: { fontSize: 13, marginTop: 16 },
  deviceCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  deviceIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerTextCol: { flex: 1 },
  deviceModel: { fontSize: 13.5, fontWeight: '800' },
  deviceMeta: { fontSize: 11, marginTop: 4, lineHeight: 16 },
  divider: { height: 1, marginVertical: 14 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  dateLabel: { fontSize: 11 },
  dateValue: { fontSize: 11, flexShrink: 1, textAlign: 'right' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
});
