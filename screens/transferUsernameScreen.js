// screens/transferUsernameScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { BankService } from '../services/bankService';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import MpinVerificationModal from '../components/MpinVerificationModal';

const TransferUsernameScreen = ({ navigation, route }) => {
  const { theme } = useAppTheme();
  const currentUser = useSelector((state) => state.userReducer?.user);
  const [username, setUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [saveRecipient, setSaveRecipient] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolvedUser, setResolvedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mpinPromptVisible, setMpinPromptVisible] = useState(false);

  useEffect(() => {
    let targetUsername = '';
    if (route?.params?.selectedBeneficiary) {
      const b = route.params.selectedBeneficiary;
      targetUsername = (b.username || b.identifier || '').replace(/^@/, '').replace(/\s+/g, '').toLowerCase();
    } else if (route?.params?.recipientUsername) {
      targetUsername = route.params.recipientUsername.replace(/^@/, '').replace(/\s+/g, '').toLowerCase();
    }

    if (targetUsername) {
      setUsername(targetUsername);
      resolveUsername(targetUsername);
    }
  }, [route?.params]);

  const resolveUsername = async (uname) => {
    const clean = uname.trim().replace(/^@/, '');
    if (clean.length < 2) {
      setResolvedUser(null);
      return;
    }
    setResolving(true);
    try {
      const res = await BankService.resolveRecipient(clean, currentUser?.id);
      setResolvedUser(res);
    } catch (err) {
      console.warn('Resolve error:', err);
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    const clean = username.trim().replace(/^@/, '');
    if (clean.length < 3) {
      setResolvedUser(null);
      return;
    }

    let isMounted = true;
    setResolving(true);

    const timer = setTimeout(async () => {
      try {
        const res = await BankService.resolveRecipient(clean, currentUser?.id);
        if (isMounted) {
          setResolvedUser(res);
        }
      } catch (err) {
        console.warn('Recipient resolution error:', err);
      } finally {
        if (isMounted) setResolving(false);
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [username, currentUser?.id]);

  const executeTransfer = async () => {
    if (submitting) return;
    const cleanUsername = username.trim().replace(/^@/, '');
    const targetUser = resolvedUser;
    const numAmt = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmt) || numAmt <= 0) {
      Alert.alert('Enter Amount', 'Please specify a valid transfer amount.');
      return;
    }
    if (!targetUser || targetUser.isSelf) {
      Alert.alert('Invalid Recipient', 'Please verify a valid Westcott recipient before transferring.');
      return;
    }
    if (!currentUser?.id) {
      Alert.alert('Sign In Required', 'Please sign in again before making a transfer.');
      return;
    }

    const currentBal = parseFloat(currentUser?.balance) || 250000.0;
    if (numAmt > currentBal) {
      Alert.alert('Insufficient Balance', 'Your available balance cannot complete this transfer.');
      return;
    }

    setSubmitting(true);
    const idempotencyKey = `wr_user_${currentUser?.id?.slice(0, 8)}_${Date.now()}_${Math.floor(
      Math.random() * 900000 + 100000
    )}`;

    try {
      const result = await BankService.executeNipTransfer({
        senderId: currentUser.id,
        receiverAccount: targetUser.accountNumber || targetUser.id,
        receiverName: targetUser.name,
        bankName: 'Westcott Reserve Bank',
        amount: numAmt,
        note: 'Username Transfer',
        currency: 'USD',
        idempotencyKey,
      });

      // Save beneficiary if checkbox toggled
      if (saveRecipient) {
        await BankService.saveBeneficiary(currentUser?.id, {
          name: targetUser.name,
          identifier: `@${cleanUsername}`,
          bank: 'Westcott Reserve Bank',
          isWestcott: true,
        });
      }

      navigation.replace('transferSuccess', {
        receipt: {
          ...result,
          amount: numAmt,
          recipient: targetUser.name,
          account_number: targetUser.accountNumber || targetUser.id,
          bank: 'Westcott Reserve Bank',
          sender_name: currentUser?.name || 'Account Holder',
          note: 'Username Transfer',
          timestamp: result.timestamp || new Date().toISOString(),
        },
        returnTarget: 'transferUsername',
      });
    } catch (err) {
      Alert.alert('Transfer Failed', err.message || 'Execution error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceed = async () => {
    if (submitting) return;

    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername) {
      Alert.alert('Required', 'Please enter a Westcott username.');
      return;
    }

    let targetUser = resolvedUser;
    if (!targetUser) {
      setSubmitting(true);
      try {
        targetUser = await BankService.resolveRecipient(cleanUsername, currentUser?.id);
      } catch (error) {
        Alert.alert('Recipient Lookup Failed', error.message || 'Unable to verify this username.');
        return;
      } finally {
        setSubmitting(false);
      }
    }

    if (!targetUser || targetUser.isSelf === undefined) {
      Alert.alert('User Not Found', 'No Westcott client found with this username.');
      return;
    }
    if (targetUser.isSelf) {
      Alert.alert('Invalid Recipient', 'You cannot transfer funds to yourself.');
      return;
    }

    const numAmt = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmt) || numAmt <= 0) {
      Alert.alert('Enter Amount', 'Please specify a valid transfer amount.');
      return;
    }
    const currentBal = parseFloat(currentUser?.balance) || 250000.0;
    if (numAmt > currentBal) {
      Alert.alert('Insufficient Balance', 'Your available balance cannot complete this transfer.');
      return;
    }

    setResolvedUser(targetUser);
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
          <Text style={[styles.title, { color: theme.textPrimary }]}>Transfer to a Westcott User 🥳</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            With just their username, you can send money to any Westcott user instantly.
          </Text>

          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>Username</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('manageBeneficiaries', {
                  returnTarget: 'transferUsername',
                  lockTab: 'westcott',
                })
              }
              activeOpacity={0.7}
            >
              <Text style={[styles.beneficiariesBtn, { backgroundColor: theme.surfaceLight, color: theme.textSecondary }]}>
                Beneficiaries
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.inputBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            <TextInput
              style={[styles.input, { color: theme.textPrimary }]}
              placeholder="e.g westcott or @username"
              placeholderTextColor={theme.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            {resolving && <ActivityIndicator size="small" color={theme.accent} style={{ marginRight: 8 }} />}
          </View>

          {resolvedUser && (
            <View style={[styles.verifiedPill, resolvedUser.isSelf && styles.selfPill]}>
              <Ionicons
                name={resolvedUser.isSelf ? 'alert-circle' : 'checkmark-circle'}
                size={18}
                color={resolvedUser.isSelf ? '#EF4444' : '#10B981'}
              />
              <Text style={[styles.verifiedText, resolvedUser.isSelf && { color: '#EF4444' }]}>
                {resolvedUser.isSelf ? 'You cannot transfer to yourself' : resolvedUser.name}
              </Text>
            </View>
          )}

          {resolvedUser && !resolvedUser.isSelf && (
            <View style={{ marginTop: 18 }}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>Amount (USD)</Text>
              <View style={[styles.inputBox, { marginTop: 6, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
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

        <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
          <TouchableOpacity
            style={[styles.proceedBtn, { backgroundColor: theme.accent }, (!username.trim() || !amount || submitting) && styles.proceedDisabled]}
            onPress={handleProceed}
            disabled={!username.trim() || !amount || submitting}
            activeOpacity={0.8}
          >
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.proceedText}>Proceed</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <MpinVerificationModal
        visible={mpinPromptVisible}
        userId={currentUser?.id}
        theme={theme}
        recipient={resolvedUser?.name}
        amount={Number.isFinite(parseFloat(amount.replace(/,/g, '')))
          ? parseFloat(amount.replace(/,/g, '')).toFixed(2)
          : ''}
        onCancel={() => setMpinPromptVisible(false)}
        onVerified={() => {
          setMpinPromptVisible(false);
          executeTransfer();
        }}
      />
    </ScreenWrapper>
  );
};

export default TransferUsernameScreen;

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
  scrollContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 30 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 24, lineHeight: 18 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '700' },
  beneficiariesBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '600',
    overflow: 'hidden',
  },
  inputBox: {
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  selfPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  verifiedText: { color: '#10B981', fontSize: 13, fontWeight: '700' },
  addRecipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 6,
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
  footer: { padding: 18, borderTopWidth: 1 },
  proceedBtn: {
    backgroundColor: '#7052FF',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proceedDisabled: { opacity: 0.4 },
  proceedText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});