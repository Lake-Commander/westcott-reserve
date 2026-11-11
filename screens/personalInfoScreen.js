import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabaseClient';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const PersonalInfoScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const reduxUser = useSelector((state) => state.userReducer?.user);
  const { theme } = useAppTheme();

  const [user, setUser] = useState(reduxUser || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const resolveProfile = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData?.user;
        if (!authUser) {
          if (isMounted) setLoading(false);
          return;
        }
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        const resolvedName =
          dbProfile?.name ||
          authUser.user_metadata?.name ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split('@')[0] ||
          'Account Holder';
        const resolvedEmail = dbProfile?.email || authUser.email || '';
        const resolvedAcc = dbProfile?.account_number || 'WR-000000';

        const mergedProfile = {
          ...(dbProfile || {}),
          id: authUser.id,
          name: resolvedName,
          email: resolvedEmail,
          account_number: resolvedAcc,
          phone: dbProfile?.phone || authUser.phone || 'unverified',
          username: dbProfile?.username || (resolvedEmail ? resolvedEmail.split('@')[0] : 'user'),
        };

        if (isMounted) {
          setUser(mergedProfile);
          dispatch({ type: 'SET_USER', payload: mergedProfile });
        }
      } catch (err) {
        console.warn('Profile resolution failed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    resolveProfile();
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const rawName = user?.name || 'Account Holder';
  const nameParts = rawName.trim().split(' ').filter(Boolean);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const email = user?.email || '';
  const username = user?.username || (email ? email.split('@')[0] : 'user');
  const phone = user?.phone || 'unverified';

  const userInitials = rawName
    ? rawName
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'WR';

  const handleCopy = (field, val) => {
    Alert.alert('Copied', `${field} copied to clipboard.`);
  };

  if (loading) {
    return (
      <ScreenWrapper style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7052FF" />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* Top Bar with Back Arrow */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.backCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Profile</Text>

        {/* User Header Card */}
        <View style={[styles.userCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <View style={styles.userTextCol}>
            <Text style={[styles.cardName, { color: theme.textPrimary }]}>{rawName.toUpperCase()}</Text>
            <Text style={[styles.cardHandle, { color: theme.textSecondary }]}>@{username}</Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={[styles.detailRow, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>First Name</Text>
            <Text style={[styles.fieldValue, { color: theme.textPrimary }]}>{firstName.toUpperCase()}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Last Name</Text>
            <Text style={[styles.fieldValue, { color: theme.textPrimary }]}>{lastName ? lastName.toUpperCase() : ' '}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Phone Number</Text>
            <TouchableOpacity
              style={styles.valueWithCopy}
              onPress={() => handleCopy('Phone Number', phone)}
              activeOpacity={0.6}
            >
              <Text style={[styles.fieldValue, { color: theme.textPrimary }]}>{phone}</Text>
              <Ionicons name="copy-outline" size={14} color="#7052FF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>

          <View style={[styles.detailRow, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Email</Text>
            <TouchableOpacity
              style={styles.valueWithCopy}
              onPress={() => handleCopy('Email', email)}
              activeOpacity={0.6}
            >
              <Text style={[styles.fieldValueEmail, { color: theme.textPrimary }]}>{email}</Text>
              <Ionicons name="copy-outline" size={14} color="#7052FF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Username</Text>
            <TouchableOpacity
              style={styles.valueWithCopy}
              onPress={() => handleCopy('Username', username)}
              activeOpacity={0.6}
            >
              <Text style={[styles.fieldValue, { color: theme.textPrimary }]}>{username}</Text>
              <Ionicons name="copy-outline" size={14} color="#7052FF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Alert Box */}
        <View style={[styles.noticeBox, { backgroundColor: theme.surfaceLight, borderColor: theme.cardBorder }]}>
          <Ionicons name="information-circle-outline" size={20} color="#F59E0B" style={{ marginTop: 1 }} />
          <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
            If you have any issues with your information or would like to change any, please send a message to{' '}
            <Text style={styles.noticeLink}>support@westcottreserve.com</Text>
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default PersonalInfoScreen;

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
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  screenTitle: { fontSize: 26, fontWeight: '800', marginTop: 8, marginBottom: 20 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7052FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  userTextCol: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  cardHandle: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  detailsCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderWidth: 1,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  fieldLabel: { fontSize: 14, fontWeight: '500' },
  fieldValue: { fontSize: 14, fontWeight: '700' },
  fieldValueEmail: { fontSize: 13, fontWeight: '700', maxWidth: 220, textAlign: 'right' },
  valueWithCopy: { flexDirection: 'row', alignItems: 'center' },
  noticeBox: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  noticeText: { fontSize: 12.5, lineHeight: 18, flex: 1 },
  noticeLink: { color: '#F59E0B', fontWeight: '700' },
});
