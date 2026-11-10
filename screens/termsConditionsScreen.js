// screens/termsConditionsScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const sections = [
  {
    title: '1. Prototype; no banking services',
    body: 'Westcott Reserve is a software prototype, not a licensed bank, financial institution, payment provider, or investment adviser. It does not offer deposit accounts, hold funds, provide credit, or execute regulated financial transactions.',
  },
  {
    title: '2. Illustrative features',
    body: 'Balances, account numbers, cards, transfers, receipts, exchange rates, stock information, and other financial displays may be sample, generated, or informational content. They do not represent real funds, completed payments, issued financial products, or investment advice. Do not rely on them for financial decisions or attempt to use them to pay, transfer, deposit, or withdraw money.',
  },
  {
    title: '3. Accounts and credentials',
    body: 'Use a unique password and non-sensitive information when creating an account. Keep your credentials private, use only accounts you are authorized to access, and notify the service operator if you believe someone else has accessed your account. Never provide credentials for another bank or service.',
  },
  {
    title: '4. Permitted use',
    body: 'Use the service lawfully and only for personal evaluation, demonstration, or testing. Do not attempt to disrupt the service, access another person’s account or data, or misrepresent the prototype as a licensed financial service.',
  },
  {
    title: '5. Third-party services',
    body: 'The prototype may rely on third-party providers for authentication, storage, email, push notifications, or app distribution. Their services are subject to their own terms and availability. The service operator configures these integrations.',
  },
  {
    title: '6. Availability and changes',
    body: 'Features may be incomplete, changed, interrupted, or withdrawn, and account data may be modified or removed by the service operator. The prototype is provided as available and is not a substitute for services from a regulated financial institution.',
  },
  {
    title: '7. Warranties and legal rights',
    body: 'To the extent permitted by applicable law, the prototype is provided without warranties that it will be uninterrupted, error-free, or suitable for a particular purpose. Nothing in these terms excludes rights that cannot legally be excluded.',
  },
  {
    title: '8. Updates and contact',
    body: 'These terms may be updated as the prototype changes. Questions about the terms or a deployed instance can be sent to support@westcottreserve.com. This general notice is not legal advice; the service operator should obtain jurisdiction-specific review before production use.',
  },
];

const TermsConditionsScreen = ({ navigation }) => {
  const { theme } = useAppTheme();

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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Terms & Conditions</Text>
        <Text style={[styles.lastUpdated, { color: theme.textMuted }]}>Last updated: November 2026</Text>

        <View style={styles.sections}>
          {sections.map((section) => (
            <View key={section.title} style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{section.title}</Text>
              <Text style={[styles.paragraph, { color: theme.textSecondary }]}>{section.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default TermsConditionsScreen;

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
  scrollContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40, gap: 14 },
  title: { fontSize: 24, fontWeight: '800' },
  lastUpdated: { fontSize: 12, marginTop: 4, marginBottom: 20 },
  sections: { gap: 12 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  paragraph: { fontSize: 13, lineHeight: 20 },
});