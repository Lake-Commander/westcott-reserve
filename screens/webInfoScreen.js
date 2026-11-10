import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { WebAnchor } from '../components/WebAnchor';
import BrandLockup from '../components/BrandLockup';

const CONTENT = {
  '/privacy-policy': {
    title: 'Privacy policy',
    intro: 'This notice describes the information the current Westcott Reserve prototype processes and the choices available to you.',
    sections: [
      ['Who operates the service', 'Westcott Reserve is a prototype. Its deployment is operated by the party that configured the application and its Supabase project. For questions about the specific deployment or a data request, contact support@westcottreserve.com.'],
      ['Information processed', 'Depending on the features you use, the service may process your email address and authentication data; profile details such as name, username, and optional phone number; app preferences; support message subjects and contents; and account, transaction, or notification records created within the prototype. These records are illustrative and are not records of real banking activity.'],
      ['Device and notification information', 'When you sign in, the app may record your device platform, model, operating-system version, app version, and sign-in/sign-out timestamps for the device-history screen. If you enable push notifications and grant device permission, an Expo push token and platform are stored so notifications can be sent to that device. You can disable push notifications in the app or device settings.'],
      ['How information is used', 'Information is used to provide sign-in and app features, maintain account settings and device history, deliver requested customer-care replies and administrative emails, and send notifications where enabled. Do not use prototype balances or transaction records to make financial decisions.'],
      ['Service providers and sharing', 'Authentication, database storage, and application data are provided through the Supabase project configured for the deployment. Administrative emails may be sent through Brevo, and push notifications may use Expo and the configured mobile push service. These providers process information needed for their services. The deployment operator controls provider configuration and access.'],
      ['Storage and retention', 'Profile, support, device-session, push-token, and app data may remain in the configured database until the deployment operator deletes it or changes its retention settings. Local app preferences and sign-in session data may also be stored on your device. Contact the operator to ask about deletion or retention for this deployment.'],
      ['Your choices and requests', 'You can change available profile and notification settings in the app, revoke notification permission in your device settings, and sign out to end the current session. For access, correction, or deletion requests, email support@westcottreserve.com. The deployment operator may need to verify your account before acting on a request.'],
      ['Security', 'The operator configures access controls and security for each deployment, but no internet service can guarantee absolute security. This prototype is not designed to collect payment credentials or identity documents; do not submit them.'],
      ['Changes to this notice', 'This notice may be revised when the app or its data practices change. The date below indicates the latest editorial update, not a guarantee that every deployment has identical configuration.'],
    ],
  },
  '/terms': {
    title: 'Terms and conditions',
    intro: 'These terms describe the current prototype. By using it, you agree to use it only for evaluation and testing.',
    sections: [
      ['Prototype; no banking services', 'Westcott Reserve is a software prototype, not a licensed bank, financial institution, payment provider, or investment adviser. It does not offer deposit accounts, hold funds, provide credit, or execute regulated financial transactions.'],
      ['Illustrative features and no financial reliance', 'Balances, account numbers, cards, transfers, receipts, exchange rates, stock information, and other financial displays may be sample, generated, or informational content. They do not represent real funds, completed payments, issued financial products, or investment advice. Do not rely on them for financial decisions or attempt to use them to pay, transfer, deposit, or withdraw money.'],
      ['Account and credentials', 'Use a unique password and non-sensitive information when creating an account. Keep your credentials private, use only accounts you are authorized to access, and notify the service operator if you believe someone else has accessed your account. Never provide credentials for another bank or service.'],
      ['Permitted use', 'Use the service lawfully and only for personal evaluation, demonstration, or testing. Do not attempt to disrupt the service, access another person’s account or data, or misrepresent the prototype as a licensed financial service.'],
      ['Third-party services', 'The prototype may rely on third-party providers for authentication, storage, email, push notifications, or app distribution. Their services are subject to their own terms and availability. The service operator configures these integrations.'],
      ['Availability and changes', 'Features may be incomplete, changed, interrupted, or withdrawn, and account data may be modified or removed by the service operator. The prototype is provided as available and is not a substitute for services from a regulated financial institution.'],
      ['No warranties; limitation', 'To the extent permitted by applicable law, the prototype is provided without warranties that it will be uninterrupted, error-free, or suitable for a particular purpose. Nothing in these terms excludes rights that cannot legally be excluded.'],
      ['Changes and contact', 'These terms may be updated as the prototype changes. Continued use after an update means you accept the revised terms to the extent permitted by law. Questions about the terms or a deployed instance can be sent to support@westcottreserve.com.'],
    ],
  },
  '/faqs': {
    title: 'Frequently asked questions',
    intro: 'Practical answers about the prototype, account access, privacy, and downloads.',
    sections: [
      ['Is Westcott Reserve a real bank?', 'No. It is a banking software prototype, not a licensed bank or financial institution, and it does not provide regulated financial services.'],
      ['Can I deposit or transfer real money?', 'No. The app does not hold funds or connect its prototype transfers, cards, receipts, or account balances to payment networks.'],
      ['Are stock prices or exchange rates real-time financial advice?', 'No. Market data, where shown, is informational and may be delayed or unavailable. It is not investment advice and should not be used to make financial decisions.'],
      ['What details should I use?', 'Use a unique password and non-sensitive test profile details. Do not enter another bank’s credentials, payment card details, identity documents, or passwords reused from other services.'],
      ['What information does the app store?', 'The configured service may store account and profile information, prototype activity, preferences, customer-care messages, basic device-session details, and push tokens if push notifications are enabled. See the privacy policy for more information.'],
      ['How do I manage notifications?', 'Manage in-app and push notification preferences in the app. Push notifications require device permission and project configuration; you can revoke permission in your device settings.'],
      ['How do I contact customer care?', 'Use the customer-care form in the app or email support@westcottreserve.com. Do not include passwords, payment details, or identity documents.'],
      ['How do I download the Android app?', 'Use the download page to obtain the installer. It is distributed outside Google Play, so Android may ask you to allow installation from your browser. Install it only if you trust the source.'],
    ],
  },
};

