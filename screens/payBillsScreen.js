// screens/payBillsScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const BILL_ITEMS = [
  { id: 'airtime', name: 'Airtime', sub: 'Single and multiple airtime options', icon: 'phone-portrait-outline', isComingSoon: true },
  { id: 'data', name: 'Data', sub: 'Single and multiple data options', icon: 'wifi-outline', isComingSoon: true },
  { id: 'cable', name: 'Cable TV', sub: 'Recharge preferred cable easily', icon: 'tv-outline', isComingSoon: true },
  { id: 'electricity', name: 'Electricity', sub: 'Pay for electricity bill fast and easy', icon: 'flash-outline', isComingSoon: true },
  { id: 'betting', name: 'Betting', sub: 'Fund your bet wallet', icon: 'game-controller-outline', isComingSoon: true },
  { id: 'flights', name: 'Flights', sub: 'Book and access flights globally', icon: 'airplane-outline', isComingSoon: true },
];

const PayBillsScreen = ({ navigation }) => {
  const { theme } = useAppTheme();

  const handlePress = (item) => {
    Alert.alert('Coming Soon', `${item.name} bill payments will be available in the next release.`);
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Bill Payment</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Select how you want to manage your bills for yourself and a third party.
        </Text>

        <View style={[styles.cardContainer, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {BILL_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemRow,
                index < BILL_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
              ]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: theme.surfaceLight }]}>
                <Ionicons name={item.icon} size={18} color="#7052FF" />
              </View>

              <View style={styles.textCol}>
                <View style={styles.titleRow}>
                  <Text style={[styles.itemName, { color: theme.textPrimary }]}>{item.name}</Text>
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

export default PayBillsScreen;

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
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 20, lineHeight: 18 },
  cardContainer: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textCol: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { fontSize: 14.5, fontWeight: '700' },
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