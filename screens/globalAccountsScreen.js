// screens/globalAccountsScreen.js
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

const GlobalAccountsScreen = ({ navigation }) => {
  const { theme } = useAppTheme();

  const handleStartSetup = () => {
    Alert.alert('Coming Soon', 'Global multi-currency account setup will be available in the next release.');
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
        {/* Graphic Illustration Centerpiece */}
        <View style={styles.graphicContainer}>
          <View style={styles.badgeWrapper}>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonBadgeText}>COMING SOON</Text>
            </View>
          </View>

          {/* Currency coins floating illustration */}
          <View style={styles.coinsRow}>
            <View style={[styles.coinCircle, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.coinText}>$</Text>
            </View>
            <View style={[styles.coinCircle, { backgroundColor: '#D97706' }]}>
              <Text style={styles.coinText}>K</Text>
            </View>
            <View style={[styles.coinCircle, { backgroundColor: '#FBBF24' }]}>
              <Text style={styles.coinText}>€</Text>
            </View>
            <View style={[styles.coinCircle, { backgroundColor: '#D97706' }]}>
              <Text style={styles.coinText}>R</Text>
            </View>
            <View style={[styles.coinCircle, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.coinText}>£</Text>
            </View>
          </View>

          <View style={styles.birdCircle}>
            <Ionicons name="globe-outline" size={64} color="#7052FF" />
          </View>
        </View>

        {/* Main Text Content */}
        <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
          Balances in your favourite currencies.
        </Text>
        <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
          Receive funds from all over the world in your favorite currencies.
        </Text>
      </ScrollView>

      {/* Footer Setup Button */}
      <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.setupBtn} onPress={handleStartSetup} activeOpacity={0.8}>
          <Text style={styles.setupBtnText}>Start Setup</Text>
        </TouchableOpacity>
        <Text style={[styles.poweredText, { color: theme.textMuted }]}>POWERED BY LEAD REMIT</Text>
      </View>
    </ScreenWrapper>
  );
};

export default GlobalAccountsScreen;

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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  graphicContainer: { alignItems: 'center', marginBottom: 40, position: 'relative' },
  badgeWrapper: { marginBottom: 20 },
  comingSoonBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  comingSoonBadgeText: { color: '#F59E0B', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  coinsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  coinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  coinText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  birdCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(112, 82, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', lineHeight: 28 },
  heroSub: { fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 18, paddingHorizontal: 10 },
  footer: { padding: 20, borderTopWidth: 1, alignItems: 'center' },
  setupBtn: {
    backgroundColor: '#7052FF',
    width: '100%',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  setupBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  poweredText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
});