// screens/verificationScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const VerificationScreen = ({ navigation }) => {
  const { theme } = useAppTheme();

  const renderItem = (icon, label, status, isLast = false) => {
    const isVerified = status === 'Verified';
    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: isLast ? 'transparent' : theme.cardBorder }]}
        onPress={() => {
          if (!isVerified) {
            Alert.alert(label, 'Document submission and verification are not configured in this prototype.');
          }
        }}
        disabled={isVerified}
        activeOpacity={0.7}
      >
        <View style={styles.leftCol}>
          <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name={icon} size={18} color="#7052FF" />
          </View>
          <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>{label}</Text>
        </View>

        <View style={styles.rightCol}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isVerified ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isVerified ? '#10B981' : '#F59E0B' },
              ]}
            >
              {status}
            </Text>
          </View>
          {!isVerified && <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />}
        </View>
      </TouchableOpacity>
    );
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Verification</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          These checks are account-profile placeholders. No documents are collected or verified.
        </Text>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {renderItem('card-outline', 'National ID', 'Not started')}
          {renderItem('location-outline', 'Address Verification', 'Not started')}
          {renderItem('person-add-outline', 'Next of Kin', 'Not started')}
          {renderItem('wallet-outline', 'Wealth Declaration', 'Not started', true)}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default VerificationScreen;

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
  scrollContent: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: -12, marginBottom: 18 },
  card: { borderRadius: 20, paddingHorizontal: 16, borderWidth: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1 },
  leftCol: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rightCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});