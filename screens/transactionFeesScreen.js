// screens/transactionFeesScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const TransactionFeesScreen = ({ navigation }) => {
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Transaction Fees</Text>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={[styles.row, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Airtime</Text>
            <Text style={[styles.valueText, { color: theme.textPrimary }]}>Free</Text>
          </View>

          <View style={[styles.row, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Data</Text>
            <Text style={[styles.valueText, { color: theme.textPrimary }]}>Free</Text>
          </View>

          <View style={[styles.row, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Other bills</Text>
            <Text style={[styles.valueText, { color: theme.textPrimary }]}>Free</Text>
          </View>

          <View style={[styles.row, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Westcott to Westcott transfers</Text>
            <Text style={[styles.valueText, { color: theme.textPrimary }]}>Free</Text>
          </View>

          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Westcott to other banks transfers</Text>
            <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default TransactionFeesScreen;

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
  card: { borderRadius: 20, paddingHorizontal: 18, borderWidth: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1 },
  label: { fontSize: 14, fontWeight: '500' },
  valueText: { fontSize: 14, fontWeight: '700' },
});