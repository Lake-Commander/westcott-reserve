// screens/authScreen.js
import React, { useState } from 'react';
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
import { useDispatch } from 'react-redux';
import { AuthService } from '../services/authService';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const AuthScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { theme } = useAppTheme();

  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mpin, setMpin] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Required Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          Alert.alert('Required Field', 'Please enter your legal full name.');
          setLoading(false);
          return;
        }
        await AuthService.signUp({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          mpin: mpin || '0000',
        });
        const { profile } = await AuthService.signIn({
          email: email.trim(),
          password,
        });
        if (profile) {
          dispatch({ type: 'SET_USER', payload: profile });
          navigation.reset({ index: 0, routes: [{ name: 'home' }] });
        } else {
          Alert.alert('Account Created', 'Please sign in with your credentials.');
          setIsSignUp(false);
        }
      } else {
        const { profile } = await AuthService.signIn({
          email: email.trim(),
          password,
        });
        dispatch({ type: 'SET_USER', payload: profile });
        navigation.reset({ index: 0, routes: [{ name: 'home' }] });
      }
    } catch (err) {
      Alert.alert('Authentication Failed', err.message || 'Invalid credentials or connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoBadge, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Ionicons name="sparkles" size={30} color="#7052FF" />
            </View>
            <Text style={[styles.appTitle, { color: theme.textPrimary }]}>Westcott Reserve</Text>
            <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>Private Digital Banking</Text>
          </View>

          {/* Tab Switcher */}
          <View style={[styles.tabContainer, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <TouchableOpacity
              style={[styles.tab, !isSignUp && { backgroundColor: theme.surfaceLight, borderColor: theme.accent, borderWidth: 1 }]}
              onPress={() => setIsSignUp(false)}
            >
              <Text style={[styles.tabText, { color: !isSignUp ? theme.textPrimary : theme.textMuted }]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, isSignUp && { backgroundColor: theme.surfaceLight, borderColor: theme.accent, borderWidth: 1 }]}
              onPress={() => setIsSignUp(true)}
            >
              <Text style={[styles.tabText, { color: isSignUp ? theme.textPrimary : theme.textMuted }]}>Open Account</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Legal Full Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={theme.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                placeholder="name@westcottreserve.com"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
              <View style={[styles.passwordWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0, color: theme.textPrimary, backgroundColor: 'transparent' }]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
              {!isSignUp && (
                <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('forgotPassword')}>
                  <Text style={styles.forgotBtnText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
            </View>

            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Set 4-Digit Quick PIN</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                  placeholder="0000"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                  value={mpin}
                  onChangeText={setMpin}
                />
              </View>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleAuth} disabled={loading} activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>{isSignUp ? 'Create Reserve Account' : 'Sign In'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  scrollContent: { padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 28 },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  appTitle: { fontSize: 24, fontWeight: '800' },
  appSubtitle: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabText: { fontSize: 13, fontWeight: '600' },
  form: { gap: 14 },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600' },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  eyeBtn: { paddingHorizontal: 14 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 6 },
  forgotBtnText: { color: '#7052FF', fontSize: 12, fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#7052FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});