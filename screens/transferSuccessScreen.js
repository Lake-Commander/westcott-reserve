// screens/transferSuccessScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const TransferSuccessScreen = ({ navigation, route }) => {
  const { theme } = useAppTheme();
  const receipt = route?.params?.receipt || {};

  const amount = receipt.amount ? parseFloat(receipt.amount) : 0;
  const currency = receipt.currency || 'USD';
  const recipient = receipt.recipient || 'Counterparty';
  const accNum = receipt.account_number || '••••••••';
  const bank = receipt.bank || 'Westcott Reserve';
  const senderName = receipt.sender_name || 'Account Holder';
  const reference = receipt.idempotencyKey || receipt.reference || `WR-TX-${Date.now()}`;
  const timestamp = receipt.timestamp
    ? new Date(receipt.timestamp).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleShare = async () => {
    try {
      const message = `Westcott Reserve Transaction Receipt\n------------------------------\nAmount: ${formatCurrency(
        amount
      )}\nRecipient: ${recipient}\nAccount: ${accNum}\nBank: ${bank}\nRef: ${reference}\nDate: ${timestamp}\nStatus: SUCCESSFUL`;
      await Share.share({ message });
    } catch {
      Alert.alert('Share Error', 'Could not export receipt.');
    }
  };

  const handleDone = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'home' }],
    });
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Icon Badge */}
        <View style={styles.topIconContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark-sharp" size={38} color="#FFFFFF" />
          </View>
        </View>

        <Text style={[styles.successTitle, { color: theme.textPrimary }]}>Transfer Successful!</Text>
        <Text style={[styles.successSubtitle, { color: theme.textSecondary }]}>
          Your funds have been debited and routed to the beneficiary.
        </Text>

        {/* Receipt Card */}
        <View style={[styles.receiptCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.amountLabel, { color: theme.textMuted }]}>TOTAL AMOUNT SENT</Text>
          <Text style={[styles.amountValue, { color: theme.textPrimary }]}>{formatCurrency(amount)}</Text>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>Beneficiary Name</Text>
            <Text style={[styles.rowValue, { color: theme.textPrimary }]}>{recipient}</Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>Account Number</Text>
            <Text style={[styles.rowValue, { color: theme.textPrimary }]}>{accNum}</Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>Destination Bank</Text>
            <Text style={[styles.rowValue, { color: theme.textPrimary }]}>{bank}</Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>Sender Name</Text>
            <Text style={[styles.rowValue, { color: theme.textPrimary }]}>{senderName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>Date & Time</Text>
            <Text style={[styles.rowValue, { color: theme.textPrimary }]}>{timestamp}</Text>
          </View>

          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>Reference Code</Text>
            <Text style={[styles.refValue, { color: theme.textMuted }]} numberOfLines={1}>
              {reference}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={18} color={theme.textPrimary} style={{ marginRight: 8 }} />
            <Text style={[styles.shareBtnText, { color: theme.textPrimary }]}>Share Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default TransferSuccessScreen;

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topIconContainer: {
    marginBottom: 16,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    maxWidth: 280,
    lineHeight: 18,
  },
  receiptCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    maxWidth: '55%',
  },
  refValue: {
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'right',
    maxWidth: '55%',
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#7052FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});