export default function WebInfoScreen() {
  const isDark = useColorScheme() === 'dark';
  const path = Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.pathname.replace(/\/+$/, '') || '/'
    : '/terms';
  const content = CONTENT[path] || CONTENT['/terms'];
  const palette = isDark
    ? { background: '#10151D', surface: '#171E29', text: '#F4F6F8', muted: '#B0BAC8', border: '#2B3543', link: '#93B8FF' }
    : { background: '#F6F8FB', surface: '#FFFFFF', text: '#172033', muted: '#5D6878', border: '#E1E6EE', link: '#245BB5' };

  return (
    <View style={[styles.page, { backgroundColor: palette.background }]}>
      <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <WebAnchor href="/" target="_self" style={styles.brand}>
          <BrandLockup dark={isDark} subtitle="A clearer view of your finances" />
        </WebAnchor>
        <View style={styles.headerLinks}>
          <WebAnchor href="/download-app" target="_self" style={styles.navLink}>
            <Text style={{ color: palette.link }}>Get the app</Text>
          </WebAnchor>
          <WebAnchor href="/" target="_self" style={styles.navLink}>
            <Text style={{ color: palette.link }}>Home</Text>
          </WebAnchor>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={[styles.eyebrow, { color: palette.link }]}>WESTCOTT RESERVE · INFORMATION</Text>
          <Text style={[styles.title, { color: palette.text }]}>{content.title}</Text>
          <Text style={[styles.intro, { color: palette.muted }]}>{content.intro}</Text>
          <View style={styles.sections}>
            {content.sections.map(([heading, paragraph]) => (
              <View key={heading} style={[styles.section, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>{heading}</Text>
                <Text style={[styles.paragraph, { color: palette.muted }]}>{paragraph}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.updated, { color: palette.muted }]}>Last updated: November 2026. This is general product information, not legal advice.</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: palette.border }]}>
        <Text style={[styles.footerText, { color: palette.muted }]}>© {new Date().getFullYear()} Westcott Reserve</Text>
        <View style={styles.footerLinks}>
          <WebAnchor href="/privacy-policy" target="_self" style={styles.footerLink}><Text style={{ color: palette.link }}>Privacy</Text></WebAnchor>
          <WebAnchor href="/terms" target="_self" style={styles.footerLink}><Text style={{ color: palette.link }}>Terms</Text></WebAnchor>
          <WebAnchor href="/faqs" target="_self" style={styles.footerLink}><Text style={{ color: palette.link }}>FAQs</Text></WebAnchor>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: '100vh' },
  header: { minHeight: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, borderBottomWidth: 1 },
  brand: { textDecorationLine: 'none' },
  headerLinks: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  navLink: { paddingVertical: 10, fontSize: 13, fontWeight: '700' },
  scrollContent: { flexGrow: 1, paddingVertical: 52, paddingHorizontal: 22 },
  content: { width: '100%', maxWidth: 850, alignSelf: 'center', gap: 15 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  title: { fontSize: 38, fontWeight: '700', letterSpacing: -0.8 },
  intro: { fontSize: 16, lineHeight: 24, marginBottom: 8 },
  sections: { gap: 12 },
  section: { borderWidth: 1, borderRadius: 16, padding: 20, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  paragraph: { fontSize: 14, lineHeight: 22 },
  updated: { fontSize: 11, marginTop: 6 },
  footer: { minHeight: 62, paddingHorizontal: 28, paddingVertical: 14, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  footerText: { fontSize: 11 },
  footerLinks: { flexDirection: 'row', gap: 18 },
  footerLink: { paddingVertical: 6, fontSize: 11 },
});
