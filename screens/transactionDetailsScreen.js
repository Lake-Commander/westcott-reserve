import React from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const formatCurrency = (amount, currency) => {
  const value = Number(amount);
  const code = currency || 'USD';
  if (!Number.isFinite(value)) return `${code} 0.00`;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
};

const formatDate = (dateValue) => {
  if (!dateValue) return 'Not available';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

export default function TransactionDetailsScreen({ navigation, route }) {
  const { theme } = useAppTheme();
  const transaction = route.params?.transaction;

  if (!transaction) {
    return (
      <ScreenWrapper>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Transaction details are unavailable.
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
            <Text style={[styles.backText, { color: theme.accent }]}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const isCredit = transaction.type === 'CREDIT';
  const amount = Number(transaction.amount) || 0;
  const currency = route.params?.currency || transaction.currency || 'USD';
  const counterpart = isCredit
    ? transaction.counterparty || transaction.sender_name || transaction.receiver_name
    : transaction.receiver_name || transaction.counterparty;
  const reference = transaction.reference || transaction.idempotency_key || transaction.id;
  const timestamp = formatDate(transaction.created_at || transaction.timestamp);
  const accountNumber = transaction.account_number || transaction.receiver_account;
  const bank = transaction.bank_name || transaction.bank;
  const status = transaction.status
    ? String(transaction.status).replace(/[_-]/g, ' ').toUpperCase()
    : 'RECORDED';

  const receiptRows = [
    { label: isCredit ? 'Sender Name' : 'Beneficiary Name', value: counterpart },
    { label: 'Account Number', value: accountNumber },
    { label: 'Destination Bank', value: bank },
    { label: 'Date & Time', value: timestamp },
    { label: 'Transaction Type', value: transaction.category || (isCredit ? 'Credit' : 'Transfer') },
    { label: 'Status', value: status },
    { label: 'Reference Code', value: reference, reference: true },
    { label: 'Note', value: transaction.note },
  ].filter((row) => row.value);

  const handleShare = async () => {
    const receiptText = [
      'Westcott Reserve Transaction Receipt',
      '------------------------------',
      `${isCredit ? 'Amount received' : 'Amount sent'}: ${formatCurrency(amount, currency)}`,
      ...receiptRows.map(({ label, value }) => `${label}: ${value}`),
    ].join('\n');

    try {
      await Share.share({ message: receiptText });
    } catch (error) {
      Alert.alert('Share Error', error.message || 'Could not share this receipt.');
    }
  };

  const handleCopyReference = async () => {
    if (!reference) return;
    try {
      await Clipboard.setStringAsync(String(reference));
      Alert.alert('Reference copied', 'The transaction reference is on your clipboard.');
    } catch (error) {
      Alert.alert('Copy Error', error.message || 'Could not copy the transaction reference.');
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to transaction history"
          style={[styles.backButton, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.textPrimary }]}>Transaction receipt</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topIconContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark-sharp" size={34} color="#FFFFFF" />
          </View>
        </View>

        <Text style={[styles.successTitle, { color: theme.textPrimary }]}>
          {isCredit ? 'Payment Received' : 'Transfer Complete'}
        </Text>
        <Text style={[styles.successSubtitle, { color: theme.textSecondary }]}>
          Transaction details from your account history.
        </Text>

        <View style={[styles.receiptCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.amountLabel, { color: theme.textMuted }]}>
            {isCredit ? 'TOTAL AMOUNT RECEIVED' : 'TOTAL AMOUNT SENT'}
          </Text>
          <Text style={[styles.amountValue, { color: theme.textPrimary }]}>
            {formatCurrency(amount, currency)}
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          {receiptRows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.row,
                index === receiptRows.length - 1 && styles.lastRow,
                { borderBottomColor: theme.cardBorder },
              ]}
            >
              <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>{row.label}</Text>
              {row.reference ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Copy transaction reference"
                  disabled={!reference}
                  onPress={handleCopyReference}
                  style={styles.referenceButton}
                >
                  <Text style={[styles.refValue, { color: theme.textPrimary }]} numberOfLines={1}>
                    {String(row.value)}
                  </Text>
                  <Ionicons name="copy-outline" size={15} color={theme.accent} />
                </TouchableOpacity>
              ) : (
                <Text selectable style={[styles.rowValue, { color: theme.textPrimary }]}>
                  {String(row.value)}
                </Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            onPress={handleShare}
            activeOpacity={0.75}
          >
            <Ionicons name="share-outline" size={18} color={theme.textPrimary} />
            <Text style={[styles.shareButtonText, { color: theme.textPrimary }]}>Share receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: theme.accent }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Back to history</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 20, fontWeight: '800' },
  scrollContent: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 38 },
  topIconContainer: { marginBottom: 14 },
  successCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  successSubtitle: { fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 22, maxWidth: 300, lineHeight: 19 },
  receiptCard: { width: '100%', maxWidth: 560, borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 18 },
  amountLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textAlign: 'center' },
  amountValue: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 6, marginBottom: 12 },
  divider: { height: 1, marginVertical: 10 },
  row: { minHeight: 43, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  lastRow: { borderBottomWidth: 0 },
  rowLabel: { flex: 1, fontSize: 12, fontWeight: '500' },
  rowValue: { flex: 1.15, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  referenceButton: { flex: 1.15, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 7 },
  refValue: { flexShrink: 1, fontSize: 11, fontFamily: 'monospace', textAlign: 'right' },
  buttonGroup: { width: '100%', maxWidth: 560, gap: 11 },
  shareButton: { flexDirection: 'row', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1 },
  shareButtonText: { fontSize: 14, fontWeight: '700' },
  doneButton: { height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  doneButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyText: { fontSize: 15 },
  backText: { fontWeight: '700' },
});
