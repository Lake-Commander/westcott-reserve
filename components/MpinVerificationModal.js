import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AuthService } from '../services/authService';

export default function MpinVerificationModal({
  visible,
  userId,
  theme,
  recipient,
  amount,
  currency = 'USD',
  onCancel,
  onVerified,
}) {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [verifying, setVerifying] = useState(false);

  const verifyPin = async () => {
    if (verifying || pin.length !== 4) return;
    setVerifying(true);
    setErrorMessage('');
    try {
      if (!userId) throw new Error('Your account could not be verified. Please sign in again.');
      const valid = await AuthService.verifyMpin(userId, pin);
      if (!valid) {
        setPin('');
        setErrorMessage('Incorrect MPIN. Please try again.');
        return;
      }
      setPin('');
      onVerified();
    } catch (error) {
      setPin('');
      setErrorMessage(error.message || 'Unable to verify your MPIN. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const close = () => {
    if (verifying) return;
    setPin('');
    setErrorMessage('');
    onCancel();
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel transfer verification"
          style={StyleSheet.absoluteFill}
          onPress={close}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.card,
            { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
          ]}
        >
          <View style={[styles.lockIcon, { backgroundColor: theme.surfaceLight }]}>
            <Text style={[styles.lockGlyph, { color: theme.accent }]}>●</Text>
          </View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Confirm this transfer</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Enter your 4-digit MPIN to authorize this transaction.
          </Text>
          {(recipient || amount) && (
            <View style={[styles.transferDetails, { backgroundColor: theme.surfaceLight }]}>
              {!!recipient && (
                <Text style={[styles.recipient, { color: theme.textPrimary }]} numberOfLines={1}>
                  To: {recipient}
                </Text>
              )}
              {!!amount && (
                <Text style={[styles.amount, { color: theme.textPrimary }]}>
                  Amount: {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency,
                    minimumFractionDigits: 2,
                  }).format(Number(amount))}
                </Text>
              )}
            </View>
          )}
          <TextInput
            accessibilityLabel="4-digit MPIN"
            autoComplete="off"
            autoCorrect={false}
            autoFocus
            keyboardType="number-pad"
            maxLength={4}
            onChangeText={(value) => {
              setPin(value.replace(/\D/g, '').slice(0, 4));
              setErrorMessage('');
            }}
            onSubmitEditing={verifyPin}
            placeholder="••••"
            placeholderTextColor={theme.textMuted}
            returnKeyType="done"
            secureTextEntry
            style={[
              styles.pinInput,
              {
                backgroundColor: theme.inputBg,
                borderColor: errorMessage ? '#EF4444' : theme.inputBorder,
                color: theme.textPrimary,
              },
            ]}
            value={pin}
          />
          <View style={styles.pinDots} accessibilityElementsHidden importantForAccessibility="no">
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.pinDot,
                  { borderColor: theme.cardBorder },
                  pin.length > index && [
                    styles.pinDotFilled,
                    { backgroundColor: theme.accent, borderColor: theme.accent },
                  ],
                ]}
              />
            ))}
          </View>
          {!!errorMessage && (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {errorMessage}
            </Text>
          )}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={close}
              disabled={verifying}
              style={[styles.cancelButton, { borderColor: theme.cardBorder }]}
            >
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={verifyPin}
              disabled={pin.length !== 4 || verifying}
              style={[
                styles.confirmButton,
                { backgroundColor: theme.accent },
                (pin.length !== 4 || verifying) && styles.disabledButton,
              ]}
            >
              {verifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmText}>Confirm transfer</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    elevation: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  lockIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockGlyph: { color: '#7052FF', fontSize: 20, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  description: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  transferDetails: { width: '100%', borderRadius: 12, padding: 12, gap: 4 },
  recipient: { fontSize: 13, fontWeight: '700' },
  amount: { fontSize: 15, fontWeight: '800' },
  pinInput: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 12,
  },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  pinDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1 },
  pinDotFilled: { backgroundColor: '#7052FF', borderColor: '#7052FF' },
  error: { color: '#B42318', fontSize: 12, textAlign: 'center' },
  actions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 13, fontWeight: '700' },
  confirmButton: {
    flex: 1.4,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: '#7052FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  confirmText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  disabledButton: { opacity: 0.5 },
});
