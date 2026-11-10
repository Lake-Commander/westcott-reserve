// screens/notificationSettingsScreen.js
import React, { useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import { getAppSettings, updateAppSettings } from '../services/appSettingsService';
import { registerPushNotifications, unregisterPushNotifications } from '../services/pushNotificationService';

const NotificationSettingsScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const userId = useSelector((state) => state.userReducer?.user?.id);

  const [pushNotif, setPushNotif] = useState(false);
  const [appNotif, setAppNotif] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    if (!userId) {
      setLoading(false);
      setErrorMessage('Sign in to manage notification settings.');
      return () => {
        active = false;
      };
    }

    getAppSettings(userId)
      .then((settings) => {
        if (!active) return;
        setPushNotif(settings.push_notifications_enabled);
        setAppNotif(settings.in_app_notifications_enabled);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.message || 'Unable to load notification settings.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const toggleAppNotifications = async (enabled) => {
    setBusy(true);
    setErrorMessage('');
    try {
      const saved = await updateAppSettings(userId, {
        in_app_notifications_enabled: enabled,
      });
      setAppNotif(saved.in_app_notifications_enabled);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to save in-app notification settings.');
      Alert.alert('Setting not saved', error.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const togglePushNotifications = async (enabled) => {
    setBusy(true);
    setErrorMessage('');
    try {
      if (enabled) {
        await registerPushNotifications(userId);
        const saved = await updateAppSettings(userId, {
          push_notifications_enabled: true,
        });
        setPushNotif(saved.push_notifications_enabled);
      } else {
        const saved = await updateAppSettings(userId, {
          push_notifications_enabled: false,
        });
        setPushNotif(saved.push_notifications_enabled);
        await unregisterPushNotifications(userId);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Unable to update push notification settings.');
      Alert.alert('Push notifications not updated', error.message || 'Please try again.');
    } finally {
      setBusy(false);
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Notification Settings</Text>
        <Text style={[styles.intro, { color: theme.textSecondary }]}>
          Choose which account notifications you receive. Push alerts can appear while you are signed in or when the app is in the background.
        </Text>
        {!!errorMessage && (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        )}

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {/* Push Row */}
          <View style={[styles.row, { borderBottomColor: theme.cardBorder }]}>
            <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="phone-portrait-outline" size={18} color="#7052FF" />
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Push Notifications</Text>
              <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>
                Receive admin-published alerts on this device, including while signed in or when the app is in the background. Device permission and project setup are required.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Push notifications"
              value={pushNotif}
              onValueChange={togglePushNotifications}
              disabled={loading || busy || !userId}
              trackColor={{ false: theme.surfaceLight, true: '#7052FF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.row, { borderBottomColor: theme.cardBorder }]}>
            <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="notifications-outline" size={18} color="#7052FF" />
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>App Notifications</Text>
              <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>
                Show transaction updates and admin announcements in your signed-in notification inbox.
              </Text>
            </View>
            <Switch
              accessibilityLabel="App notifications"
              value={appNotif}
              onValueChange={toggleAppNotifications}
              disabled={loading || busy || !userId}
              trackColor={{ false: theme.surfaceLight, true: '#7052FF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="mail-outline" size={18} color={theme.textMuted} />
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.rowTitle, { color: theme.textMuted }]}>Email and SMS</Text>
              <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>
                Coming soon. Delivery will be configured after the email/SMS provider is set up.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default NotificationSettingsScreen;

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
  intro: { fontSize: 13, lineHeight: 19, marginTop: -12, marginBottom: 18 },
  errorMessage: { color: '#EF4444', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  card: { borderRadius: 20, paddingHorizontal: 16, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, gap: 14 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  textCol: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowDesc: { fontSize: 11.5, lineHeight: 16, marginTop: 2 },
});