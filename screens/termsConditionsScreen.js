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

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>1. General Disclaimer</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Westcott Reserve Bank is a simulated digital banking application developed strictly for educational, demonstration, and prototype testing purposes. No real monetary transactions, deposits, or withdrawals are conducted within this application.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>2. Account & Balances</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            All account balances, credit lines, transfer receipts, and financial metrics generated or displayed within the application represent virtual test values. They hold zero monetary value and cannot be redeemed, exchanged, or converted into real currency.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>3. User Privacy & Data Handling</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Westcott Reserve does not collect, track, or share sensitive real-world personal identification, financial history, or device data. Account profile entries are stored securely within your configured instance for simulation fidelity.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>4. System Availability</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            The service is provided on an "as is" and "as available" basis without warranties of any kind. Features, API endpoints, and mock records may be updated, reset, or modified at any time without prior notice.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>5. Contact & Inquiries</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            For questions regarding these Terms & Conditions or platform operations, please reach out through the Contact Us menu in your profile settings.
          </Text>
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
  scrollContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800' },
  lastUpdated: { fontSize: 12, marginTop: 4, marginBottom: 20 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  paragraph: { fontSize: 13, lineHeight: 20 },
});