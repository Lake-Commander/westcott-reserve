import React, { useState } from 'react';
import { useAppTheme } from '../hooks/useAppTheme';
import ScreenWrapper from '../components/ScreenWrapper';
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
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../services/authService';

const ForgotPasswordScreen = ({ navigation }) => {
  const { theme, isDark } = useAppTheme();
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify & Reset
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Request Reset Code
  const handleRequestOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Required Field', 'Please provide your registered account email.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.sendPasswordResetOtp(email.trim());
      Alert.alert('Code Dispatched', 'A 6-digit recovery code has been sent to your email.');
      setStep(2);
    } catch (err) {
      Alert.alert('Request Failed', err.message || 'Unable to dispatch recovery code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Commit New Password
  const handleUpdatePassword = async () => {
    if (!token.trim() || token.trim().length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code sent to your email.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Password Criteria', 'Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPasswordWithOtp({
        email: email.trim(),
        token: token.trim(),
        newPassword,
      });

      Alert.alert(
        'Password Updated',
        'Your security passkey has been successfully changed. Please sign in.',
        [{ text: 'Proceed to Sign In', onPress: () => navigation.navigate('auth') }]
      );
    } catch (err) {
      Alert.alert('Reset Failed', err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Bar / Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#D4AF37" />
            <Text style={styles.backText}>Return</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="key-outline" size={30} color="#D4AF37" />
            </View>
            <Text style={styles.appTitle}>Password Recovery</Text>
            <Text style={styles.appSubtitle}>
              {step === 1
                ? 'Enter your registered email to receive an authentication code'
                : `Enter the 6-digit code dispatched to ${email}`}
            </Text>
          </View>

          {/* Form Step 1 */}
          {step === 1 ? (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@westcottreserve.com"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0B0F0E" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Form Step 2 */
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>6-Digit Verification Code</Text>
                <TextInput
                  style={[styles.input, styles.tokenInput]}
                  placeholder="••••••"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  maxLength={6}
                  value={token}
                  onChangeText={setToken}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[styles.input, { flex: 1, borderWidth: 0 }]}
                    placeholder="••••••••••••"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleUpdatePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0B0F0E" />
                ) : (
                  <Text style={styles.submitBtnText}>Update Password & Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                <Text style={styles.resendText}>Resend Verification Code</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F0E' },
  scrollContent: { padding: 24, justifyContent: 'center' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: { color: '#D4AF37', fontSize: 13, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 28 },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#141A18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  appTitle: { fontSize: 24, fontWeight: '700', color: '#F8FAFC' },
  appSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  form: { gap: 14 },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#CBD5E1' },
  input: {
    backgroundColor: '#141A18',
    color: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1E2925',
  },
  tokenInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 10,
    fontWeight: '700',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141A18',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E2925',
  },
  eyeBtn: { paddingHorizontal: 14 },
  submitBtn: {
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: { color: '#0B0F0E', fontSize: 14, fontWeight: '700' },
  resendBtn: { alignItems: 'center', marginTop: 10, paddingVertical: 8 },
  resendText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
});
