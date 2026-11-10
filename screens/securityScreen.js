// screens/securityScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import { getAppSettings, updateAppSettings } from '../services/appSettingsService';

const SecurityScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const userId = useSelector((state) => state.userReducer?.user?.id);

  const [useBiometrics, setUseBiometrics] = useState(true);
  const [showBalanceOnLaunch, setShowBalanceOnLaunch] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  useEffect(() => {
    let active = true;
    if (!userId) {
      setSettingsLoading(false);
      setSettingsError('Sign in to manage account-specific security settings.');
      return () => {
        active = false;
      };
    }

    getAppSettings(userId)
      .then((settings) => {
        if (active) setShowBalanceOnLaunch(settings.show_balance_on_launch);
      })
      .catch((error) => {
        if (active) setSettingsError(error.message || 'Unable to load security settings.');
      })
      .finally(() => {
        if (active) setSettingsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const saveShowBalanceSetting = async (enabled) => {
    if (!userId) return;
    const previousValue = showBalanceOnLaunch;
    setShowBalanceOnLaunch(enabled);
    setSettingsBusy(true);
    setSettingsError('');
    try {
      const saved = await updateAppSettings(userId, {
        show_balance_on_launch: enabled,
      });
      setShowBalanceOnLaunch(saved.show_balance_on_launch);
    } catch (error) {
      setShowBalanceOnLaunch(previousValue);
      setSettingsError(error.message || 'Unable to save the balance display setting.');
      Alert.alert('Setting not saved', error.message || 'Please try again.');
    } finally {
      setSettingsBusy(false);
    }
  };

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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Security</Text>
        {!!settingsError && (
          <Text style={styles.settingsError}>{settingsError}</Text>
        )}

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {/* Change Password */}
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: theme.cardBorder }]}
            onPress={() => Alert.alert('Change Password', 'Password update link sent to your email.')}
            activeOpacity={0.7}
          >
            <View style={styles.leftCol}>
              <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="key-outline" size={18} color="#7052FF" />
              </View>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Change PIN */}
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: theme.cardBorder }]}
            onPress={() => Alert.alert('Change PIN', 'Enter your current 4-digit PIN.')}
            activeOpacity={0.7}
          >
            <View style={styles.leftCol}>
              <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="calculator-outline" size={18} color="#7052FF" />
              </View>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Change Transaction PIN</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Biometrics Toggle */}
          <View style={[styles.row, { borderBottomColor: theme.cardBorder }]}>
            <View style={styles.leftCol}>
              <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="scan-outline" size={18} color="#7052FF" />
              </View>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Use Face ID / Finger Print</Text>
            </View>
            <Switch
              value={useBiometrics}
              onValueChange={setUseBiometrics}
              trackColor={{ false: theme.surfaceLight, true: '#7052FF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: theme.cardBorder }]}
            onPress={() => navigation.navigate('mfaSettings')}
            activeOpacity={0.7}
          >
            <View style={styles.leftCol}>
              <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="shield-outline" size={18} color="#7052FF" />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Two-factor authentication</Text>
                <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>
                  Set up or manage an authenticator app.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Account-specific balance display preference */}
          <View style={[styles.row, { borderBottomColor: theme.cardBorder }]}>
            <View style={[styles.leftCol, styles.balanceSettingCopy]}>
              <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="eye-outline" size={18} color="#7052FF" />
              </View>
              <View style={styles.balanceSettingText}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Show balance on launch</Text>
                <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>
                  When off, the eye control cannot reveal your balance.
                </Text>
              </View>
            </View>
            <Switch
              accessibilityLabel="Show balance on launch"
              value={showBalanceOnLaunch}
              onValueChange={saveShowBalanceSetting}
              disabled={settingsLoading || settingsBusy || !userId}
              trackColor={{ false: theme.surfaceLight, true: '#7052FF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Distress Settings */}
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 0 }]}
            onPress={() => Alert.alert('Distress Settings', 'Configure panic PIN and hidden account view.')}
            activeOpacity={0.7}
          >
            <View style={styles.leftCol}>
              <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="warning-outline" size={18} color="#7052FF" />
              </View>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Distress Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default SecurityScreen;

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
  scrollContent: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  card: { borderRadius: 20, paddingHorizontal: 16, borderWidth: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1 },
  leftCol: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowDescription: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  balanceSettingCopy: { flex: 1 },
  balanceSettingText: { flex: 1 },
  settingsError: { color: '#EF4444', fontSize: 12, marginBottom: 12 },
});