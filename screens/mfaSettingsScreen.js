import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import { supabase } from '../services/supabaseClient';
import { getTotpFactors, verifyTotpCode } from '../services/mfaService';

const MfaSettingsScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const [verifiedFactor, setVerifiedFactor] = useState(null);
  const [pendingFactorId, setPendingFactorId] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadFactors = useCallback(async () => {
    setErrorMessage('');
    try {
      const factors = await getTotpFactors();
      setVerifiedFactor(factors.find((factor) => factor.status === 'verified') || null);
      setPendingFactorId(factors.find((factor) => factor.status !== 'verified')?.id || null);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to load authenticator settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFactors();
  }, [loadFactors]);

  const startEnrollment = async () => {
    setBusy(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      if (pendingFactorId) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: pendingFactorId });
        if (error) throw error;
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Westcott Reserve',
      });
      if (error) throw error;
      setEnrollment(data);
      setPendingFactorId(data.id);
      setCode('');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to start authenticator setup.');
    } finally {
      setBusy(false);
    }
  };

  const confirmEnrollment = async () => {
    if (!enrollment?.id || code.trim().length !== 6) {
      setErrorMessage('Enter the current 6-digit code from your authenticator app.');
      return;
    }
    setBusy(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      await verifyTotpCode(enrollment.id, code);
      const { error } = await supabase.rpc('set_user_mfa_requirement', {
        p_enabled: true,
      });
      if (error) throw error;
      setEnrollment(null);
      setCode('');
      setStatusMessage('Authenticator verification is enabled for this account.');
      await loadFactors();
    } catch (error) {
      setErrorMessage(error.message || 'Unable to verify the authenticator code.');
    } finally {
      setBusy(false);
    }
  };

  const disableAuthenticator = async () => {
    if (!verifiedFactor || code.trim().length !== 6) {
      setErrorMessage('Enter the current 6-digit authenticator code to turn off verification.');
      return;
    }
    setBusy(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      await verifyTotpCode(verifiedFactor.id, code);
      const { error: requirementError } = await supabase.rpc('set_user_mfa_requirement', {
        p_enabled: false,
      });
      if (requirementError) throw requirementError;
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: verifiedFactor.id,
      });
      if (unenrollError) throw unenrollError;
      setCode('');
      setEnrollment(null);
      setStatusMessage('Authenticator verification has been turned off.');
      await loadFactors();
    } catch (error) {
      setErrorMessage(error.message || 'Unable to turn off authenticator verification.');
    } finally {
      setBusy(false);
    }
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Authenticator verification</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Use an authenticator app to generate a time-based code after entering your password.
          Email OTP remains available for password recovery.
        </Text>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {loading ? (
            <ActivityIndicator color={theme.accent} />
          ) : verifiedFactor ? (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Two-factor verification is enabled
              </Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                Enter a code from your authenticator app to confirm turning it off.
              </Text>
              <TextInput
                accessibilityLabel="Authenticator code"
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorder }]}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-digit code"
                placeholderTextColor={theme.textMuted}
              />
              <TouchableOpacity
                style={[styles.button, busy && styles.buttonDisabled]}
                onPress={disableAuthenticator}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Turn off</Text>}
              </TouchableOpacity>
            </>
          ) : enrollment ? (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Add this account to your authenticator
              </Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                In your authenticator app, add a time-based code manually using the key below.
              </Text>
              <Text selectable style={[styles.secret, { color: theme.textPrimary }]}>
                {enrollment.totp?.secret}
              </Text>
              <TextInput
                accessibilityLabel="Authenticator setup code"
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorder }]}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="Enter the 6-digit code"
                placeholderTextColor={theme.textMuted}
              />
              <TouchableOpacity
                style={[styles.button, busy && styles.buttonDisabled]}
                onPress={confirmEnrollment}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Verify and enable</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Add an authenticator app
              </Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                You will need a current code from your authenticator each time you sign in.
                Save your authenticator access securely.
              </Text>
              <TouchableOpacity
                style={[styles.button, busy && styles.buttonDisabled]}
                onPress={startEnrollment}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Set up authenticator</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>

        {!!errorMessage && <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text>}
        {!!statusMessage && <Text accessibilityLiveRegion="polite" style={styles.status}>{statusMessage}</Text>}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default MfaSettingsScreen;

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: 16, paddingVertical: 8 },
  backCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  description: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
  card: { borderWidth: 1, borderRadius: 20, padding: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  secret: { fontSize: 16, fontWeight: '700', letterSpacing: 1, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 14 },
  button: { minHeight: 48, borderRadius: 12, backgroundColor: '#7052FF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  error: { color: '#DC2626', fontSize: 13, marginTop: 14 },
  status: { color: '#15803D', fontSize: 13, marginTop: 14 },
});
