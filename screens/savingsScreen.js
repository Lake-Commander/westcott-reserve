// screens/savingsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const HIGH_INTEREST_ITEMS = [
  { id: 'pwa', name: 'PWA', tag: 'HOT 🔥', sub: 'Premium wealth accounts', icon: 'ribbon-outline' },
  { id: 'hifa', name: 'HIFA', tag: null, sub: 'High interest fixed accounts', icon: 'cash-outline' },
];

const OTHER_SAVINGS = [
  { id: 'flexi', name: 'Flexi Savings', tag: 'NEW 🚀', sub: 'Earn interest on your money while it sits idle.', icon: 'wallet-outline' },
  { id: 'target', name: 'Target Savings', tag: null, sub: 'Create and reach your savings goals', icon: 'disc-outline' },
  { id: 'fixed', name: 'Fixed Savings', tag: null, sub: 'Safely lock your funds for later', icon: 'lock-closed-outline' },
  { id: 'spend_save', name: 'Spend x Save', tag: null, sub: 'Save a % of every amount you spend', icon: 'card-outline' },
  { id: 'pockets', name: 'Pockets', tag: null, sub: 'Keep money aside for later', icon: 'briefcase-outline' },
];

const SavingsScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const currentUser = useSelector((state) => state.userReducer?.user);
  const [showBal, setShowBal] = useState(false);

  const totalSavingsBal = currentUser?.savings_balance ? parseFloat(currentUser.savings_balance) : 0.0;

  const handlePressItem = (item) => {
    Alert.alert('Coming Soon', `${item.name} interest features will launch in an upcoming update.`);
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Savings</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Create and manage your savings.
        </Text>

        {/* Your Balance Row */}
        <View style={styles.balHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.balLabel, { color: theme.textSecondary }]}>Your Balance</Text>
            <TouchableOpacity onPress={() => setShowBal(!showBal)}>
              <Ionicons name={showBal ? 'eye-outline' : 'eye-off-outline'} size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.returnsBadge}>
            <Text style={styles.returnsText}>Up to 13% returns</Text>
          </View>
        </View>

        <Text style={[styles.balAmountText, { color: theme.textPrimary }]}>
          {showBal ? `$${totalSavingsBal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••••'}
        </Text>

        {/* Recents Ticker Banner */}
        <View style={[styles.recentsCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.recentsPill}>
            <Text style={styles.recentsPillText}>Recents</Text>
          </View>
          <Text style={[styles.recentsText, { color: theme.textSecondary }]}>
            Credited interest of USD 26.83 by ogb****com
          </Text>
        </View>

        {/* HIGH INTEREST SAVINGS SECTION */}
        <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>HIGH INTEREST SAVINGS</Text>
        <View style={[styles.groupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {HIGH_INTEREST_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemRow,
                idx < HIGH_INTEREST_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
              ]}
              onPress={() => handlePressItem(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: theme.surfaceLight }]}>
                <Ionicons name={item.icon} size={18} color="#7052FF" />
              </View>

              <View style={styles.textCol}>
                <View style={styles.titleRow}>
                  <Text style={[styles.itemName, { color: theme.textPrimary }]}>{item.name}</Text>
                  {item.tag && <Text style={styles.tagText}>{item.tag}</Text>}
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>COMING SOON</Text>
                  </View>
                </View>
                <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{item.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* OTHERS SECTION */}
        <Text style={[styles.sectionHeader, { color: theme.textMuted, marginTop: 22 }]}>OTHERS</Text>
        <View style={[styles.groupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {OTHER_SAVINGS.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemRow,
                idx < OTHER_SAVINGS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
              ]}
              onPress={() => handlePressItem(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: theme.surfaceLight }]}>
                <Ionicons name={item.icon} size={18} color="#7052FF" />
              </View>

              <View style={styles.textCol}>
                <View style={styles.titleRow}>
                  <Text style={[styles.itemName, { color: theme.textPrimary }]}>{item.name}</Text>
                  {item.tag && <Text style={styles.tagText}>{item.tag}</Text>}
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>COMING SOON</Text>
                  </View>
                </View>
                <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{item.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default SavingsScreen;

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
  scrollContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 20 },
  balHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balLabel: { fontSize: 13, fontWeight: '600' },
  returnsBadge: {
    backgroundColor: 'rgba(112, 82, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  returnsText: { color: '#7052FF', fontSize: 11, fontWeight: '700' },
  balAmountText: { fontSize: 24, fontWeight: '800', marginTop: 6, marginBottom: 16 },
  recentsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  recentsPill: {
    backgroundColor: '#7052FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 10,
  },
  recentsPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  recentsText: { flex: 1, fontSize: 11.5, fontWeight: '500' },
  sectionHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginLeft: 4 },
  groupCard: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textCol: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemName: { fontSize: 14.5, fontWeight: '700' },
  tagText: { fontSize: 10, fontWeight: '700', color: '#F59E0B' },
  comingSoonBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  comingSoonText: { color: '#F59E0B', fontSize: 9, fontWeight: '800' },
  itemSub: { fontSize: 12, marginTop: 2 },
});