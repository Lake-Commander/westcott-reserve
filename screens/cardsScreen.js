// screens/cardsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const CardsScreen = () => {
  const { theme, isDark } = useAppTheme();
  const user = useSelector((state) => state.userReducer?.user);
  const [frozen, setFrozen] = useState(false);

  const cardHolderName = user?.name ? user.name.toUpperCase() : 'ACCOUNT HOLDER';
  const accNum = user?.account_number || user?.accountNumber || '6981879986';
  const lastFour = accNum.slice(-4);

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Debit Cards</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Active Obsidian Mastercard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Physical / Virtual Card Surface */}
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
              <Text style={styles.cardLabel}>EXPIRES</Text>
              <Text style={styles.cardHolder}>09/29</Text>
            </View>
            <View>
              <Text style={styles.cardLabel}>CVV</Text>
              <Text style={styles.cardHolder}>•••</Text>
            </View>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.actionsBox}>
          <TouchableOpacity
            style={[styles.actionBtn, frozen ? styles.unfreezeBtn : styles.freezeBtn]}
            onPress={() => setFrozen(!frozen)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={frozen ? 'lock-open' : 'lock-closed'}
              size={18}
              color={frozen ? '#10B981' : '#EF4444'}
            />
            <Text style={[styles.actionBtnText, { color: frozen ? '#10B981' : '#EF4444' }]}>
              {frozen ? 'Unlock Virtual Card' : 'Freeze Virtual Card'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtnSecondary, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            onPress={() => Alert.alert('Card Limits', 'Online Spending Limit: $50,000 / day')}
            activeOpacity={0.7}
          >
            <Ionicons name="speedometer-outline" size={18} color="#7052FF" />
            <Text style={[styles.actionBtnSecondaryText, { color: theme.textPrimary }]}>
              Manage Daily Spending Limits
            </Text>
          </TouchableOpacity>
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
  cardSurface: {
    borderRadius: 22,
    padding: 24,
    height: 200,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(112, 82, 255, 0.4)',
    marginBottom: 20,
  },
  cardFrozen: {
    opacity: 0.5,
    borderColor: '#EF4444',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrand: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  chipBox: {
    transform: [{ rotate: '90deg' }],
  },
  cardNumber: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 3,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardHolder: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  actionsBox: {
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  freezeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  unfreezeBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});