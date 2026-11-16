// screens/securityScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import { getAppSettings, updateAppSettings } from '../services/appSettingsService';
import { AuthService } from '../services/authService';

const SecurityScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.userReducer?.user?.id);
  const reduxUser = useSelector((state) => state.userReducer?.user);

  const [useBiometrics, setUseBiometrics] = useState(true);
  const [showBalanceOnLaunch, setShowBalanceOnLaunch] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [phoneDraft, setPhoneDraft] = useState(reduxUser?.phone === 'unverified' ? '' : reduxUser?.phone || '');
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [mpinOpen, setMpinOpen] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentMpin, setCurrentMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');

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

  const saveProfileDetails = async () => {
    setProfileBusy(true);
    setSettingsError('');
    try {
      const updated = await AuthService.updateProfile({ phone: phoneDraft });
      dispatch({ type: 'SET_USER', payload: updated });
      setPhoneDraft(updated.phone || '');
      Alert.alert('Profile updated', 'Your phone number has been saved.');
    } catch (error) {
      setSettingsError(error.message || 'Unable to save profile details.');
    } finally {
      setProfileBusy(false);
    }
  };

  const savePassword = async () => {
    if (newPassword.length < 8) {
      setSettingsError('Your new password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSettingsError('The new passwords do not match.');
      return;
    }
    setPasswordBusy(true);
    setSettingsError('');
    try {
      await AuthService.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordOpen(false);
      Alert.alert('Password changed', 'Your password has been updated successfully.');
    } catch (error) {
      setSettingsError(error.message || 'Unable to change your password.');
    } finally {
      setPasswordBusy(false);
    }
  };

  const saveMpin = async () => {
    if (!/^\d{4}$/.test(currentMpin) || !/^\d{4}$/.test(newMpin)) {
      setSettingsError('Enter your current MPIN and a new 4-digit MPIN.');
      return;
    }
    if (newMpin !== confirmMpin) {
      setSettingsError('The new MPINs do not match.');
      return;
    }
    if (currentMpin === newMpin) {
      setSettingsError('Your new MPIN must be different from the current MPIN.');
      return;
    }
    setProfileBusy(true);
    setSettingsError('');
    try {
      const valid = await AuthService.verifyMpin(userId, currentMpin);
      if (!valid) throw new Error('Your current MPIN is incorrect.');
      const updated = await AuthService.updateProfile({ mpin: newMpin });
      dispatch({ type: 'SET_USER', payload: updated });
      setCurrentMpin('');
      setNewMpin('');
      setConfirmMpin('');
      setMpinOpen(false);
      Alert.alert('MPIN changed', 'Your transaction MPIN has been updated successfully.');
    } catch (error) {
      setSettingsError(error.message || 'Unable to change your MPIN.');
    } finally {
      setProfileBusy(false);
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
            onPress={() => { setPasswordOpen((open) => !open); setMpinOpen(false); setSettingsError(''); }}
            activeOpacity={0.7}
          >
            <View style={styles.leftCol}>
              <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="key-outline" size={18} color="#7052FF" />
              </View>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Change Password</Text>
            </View>
            <Ionicons name={passwordOpen ? 'chevron-up' : 'chevron-forward'} size={16} color={theme.textMuted} />
          </TouchableOpacity>
          {passwordOpen && (
            <View style={[styles.formSection, { borderBottomColor: theme.cardBorder }]}>
              <Text style={[styles.formHint, { color: theme.textSecondary }]}>Confirm your current password before choosing a new one.</Text>
              <TextInput style={[styles.input, styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current password" placeholderTextColor={theme.textMuted} secureTextEntry />
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]} value={newPassword} onChangeText={setNewPassword} placeholder="New password (8+ characters)" placeholderTextColor={theme.textMuted} secureTextEntry />
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" placeholderTextColor={theme.textMuted} secureTextEntry />
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.accent }]} onPress={savePassword} disabled={passwordBusy}>
                {passwordBusy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Update password</Text>}
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.editSection, { borderBottomColor: theme.cardBorder }]}>
            <View style={styles.leftCol}>
              <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="person-circle-outline" size={18} color="#7052FF" />
              </View>
              <View style={styles.editCopy}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Edit account details</Text>
                <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>
                  Update your phone number and transaction MPIN.
                </Text>
              </View>
            </View>
            <TextInput
              accessibilityLabel="Phone Number"
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
              value={phoneDraft}
              onChangeText={setPhoneDraft}
              keyboardType="phone-pad"
              placeholder="Phone number"
              placeholderTextColor={theme.textMuted}
            />
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.accent }]} onPress={saveProfileDetails} disabled={profileBusy}>
              {profileBusy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save changes</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: theme.cardBorder }]}
            onPress={() => { setMpinOpen((open) => !open); setPasswordOpen(false); setSettingsError(''); }}
            activeOpacity={0.7}
          >
            <View style={styles.leftCol}>
              <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="keypad-outline" size={18} color="#7052FF" />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Change MPIN</Text>
                <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>Update the 4-digit PIN used for transactions.</Text>
              </View>
            </View>
            <Ionicons name={mpinOpen ? 'chevron-up' : 'chevron-forward'} size={16} color={theme.textMuted} />
          </TouchableOpacity>
          {mpinOpen && (
            <View style={[styles.formSection, { borderBottomColor: theme.cardBorder }]}>
              <Text style={[styles.formHint, { color: theme.textSecondary }]}>For your security, enter your current MPIN first.</Text>
              <TextInput style={[styles.input, styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]} value={currentMpin} onChangeText={(value) => setCurrentMpin(value.replace(/\D/g, '').slice(0, 4))} placeholder="Current 4-digit MPIN" placeholderTextColor={theme.textMuted} keyboardType="number-pad" secureTextEntry maxLength={4} />
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]} value={newMpin} onChangeText={(value) => setNewMpin(value.replace(/\D/g, '').slice(0, 4))} placeholder="New 4-digit MPIN" placeholderTextColor={theme.textMuted} keyboardType="number-pad" secureTextEntry maxLength={4} />
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]} value={confirmMpin} onChangeText={(value) => setConfirmMpin(value.replace(/\D/g, '').slice(0, 4))} placeholder="Confirm new MPIN" placeholderTextColor={theme.textMuted} keyboardType="number-pad" secureTextEntry maxLength={4} />
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.accent }]} onPress={saveMpin} disabled={profileBusy}>
                {profileBusy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Update MPIN</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Biometrics Toggle */}
          <View style={[styles.row, { borderBottomColor: theme.cardBorder }]}>
            <View style={styles.leftCol}>
              <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="scan-outline" size={18} color="#7052FF" />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Face ID / Fingerprint</Text>
                <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>Coming soon</Text>
              </View>
            </View>
            <Switch
              value={false}
              disabled
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
                  When off, your balance starts hidden. Use the eye on Home to show or hide it anytime.
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
  editSection: { paddingVertical: 18, borderBottomWidth: 1 },
  leftCol: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  editCopy: { flex: 1 },
  formSection: { paddingVertical: 16, borderBottomWidth: 1 },
  formHint: { fontSize: 12, lineHeight: 18, marginBottom: 4 },
  formInput: { marginTop: 8 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginTop: 10 },
  saveButton: { borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginTop: 12 },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  iconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowDescription: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  balanceSettingCopy: { flex: 1 },
  balanceSettingText: { flex: 1 },
  settingsError: { color: '#EF4444', fontSize: 12, marginBottom: 12 },
});