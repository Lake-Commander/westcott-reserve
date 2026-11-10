import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const sections = [
  {
    title: 'Who operates the service',
    body: 'Westcott Reserve is a prototype. Its deployment is operated by the party that configured the application and its Supabase project. For questions about the specific deployment or a data request, contact support@westcottreserve.com.',
  },
  {
    title: 'Information processed',
    body: 'Depending on the features you use, the service may process your email address and authentication data; profile details such as name, username, and optional phone number; app preferences; support message subjects and contents; and account, transaction, or notification records created within the prototype. These records are illustrative and are not records of real banking activity.',
  },
  {
    title: 'Device and notification information',
    body: 'When you sign in, the app may record your device platform, model, operating-system version, app version, and sign-in/sign-out timestamps for the device-history screen. If you enable push notifications and grant device permission, an Expo push token and platform are stored so notifications can be sent to that device. You can disable push notifications in the app or device settings.',
  },
  {
    title: 'How information is used',
    body: 'Information is used to provide sign-in and app features, maintain account settings and device history, deliver requested customer-care replies and administrative emails, and send notifications where enabled. Do not use prototype balances or transaction records to make financial decisions.',
  },
  {
    title: 'Service providers and sharing',
    body: 'Authentication, database storage, and application data are provided through the Supabase project configured for the deployment. Administrative emails may be sent through Brevo, and push notifications may use Expo and the configured mobile push service. These providers process information needed for their services. The deployment operator controls provider configuration and access.',
  },
  {
    title: 'Storage and retention',
    body: 'Profile, support, device-session, push-token, and app data may remain in the configured database until the deployment operator deletes it or changes its retention settings. Local app preferences and sign-in session data may also be stored on your device. Contact the operator to ask about deletion or retention for this deployment.',
  },
  {
    title: 'Your choices and requests',
    body: 'You can change available profile and notification settings in the app, revoke notification permission in your device settings, and sign out to end the current session. For access, correction, or deletion requests, email support@westcottreserve.com. The deployment operator may need to verify your account before acting on a request.',
  },
  {
    title: 'Security',
    body: 'The operator configures access controls and security for each deployment, but no internet service can guarantee absolute security. This prototype is not designed to collect payment credentials or identity documents; do not submit them.',
  },
  {
    title: 'Changes to this notice',
    body: 'This notice may be revised when the app or its data practices change. The date below indicates the latest editorial update, not a guarantee that every deployment has identical configuration. This general notice is not legal advice; the service operator should obtain jurisdiction-specific review before production use.',
  },
];

const PrivacyPolicyScreen = ({ navigation }) => {
  const { theme } = useAppTheme();

  return (
    <ScreenWrapper>
      <View style={styles.topBar}>
        <TouchableOpacity style={[styles.backCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Privacy Policy</Text>
        <Text style={[styles.updated, { color: theme.textMuted }]}>Last updated: November 2026</Text>
        {sections.map((section) => (
          <View key={section.title} style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{section.title}</Text>
            <Text style={[styles.text, { color: theme.textSecondary }]}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: 16, paddingVertical: 8 },
  backCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  content: { padding: 18, gap: 14 },
  title: { fontSize: 24, fontWeight: '800' },
  updated: { fontSize: 12 },
  card: { borderRadius: 18, borderWidth: 1, padding: 18, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  text: { fontSize: 14, lineHeight: 22 },
});
