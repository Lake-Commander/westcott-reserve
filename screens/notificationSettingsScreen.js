// screens/notificationSettingsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const NotificationSettingsScreen = ({ navigation }) => {
  const { theme } = useAppTheme();

  const [emailNotif, setEmailNotif] = useState(true);
  const [appNotif, setAppNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

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

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {/* Email Row */}
          <View style={[styles.row, { borderBottomColor: theme.cardBorder }]}>
            <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="mail-outline" size={18} color="#7052FF" />
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Email</Text>
              <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>
                Receive transaction notifications & receipts via email.
              </Text>
            </View>
            <Switch
              value={emailNotif}
              onValueChange={setEmailNotif}
              trackColor={{ false: theme.surfaceLight, true: '#7052FF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* App Notifications Row */}
          <View style={[styles.row, { borderBottomColor: theme.cardBorder }]}>
            <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="flash-outline" size={18} color="#7052FF" />
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>App Notifications</Text>
              <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>
                Receive transaction notifications & alerts in app.
              </Text>
            </View>
            <Switch
              value={appNotif}
              onValueChange={setAppNotif}
              trackColor={{ false: theme.surfaceLight, true: '#7052FF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* SMS Row */}
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="chatbox-outline" size={18} color="#7052FF" />
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>SMS</Text>
              <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>
                Receive transaction notifications via SMS. Charges may apply.
              </Text>
            </View>
            <Switch
              value={smsNotif}
              onValueChange={setSmsNotif}
              trackColor={{ false: theme.surfaceLight, true: '#7052FF' }}
              thumbColor="#FFFFFF"
            />
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
  card: { borderRadius: 20, paddingHorizontal: 16, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, gap: 14 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  textCol: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowDesc: { fontSize: 11.5, lineHeight: 16, marginTop: 2 },
});