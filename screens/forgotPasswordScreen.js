import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrandLockup from '../components/BrandLockup';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import { AuthService } from '../services/authService';

const ForgotPasswordScreen = ({ navigation }) => {
  const { theme, isDark } = useAppTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const accent = isDark ? '#E0C27F' : '#806A3F';
  const inputBackground = theme.inputBg || theme.surfaceLight || theme.cardBg;

  const handleRequestOtp = async () => {
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFeedback({ type: 'error', text: 'Enter a valid email address to continue.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      await AuthService.sendPasswordResetOtp(normalizedEmail);
      setEmail(normalizedEmail);
      setStep(2);
      setFeedback({
        type: 'success',
        text: `A six-digit recovery code has been sent to ${normalizedEmail}.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error.message || 'Unable to send a recovery code. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!/^\d{6}$/.test(token.trim())) {
      setFeedback({ type: 'error', text: 'Enter the six-digit code sent to your email.' });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({ type: 'error', text: 'Your new password must be at least six characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'The passwords do not match. Check both fields and try again.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      await AuthService.resetPasswordWithOtp({
        email: email.trim(),
        token: token.trim(),
        newPassword,
      });
      setPasswordUpdated(true);
      setFeedback({
        type: 'success',
        text: 'Your password has been updated. You can now sign in with your new password.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error.message || 'The code is invalid or has expired. Request a new code and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const returnToEmailStep = () => {
    setStep(1);
    setToken('');
    setFeedback(null);
  };

  return (
    <ScreenWrapper style={{ backgroundColor: theme.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.page}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={17} color={accent} />
              <Text style={[styles.backText, { color: accent }]}>Back</Text>
            </TouchableOpacity>

            <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <BrandLockup dark={isDark} iconSize={44} subtitle="ACCOUNT ACCESS" />

              <View style={styles.intro}>
                <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(224,194,127,0.12)' : '#F6F0E2' }]}>
                  <Ionicons
                    name={passwordUpdated ? 'checkmark-circle-outline' : 'key-outline'}
                    size={24}
                    color={accent}
                  />
                </View>
                <Text style={[styles.title, { color: theme.textPrimary }]}>
                  {passwordUpdated ? 'You’re all set.' : step === 1 ? 'Reset your password' : 'Check your inbox'}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {passwordUpdated
                    ? 'Your account is ready for you. Sign in with your new password.'
                    : step === 1
                      ? 'We’ll email you a one-time code so you can choose a new password securely.'
                      : 'Enter the six-digit code we sent, then choose a new password.'}
                </Text>
              </View>

              {!passwordUpdated && (
                <View style={styles.steps}>
                  {[
                    { number: '01', label: 'Send code', active: step === 1 || step === 2 },
                    { number: '02', label: 'New password', active: step === 2 },
                  ].map((item, index) => (
                    <React.Fragment key={item.number}>
                      {index > 0 && (
                        <View style={[
                          styles.stepLine,
                          { backgroundColor: step === 2 ? accent : theme.cardBorder },
                        ]} />
                      )}
                      <View style={styles.stepItem}>
                        <View style={[
                          styles.stepNumber,
                          {
                            backgroundColor: item.active ? accent : 'transparent',
                            borderColor: item.active ? accent : theme.cardBorder,
                          },
                        ]}>
                          <Text style={[
                            styles.stepNumberText,
                            { color: item.active ? (isDark ? '#17202B' : '#FFFFFF') : theme.textMuted },
                          ]}>
                            {item.number}
                          </Text>
                        </View>
                        <Text style={[
                          styles.stepLabel,
                          { color: item.active ? theme.textPrimary : theme.textMuted },
                        ]}>
                          {item.label}
                        </Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              )}

              {!!feedback && (
                <View style={[
                  styles.feedback,
                  {
                    backgroundColor: feedback.type === 'error'
                      ? (isDark ? 'rgba(248,113,113,0.12)' : '#FEF2F2')
                      : (isDark ? 'rgba(52,211,153,0.12)' : '#ECFDF5'),
                    borderColor: feedback.type === 'error'
                      ? (isDark ? 'rgba(248,113,113,0.28)' : '#FECACA')
                      : (isDark ? 'rgba(52,211,153,0.28)' : '#A7F3D0'),
                  },
                ]}>
                  <Ionicons
                    name={feedback.type === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                    size={18}
                    color={feedback.type === 'error' ? '#DC5555' : '#17845D'}
                  />
                  <Text style={[
                    styles.feedbackText,
                    { color: feedback.type === 'error' ? (isDark ? '#FCA5A5' : '#991B1B') : (isDark ? '#6EE7B7' : '#065F46') },
                  ]}>
                    {feedback.text}
                  </Text>
                </View>
              )}

              {passwordUpdated ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  style={[styles.primaryButton, { backgroundColor: accent }]}
                  onPress={() => navigation.navigate('auth')}
                >
                  <Text style={[styles.primaryButtonText, { color: isDark ? '#17202B' : '#FFFFFF' }]}>
                    Continue to sign in
                  </Text>
                  <Ionicons name="arrow-forward" size={17} color={isDark ? '#17202B' : '#FFFFFF'} />
                </TouchableOpacity>
              ) : step === 1 ? (
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Email address</Text>
                    <View style={[
                      styles.inputShell,
                      { backgroundColor: inputBackground, borderColor: theme.cardBorder },
                    ]}>
                      <Ionicons name="mail-outline" size={18} color={theme.textMuted} />
                      <TextInput
                        accessibilityLabel="Email address"
                        autoComplete="email"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        placeholder="you@example.com"
                        placeholderTextColor={theme.textMuted}
                        style={[styles.input, { color: theme.textPrimary }]}
                        value={email}
                        onChangeText={(value) => {
                          setEmail(value);
                          if (feedback) setFeedback(null);
                        }}
                        returnKeyType="send"
                        onSubmitEditing={handleRequestOtp}
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.primaryButton, { backgroundColor: accent }, loading && styles.disabledButton]}
                    onPress={handleRequestOtp}
                    disabled={loading}
                  >
                    {loading
                      ? <ActivityIndicator color={isDark ? '#17202B' : '#FFFFFF'} />
                      : <>
                        <Text style={[styles.primaryButtonText, { color: isDark ? '#17202B' : '#FFFFFF' }]}>Send recovery code</Text>
                        <Ionicons name="arrow-forward" size={17} color={isDark ? '#17202B' : '#FFFFFF'} />
                      </>}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.form}>
                  <View style={styles.emailSummary}>
                    <Ionicons name="mail-outline" size={16} color={accent} />
                    <Text style={[styles.emailSummaryText, { color: theme.textSecondary }]} numberOfLines={1}>
                      {email}
                    </Text>
                    <TouchableOpacity accessibilityRole="button" onPress={returnToEmailStep}>
                      <Text style={[styles.editEmail, { color: accent }]}>Edit</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Six-digit recovery code</Text>
                    <TextInput
                      accessibilityLabel="Six-digit recovery code"
                      autoComplete="one-time-code"
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="000000"
                      placeholderTextColor={theme.textMuted}
                      style={[
                        styles.input,
                        styles.codeInput,
                        { color: theme.textPrimary, backgroundColor: inputBackground, borderColor: theme.cardBorder },
                      ]}
                      value={token}
                      onChangeText={(value) => {
                        setToken(value.replace(/\D/g, '').slice(0, 6));
                        if (feedback?.type === 'error') setFeedback(null);
                      }}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>New password</Text>
                    <View style={[
                      styles.inputShell,
                      { backgroundColor: inputBackground, borderColor: theme.cardBorder },
                    ]}>
                      <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} />
                      <TextInput
                        accessibilityLabel="New password"
                        autoComplete="new-password"
                        textContentType="newPassword"
                        placeholder="At least 6 characters"
                        placeholderTextColor={theme.textMuted}
                        secureTextEntry={!showPassword}
                        style={[styles.input, { color: theme.textPrimary }]}
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Hide passwords' : 'Show passwords'}
                        onPress={() => setShowPassword((visible) => !visible)}
                        style={styles.visibilityButton}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={19}
                          color={theme.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Confirm new password</Text>
                    <View style={[
                      styles.inputShell,
                      { backgroundColor: inputBackground, borderColor: theme.cardBorder },
                    ]}>
                      <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} />
                      <TextInput
                        accessibilityLabel="Confirm new password"
                        autoComplete="new-password"
                        textContentType="newPassword"
                        placeholder="Enter your new password again"
                        placeholderTextColor={theme.textMuted}
                        secureTextEntry={!showPassword}
                        style={[styles.input, { color: theme.textPrimary }]}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.primaryButton, { backgroundColor: accent }, loading && styles.disabledButton]}
                    onPress={handleUpdatePassword}
                    disabled={loading}
                  >
                    {loading
                      ? <ActivityIndicator color={isDark ? '#17202B' : '#FFFFFF'} />
                      : <>
                        <Text style={[styles.primaryButtonText, { color: isDark ? '#17202B' : '#FFFFFF' }]}>Update password</Text>
                        <Ionicons name="arrow-forward" size={17} color={isDark ? '#17202B' : '#FFFFFF'} />
                      </>}
                  </TouchableOpacity>

                  <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.resendButton}
                    onPress={handleRequestOtp}
                    disabled={loading}
                  >
                    <Text style={[styles.resendText, { color: theme.textSecondary }]}>Didn’t receive a code?</Text>
                    <Text style={[styles.resendLink, { color: accent }]}>Send a new one</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={[styles.footerNote, { color: theme.textMuted }]}>
              Need a hand? Contact customer care for help with account access.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 28 },
  page: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, minHeight: 40, marginBottom: 14, paddingHorizontal: 4 },
  backText: { fontSize: 13, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 22, padding: 28, shadowColor: '#0A1726', shadowOpacity: 0.1, shadowRadius: 30, shadowOffset: { width: 0, height: 14 }, elevation: 3 },
  intro: { alignItems: 'center', marginTop: 30, marginBottom: 24 },
  iconBadge: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 25, lineHeight: 32, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { maxWidth: 350, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  steps: { flexDirection: 'row', alignItems: 'center', marginBottom: 23 },
  stepItem: { alignItems: 'center', gap: 7 },
  stepNumber: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 9, fontWeight: '800' },
  stepLabel: { fontSize: 10, fontWeight: '700' },
  stepLine: { height: 1, flex: 1, marginHorizontal: 12, marginBottom: 18 },
  feedback: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 17 },
  feedbackText: { flex: 1, fontSize: 12, lineHeight: 18 },
  form: { gap: 17 },
  inputGroup: { gap: 8 },
  label: { fontSize: 12, fontWeight: '700' },
  inputShell: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14 },
  input: { flex: 1, minWidth: 0, minHeight: 48, paddingVertical: 11, fontSize: 14 },
  codeInput: { minHeight: 58, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, textAlign: 'center', fontSize: 23, letterSpacing: 8, fontWeight: '800' },
  visibilityButton: { padding: 6 },
  primaryButton: { minHeight: 51, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, paddingHorizontal: 18, borderRadius: 12, marginTop: 2 },
  primaryButtonText: { fontSize: 13, fontWeight: '800' },
  disabledButton: { opacity: 0.65 },
  emailSummary: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(128,106,63,0.08)' },
  emailSummaryText: { flex: 1, fontSize: 12, fontWeight: '600' },
  editEmail: { fontSize: 11, fontWeight: '800', paddingVertical: 8 },
  resendButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 4 },
  resendText: { fontSize: 11 },
  resendLink: { fontSize: 11, fontWeight: '800' },
  footerNote: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 17, paddingHorizontal: 16 },
});
