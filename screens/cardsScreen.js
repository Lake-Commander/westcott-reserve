// screens/cardsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const CardsScreen = () => {
  const { theme, isDark } = useAppTheme();
  const user = useSelector((state) => state.userReducer?.user);
  const [frozen, setFrozen] = useState(false);
  const [tab, setTab] = useState('virtual');

  const cardHolderName = user?.name ? user.name.toUpperCase() : 'ACCOUNT HOLDER';
  const accNum = user?.account_number || user?.accountNumber || '6981879986';
  const lastFour = accNum.slice(-4);

  const requestCard = (type) => {
    Alert.alert(
      type === 'physical' ? 'Physical card request' : 'Virtual card request',
      type === 'physical'
        ? 'Your physical card request has been queued and will be shipped to your verified address.'
        : 'Your virtual card is ready for digital issuance and use.'
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Cards</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Virtual and physical card controls</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.tabRow, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <TouchableOpacity
            style={[styles.tabItem, tab === 'virtual' && styles.tabItemActive]}
            onPress={() => setTab('virtual')}
          >
            <Text style={[styles.tabText, { color: tab === 'virtual' ? '#FFFFFF' : theme.textSecondary }]}>Virtual</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, tab === 'physical' && styles.tabItemActive]}
            onPress={() => setTab('physical')}
          >
            <Text style={[styles.tabText, { color: tab === 'physical' ? '#FFFFFF' : theme.textSecondary }]}>Physical</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.cardSurface, { backgroundColor: isDark ? '#16161A' : '#0F0F12' }, frozen && styles.cardFrozen]}>
          <View style={styles.cardTop}>
            <Text style={styles.cardBrand}>Westcott Reserve</Text>
            <View style={styles.chipBox}>
              <Ionicons name="hardware-chip" size={26} color="#D4AF37" />
            </View>
          </View>

          <Text style={styles.cardNumber}>••••  ••••  ••••  {lastFour}</Text>

          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.cardLabel}>CARD HOLDER</Text>
              <Text style={styles.cardHolder}>{cardHolderName}</Text>
            </View>
            <View>
              <Text style={styles.cardLabel}>{tab === 'virtual' ? 'STATUS' : 'SHIPPING'}</Text>
              <Text style={styles.cardHolder}>{tab === 'virtual' ? (frozen ? 'Frozen' : 'Active') : 'Queued'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsBox}>
          <TouchableOpacity
            style={[styles.actionBtn, frozen ? styles.unfreezeBtn : styles.freezeBtn]}
            onPress={() => setFrozen(!frozen)}
            activeOpacity={0.7}
          >
            <Ionicons name={frozen ? 'lock-open' : 'lock-closed'} size={18} color={frozen ? '#10B981' : '#EF4444'} />
            <Text style={[styles.actionBtnText, { color: frozen ? '#10B981' : '#EF4444' }]}>
              {frozen ? 'Unlock card' : 'Freeze card'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtnSecondary, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            onPress={() => requestCard(tab)}
            activeOpacity={0.7}
          >
            <Ionicons name={tab === 'virtual' ? 'card-outline' : 'cube-outline'} size={18} color="#7052FF" />
            <Text style={[styles.actionBtnSecondaryText, { color: theme.textPrimary }]}>
              {tab === 'virtual' ? 'Request new virtual card' : 'Request physical card'}
            </Text>
          </TouchableOpacity>

          {tab === 'physical' && (
            <View style={[styles.infoCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>Physical card delivery</Text>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>Your physical card will be shipped to your verified residential address after approval. Tracking updates are sent to your registered email.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default CardsScreen;

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  scroll: { paddingHorizontal: 16, paddingBottom: 110 },
  tabRow: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginBottom: 18 },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabItemActive: { backgroundColor: '#7052FF' },
  tabText: { fontWeight: '700' },
  cardSurface: {
    borderRadius: 22,
    padding: 24,
    height: 200,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(112, 82, 255, 0.4)',
    marginBottom: 20,
  },
  cardFrozen: { opacity: 0.5, borderColor: '#EF4444' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBrand: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  chipBox: { transform: [{ rotate: '90deg' }] },
  cardNumber: { color: '#F8FAFC', fontSize: 20, fontWeight: '700', letterSpacing: 3 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  cardHolder: { color: '#F8FAFC', fontSize: 12, fontWeight: '700', marginTop: 2 },
  actionsBox: { gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 8 },
  freezeBtn: { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  unfreezeBtn: { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  actionBtnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, paddingVertical: 14, borderRadius: 14, gap: 8 },
  actionBtnSecondaryText: { fontSize: 14, fontWeight: '600' },
  infoCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 8 },
  infoTitle: { fontSize: 15, fontWeight: '700' },
  infoText: { fontSize: 12, lineHeight: 18 },
});