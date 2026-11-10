// screens/transferBankScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { BankService } from '../services/bankService';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import MpinVerificationModal from '../components/MpinVerificationModal';

const TransferBankScreen = ({ navigation, route }) => {
  const currentUser = useSelector((state) => state.userReducer?.user);
  const { theme } = useAppTheme();
  const accountCurrency = currentUser?.currency || 'USD';

  const [accountNumber, setAccountNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [showBal, setShowBal] = useState(false);
  const [saveRecipient, setSaveRecipient] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState('idle');
  const [resolvedName, setResolvedName] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mpinPromptVisible, setMpinPromptVisible] = useState(false);

  useEffect(() => {
    if (route?.params?.selectedBeneficiary) {
      const b = route.params.selectedBeneficiary;

      const rawAcc = b.accountNumber || b.identifier || b.id || '';
      const cleanAcc = rawAcc.startsWith('@')
        ? rawAcc.replace(/^@/, '')
        : (rawAcc.replace(/[^0-9]/g, '') || rawAcc);

      setAccountNumber(cleanAcc);

      const targetBank = b.isWestcott ? 'Westcott Reserve Bank' : b.bank || 'Westcott Reserve Bank';
      setSelectedBank(targetBank);

      if (b.name) {
        setResolvedName(b.name.toUpperCase());
        setVerifyStatus('verified');
      }
    } else {
      if (route?.params?.recipientAccount) {
        setAccountNumber(route.params.recipientAccount.replace(/^@/, ''));
      }
      if (route?.params?.recipientBank) {
        setSelectedBank(route.params.recipientBank);
      }
      if (route?.params?.recipientName) {
        setResolvedName(route.params.recipientName);
        setVerifyStatus('verified');
      }
    }
  }, [route?.params]);

  const currentBalance = currentUser?.balance ? parseFloat(currentUser.balance) : 250000.0;
  const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: accountCurrency,
    minimumFractionDigits: 2,
  }).format(value);
  const isAccComplete = accountNumber.trim().length >= 5;

  useEffect(() => {
    const cleanAcc = accountNumber.trim();
    if (!isAccComplete || !selectedBank) {
      if (!resolvedName) {
        setVerifyStatus('idle');
        setResolvedName(null);
      }
      return;
    }

    let isMounted = true;
    setVerifyStatus('verifying');

    const timer = setTimeout(async () => {
      const isInternalBank = selectedBank.toLowerCase().includes('westcott');
      if (isInternalBank) {
        try {
          const res = await BankService.resolveRecipient(cleanAcc, currentUser?.id);
          if (!isMounted) return;
          if (res?.isSelf) {
            setVerifyStatus('self');
            setResolvedName(res.name ? res.name.toUpperCase() : 'YOUR ACCOUNT');
          } else if (res?.name) {
            setVerifyStatus('verified');
            setResolvedName(res.name.toUpperCase());
          } else {
            setVerifyStatus('unverified');
          }
        } catch {
          if (isMounted) setVerifyStatus('unverified');
        }
      } else {
        if (isMounted) setVerifyStatus('verified');
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [accountNumber, selectedBank, isAccComplete, currentUser?.id]);

  const executeTransfer = async () => {
    if (submitting) return;
    const numAmt = parseFloat(amount.replace(/,/g, ''));

    if (isNaN(numAmt) || numAmt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid transfer amount.');
      return;
    }
    if (!currentUser?.id) {
      Alert.alert('Sign In Required', 'Please sign in again before making a transfer.');
      return;
    }
    if (numAmt > currentBalance) {
      Alert.alert('Insufficient Balance', 'Your available balance cannot complete this transaction.');
      return;
    }

    setSubmitting(true);
    const idempotencyKey = `wr_bank_${currentUser?.id?.slice(0, 8)}_${Date.now()}_${Math.floor(
      Math.random() * 900000 + 100000
    )}`;

    try {
      const recipientLabel = resolvedName || `Account (${accountNumber.trim().slice(-4)})`;
      const transferNote = narration.trim() || 'Direct Transfer';

      const receipt = await BankService.executeNipTransfer({
        senderId: currentUser.id,
        receiverAccount: accountNumber.trim(),
        receiverName: recipientLabel,
        bankName: selectedBank || 'Westcott Reserve Bank',
        amount: numAmt,
        note: transferNote,
        currency: accountCurrency,
        idempotencyKey,
      });

      // If user toggled "Add new recipient", save beneficiary to database
      if (saveRecipient) {
        await BankService.saveBeneficiary(currentUser?.id, {
          name: recipientLabel,
          identifier: accountNumber.trim(),
          bank: selectedBank || 'Westcott Reserve Bank',
          isWestcott: (selectedBank || '').toLowerCase().includes('westcott'),
        });
      }

      navigation.replace('transferSuccess', {
        receipt: {
          ...receipt,
          amount: numAmt,
          recipient: recipientLabel,
          account_number: accountNumber.trim(),
          bank: selectedBank || 'Westcott Reserve Bank',
          sender_name: currentUser?.name || 'Account Holder',
          note: transferNote,
          currency: accountCurrency,
          timestamp: receipt.timestamp || new Date().toISOString(),
        },
        returnTarget: 'transferBank',
      });
    } catch (err) {
      Alert.alert('Transfer Failed', err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceed = () => {
    if (verifyStatus === 'self') {
      Alert.alert('Transfer Not Allowed', 'You cannot transfer funds to your own account.');
      return;
    }
    const numAmt = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmt) || numAmt <= 0) {
      Alert.alert('Invalid Amount', 'Please specify how much you want to send.');
      return;
    }
    if (numAmt > currentBalance) {
      Alert.alert('Insufficient Balance', 'Your available balance cannot complete this transaction.');
      return;
    }
    if (!currentUser?.id) {
      Alert.alert('Sign In Required', 'Please sign in again before making a transfer.');
      return;
    }
    if (verifyStatus === 'unverified') {
      Alert.alert(
        'Unverified Account',
        `Could not verify account name with ${selectedBank}. Do you want to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Proceed Anyway',
            style: 'destructive',
            onPress: () => setMpinPromptVisible(true),
          },
        ]
      );
      return;
    }
    setMpinPromptVisible(true);
  };

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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Transfer to other banks 🏦</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Deposit funds into any local bank account quickly and seamlessly.
          </Text>

          <View style={styles.labelRow}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Account Number</Text>
            <TouchableOpacity
              style={[styles.beneficiariesPill, { backgroundColor: theme.surfaceLight }]}
              onPress={() =>
                navigation.navigate('manageBeneficiaries', {
                  returnTarget: 'transferBank',
                })
              }
              activeOpacity={0.7}
            >
              <Text style={[styles.beneficiariesText, { color: theme.textSecondary }]}>Beneficiaries</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            <TextInput
              style={[styles.textInput, { color: theme.textPrimary }]}
              placeholder="Enter account number"
              placeholderTextColor={theme.textMuted}
              value={accountNumber}
              onChangeText={(txt) => {
                setAccountNumber(txt);
                if (txt.trim().length < 5) {
                  setVerifyStatus('idle');
                  setResolvedName(null);
                }
              }}
              autoCapitalize="none"
              keyboardType="number-pad"
            />
          </View>

          {(isAccComplete || selectedBank) && (
            <View style={{ marginTop: 22 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Bank Name</Text>
              <TouchableOpacity
                style={[
                  styles.inputContainer,
                  { justifyContent: 'space-between', marginTop: 8, backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                ]}
                onPress={() =>
                  navigation.navigate('selectBank', {
                    onSelect: (bankName) => setSelectedBank(bankName),
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={[styles.selectedBankText, { color: selectedBank ? theme.textPrimary : theme.textMuted }]}>
                  {selectedBank || 'Select recipient bank'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {verifyStatus === 'verifying' && (
            <View style={styles.verifyingRow}>
              <ActivityIndicator size="small" color={theme.accent} style={{ marginRight: 8 }} />
              <Text style={[styles.verifyingText, { color: theme.textSecondary }]}>
                Verifying account with {selectedBank}...
              </Text>
            </View>
          )}

          {verifyStatus === 'verified' && resolvedName && (
            <View style={styles.verifiedRow}>
              <View style={styles.verifiedCheckBadge}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
              <Text style={[styles.verifiedNameText, { color: theme.textPrimary }]}>{resolvedName}</Text>
            </View>
          )}

          {verifyStatus === 'unverified' && (
            <View style={[styles.unverifiedBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.25)' }]}>
              <Ionicons name="alert-circle-outline" size={16} color="#F59E0B" style={{ marginTop: 1 }} />
              <Text style={styles.unverifiedText}>
                Could not verify account name with {selectedBank}. You can still proceed, but please verify the account details.
              </Text>
            </View>
          )}

          {verifyStatus === 'self' && (
            <View style={[styles.errorBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
              <Ionicons name="close-circle-outline" size={16} color="#EF4444" style={{ marginTop: 1 }} />
              <Text style={styles.errorText}>This is your own account. Self-transfers are not allowed.</Text>
            </View>
          )}

          {(selectedBank || accountNumber.length >= 5 || resolvedName) && (
            <View style={{ marginTop: 22 }}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Amount</Text>
                <View style={[styles.balPillContainer, { backgroundColor: theme.surfaceLight }]}>
                  <Text style={[styles.balPillText, { color: theme.textSecondary }]}>
                    Bal: {showBal ? formatCurrency(currentBalance) : '••••••••'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowBal(!showBal)}>
                    <Ionicons
                      name={showBal ? 'eye-outline' : 'eye-off-outline'}
                      size={14}
                      color={theme.textMuted}
                      style={{ marginLeft: 6 }}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.inputContainer, { marginTop: 8, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  placeholder="How much do you want to send?"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 22, color: theme.textSecondary }]}>Narration</Text>
              <View style={[styles.inputContainer, { marginTop: 8, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  placeholder="What is this transaction for?"
                  placeholderTextColor={theme.textMuted}
                  value={narration}
                  onChangeText={setNarration}
                />
              </View>

              <TouchableOpacity
                style={styles.addRecipientRow}
                onPress={() => setSaveRecipient(!saveRecipient)}
                activeOpacity={0.7}
              >
                <View style={[styles.addCircleIcon, { backgroundColor: theme.accent }]}>
                  <Ionicons name={saveRecipient ? 'checkmark' : 'add'} size={14} color="#FFFFFF" />
                </View>
                <Text style={[styles.addRecipientText, { color: theme.accent }]}>Add new recipient</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomFooter, { borderTopColor: theme.cardBorder }]}>
          <TouchableOpacity
            style={[
              styles.proceedBtn,
              { backgroundColor: theme.accent },
              (!accountNumber || !amount || verifyStatus === 'self' || submitting) && styles.proceedDisabled,
            ]}
            onPress={handleProceed}
            disabled={!accountNumber || !amount || verifyStatus === 'self' || submitting}
            activeOpacity={0.8}
          >
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.proceedBtnText}>Proceed</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <MpinVerificationModal
        visible={mpinPromptVisible}
        userId={currentUser?.id}
        theme={theme}
        recipient={resolvedName || `Account ending ${accountNumber.trim().slice(-4)}`}
        amount={Number.isFinite(parseFloat(amount.replace(/,/g, '')))
          ? parseFloat(amount.replace(/,/g, '')).toFixed(2)
          : ''}
        currency={accountCurrency}
        onCancel={() => setMpinPromptVisible(false)}
        onVerified={() => {
          setMpinPromptVisible(false);
          executeTransfer();
        }}
      />
    </ScreenWrapper>
  );
};

export default TransferBankScreen;

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
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 24, lineHeight: 18 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  beneficiariesPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  beneficiariesText: { fontSize: 11, fontWeight: '600' },
  inputContainer: {
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
  },
  textInput: { flex: 1, fontSize: 14.5, fontWeight: '500' },
  selectedBankText: { fontSize: 14.5, fontWeight: '500' },
  verifyingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 4 },
  verifyingText: { fontSize: 12 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingHorizontal: 2 },
  verifiedCheckBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7052FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedNameText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  unverifiedBox: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
  },
  unverifiedText: { color: '#F59E0B', fontSize: 12, lineHeight: 16, flex: 1 },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
  },
  errorText: { color: '#EF4444', fontSize: 12, lineHeight: 16, flex: 1 },
  balPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  balPillText: { fontSize: 11, fontWeight: '600' },
  addRecipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 26,
    marginBottom: 10,
  },
  addCircleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7052FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addRecipientText: { color: '#7052FF', fontSize: 13.5, fontWeight: '700' },
  bottomFooter: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  proceedBtn: {
    backgroundColor: '#7052FF',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proceedDisabled: { opacity: 0.35 },
  proceedBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});