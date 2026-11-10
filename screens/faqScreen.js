import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const faqs = [
  { q: 'Is Westcott Reserve a real bank?', a: 'No. Westcott Reserve is a banking software prototype, not a licensed bank or financial institution, and it does not provide regulated financial services.' },
  { q: 'Can I deposit or transfer real money?', a: 'No. The app does not hold funds or connect its prototype transfers, cards, receipts, or account balances to payment networks.' },
  { q: 'Are market prices or exchange rates advice?', a: 'No. Any market information shown is informational, may be delayed or unavailable, and is not investment advice. Do not rely on it for financial decisions.' },
  { q: 'What details should I use?', a: 'Use a unique password and non-sensitive test profile details. Never enter another bank’s credentials, payment card details, identity documents, or a password reused from another service.' },
  { q: 'What information may the app store?', a: 'The configured service may store account and profile information, prototype activity, preferences, support messages, basic device-session details, and push tokens if push notifications are enabled. See the privacy policy for details.' },
  { q: 'How do I manage notifications?', a: 'Manage in-app and push notification preferences in the app. Push notifications require device permission and project configuration; you can also revoke permission in your device settings.' },
  { q: 'How do I contact customer care?', a: 'Use the customer-care form in the app or email support@westcottreserve.com. Do not include passwords, payment information, or identity documents.' },
  { q: 'How do I download the Android app?', a: 'Use the download page to obtain the installer. It is distributed outside Google Play, so Android may ask you to allow installation from your browser. Install it only if you trust the source.' },
];

const FaqScreen = ({ navigation }) => {
  const { theme } = useAppTheme();

  return (
    <ScreenWrapper>
      <View style={styles.topBar}>
        <TouchableOpacity style={[styles.backCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>FAQs</Text>
        {faqs.map((item) => (
          <View key={item.q} style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.question, { color: theme.textPrimary }]}>{item.q}</Text>
            <Text style={[styles.answer, { color: theme.textSecondary }]}>{item.a}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default FaqScreen;

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: 16, paddingVertical: 8 },
  backCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  content: { padding: 18, gap: 14 },
  title: { fontSize: 24, fontWeight: '800' },
  card: { borderRadius: 18, borderWidth: 1, padding: 18, gap: 8 },
  question: { fontSize: 15, fontWeight: '700' },
  answer: { fontSize: 13, lineHeight: 20 },
});
