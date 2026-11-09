// screens/contactUsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import { supabase } from '../services/supabaseClient';

const ContactUsScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [supportFeedback, setSupportFeedback] = useState('');

  const submitSupportMessage = async () => {
    setSending(true);
    setSupportFeedback('');
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData.session?.user;
      if (!user?.id || !user.email) {
        throw new Error('Sign in with an account that has an email address to contact support.');
      }

      const { error } = await supabase.from('customer_care_messages').insert({
        user_id: user.id,
        email: user.email,
        subject: subject.trim(),
        message: message.trim(),
      });
      if (error) throw error;

      setSubject('');
      setMessage('');
      setSupportFeedback('Your message was sent to customer care.');
    } catch (error) {
      setSupportFeedback(error.message || 'Unable to send your message.');
    } finally {
      setSending(false);
    }
  };

  const handleOpenLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot Open Link', `Unable to open: ${url}`);
      }
    } catch (err) {
      console.warn('Linking error:', err);
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Contact Us</Text>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardValBold, { color: theme.textPrimary }]}>Message customer care</Text>
          <TextInput
            accessibilityLabel="Subject"
            style={[styles.supportInput, { color: theme.textPrimary, borderColor: theme.cardBorder }]}
            value={subject}
            onChangeText={setSubject}
            placeholder="Subject"
            placeholderTextColor={theme.textMuted}
            maxLength={160}
          />
          <TextInput
            accessibilityLabel="Message"
            style={[styles.supportInput, styles.supportMessage, { color: theme.textPrimary, borderColor: theme.cardBorder }]}
            value={message}
            onChangeText={setMessage}
            placeholder="How can we help?"
            placeholderTextColor={theme.textMuted}
            multiline
            maxLength={5000}
          />
          {!!supportFeedback && (
            <Text accessibilityLiveRegion="polite" style={{ color: theme.textSecondary }}>
              {supportFeedback}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.sendButton, (!subject.trim() || !message.trim() || sending) && styles.sendButtonDisabled]}
            onPress={submitSupportMessage}
            disabled={!subject.trim() || !message.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.sendButtonText}>Send message</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Address Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.rowItem}>
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceLight }]}>
              <Ionicons name="navigate-outline" size={18} color="#7052FF" />
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Address</Text>
              <Text style={[styles.cardVal, { color: theme.textPrimary }]}>
                Plot 20, Layi Yusuf Crescent Lekki, Phase 1
              </Text>
            </View>
          </View>
        </View>

        {/* Phone, Email, Live Chat Group */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => handleOpenLink('tel:07007007765')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceLight }]}>
              <Ionicons name="call-outline" size={18} color="#7052FF" />
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.cardVal, { color: theme.textPrimary }]}>07007007765</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => handleOpenLink('mailto:support@westcott.africa')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceLight }]}>
              <Ionicons name="mail-outline" size={18} color="#7052FF" />
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.cardVal, { color: theme.textPrimary }]}>support@westcott.africa</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => Alert.alert('Live Chat', 'Connecting to support team...')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceLight }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#7052FF" />
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.cardValBold, { color: theme.textPrimary }]}>Live chat</Text>
              <Text style={[styles.cardSubText, { color: theme.textMuted }]}>Start a conversation</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Social Links Group */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => handleOpenLink('https://facebook.com')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceLight }]}>
              <Ionicons name="logo-facebook" size={18} color="#7052FF" />
            </View>
            <Text style={[styles.cardValBold, { color: theme.textPrimary }]}>Facebook</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => handleOpenLink('https://instagram.com')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceLight }]}>
              <Ionicons name="logo-instagram" size={18} color="#7052FF" />
            </View>
            <Text style={[styles.cardValBold, { color: theme.textPrimary }]}>Instagram</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => handleOpenLink('https://twitter.com')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceLight }]}>
              <Ionicons name="logo-twitter" size={18} color="#7052FF" />
            </View>
            <Text style={[styles.cardValBold, { color: theme.textPrimary }]}>Twitter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default ContactUsScreen;

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
  scrollContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40, gap: 16 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textCol: { flex: 1 },
  cardLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  cardVal: { fontSize: 13.5, fontWeight: '500', lineHeight: 18 },
  cardValBold: { fontSize: 14, fontWeight: '700' },
  cardSubText: { fontSize: 12, marginTop: 1 },
  divider: { height: 1, marginVertical: 10 },
  supportInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  supportMessage: { minHeight: 100, textAlignVertical: 'top' },
  sendButton: { backgroundColor: '#7052FF', borderRadius: 10, padding: 12, alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.55 },
  sendButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});