// screens/accountLimitsScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const AccountLimitsScreen = ({ navigation }) => {
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Account Limits</Text>

        {/* Tier Details Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardHeaderTitle, { color: theme.textPrimary }]}>Tier 1 Account</Text>
              <Text style={styles.completedBadge}>Current prototype tier</Text>
            </View>
            <Ionicons name="ribbon" size={32} color="#D4AF37" />
          </View>

          <Text style={[styles.limitLabel, { color: theme.textSecondary }]}>
            Limits shown below are illustrative and are not linked to identity verification.
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          {/* Transfer Limits */}
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Westcott to Westcott</Text>
          <View style={styles.limitRow}>
            <Text style={[styles.limitLabel, { color: theme.textSecondary }]}>Single Transfers</Text>
            <Text style={[styles.limitValue, { color: theme.textPrimary }]}>$20,000.00</Text>
          </View>
          <View style={styles.limitRow}>
            <Text style={[styles.limitLabel, { color: theme.textSecondary }]}>Daily Limit</Text>
            <Text style={[styles.limitValue, { color: theme.textPrimary }]}>$50,000.00</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Westcott to other banks</Text>
          <View style={styles.limitRow}>
            <Text style={[styles.limitLabel, { color: theme.textSecondary }]}>Single Transfers</Text>
            <Text style={[styles.limitValue, { color: theme.textPrimary }]}>$20,000.00</Text>
          </View>
          <View style={styles.limitRow}>
            <Text style={[styles.limitLabel, { color: theme.textSecondary }]}>Daily Limit</Text>
            <Text style={[styles.limitValue, { color: theme.textPrimary }]}>$50,000.00</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default AccountLimitsScreen;

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: 16, paddingVertical: 8 },
  backCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  card: { borderRadius: 20, padding: 20, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800' },
  completedBadge: { color: '#10B981', fontSize: 12, fontWeight: '600', marginTop: 4 },
  divider: { height: 1, marginVertical: 16 },
  sectionHeading: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  limitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  limitLabel: { fontSize: 13 },
  limitValue: { fontSize: 13, fontWeight: '700' },
});