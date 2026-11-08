// screens/deviceHistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const DeviceHistoryScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const currentUser = useSelector((state) => state.userReducer?.user);

  const [devices, setDevices] = useState([]);

  useEffect(() => {
    // Populate active session matching current device specs
    const activeDevice = {
      id: 'dev_1',
      model: Platform.OS === 'android' ? 'TECNO TECNO KN4, ANDROID' : 'IPHONE 14 PRO, IOS',
      lastSeen: 'Nov 07, 2026 • 08:58 AM',
      location: 'Port-Harcourt, Rivers, Nigeria',
      isCurrent: true,
    };
    setDevices([activeDevice]);
  }, [currentUser]);

  return (
    <ScreenWrapper>
      <View style={styles.topBar}>
        <TouchableOpacity
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
          These are the devices that have logged into your account recently
        </Text>

        {devices.map((item) => (
          <View
            key={item.id}
            style={[styles.deviceCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.deviceIconCircle, { backgroundColor: theme.surfaceLight }]}>
                <Ionicons
                  name={Platform.OS === 'android' ? 'phone-portrait-outline' : 'phone-portrait'}
                  size={20}
                  color="#7052FF"
                />
              </View>

              <View style={styles.headerTextCol}>
                <Text style={[styles.deviceModel, { color: theme.textPrimary }]}>{item.model}</Text>
                <Text style={[styles.lastSeen, { color: theme.textMuted }]}>{item.lastSeen}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={theme.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.locationText, { color: theme.textSecondary }]}>{item.location}</Text>
            </View>
          </View>
        ))}
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
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 24, lineHeight: 18 },
  deviceCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerTextCol: { flex: 1 },
  deviceModel: { fontSize: 13.5, fontWeight: '800', letterSpacing: 0.3 },
  lastSeen: { fontSize: 12, marginTop: 3 },
  divider: { height: 1, marginVertical: 14 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: { fontSize: 12.5, fontWeight: '500' },
});