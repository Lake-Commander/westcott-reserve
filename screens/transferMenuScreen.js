import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const TransferMenuScreen = ({ navigation }) => {
  const { theme } = useAppTheme();

  return (
    <ScreenWrapper>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.backCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Transfer Funds 💸</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>How would you like to send money?</Text>
        </View>

        {/* Dynamic Theme Options Card */}
        <View style={[styles.menuCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {/* Option 1: Username */}
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomColor: theme.cardBorder }]}
            onPress={() => navigation.navigate('transferUsername')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="sparkles" size={18} color={theme.accent} />
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Westcott Username</Text>
              <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>
                Send money via usernames on Westcott for fast and free transfers.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Option 2: QR Code */}
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomColor: theme.cardBorder }]}
            onPress={() => navigation.navigate('qrTransfer')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
              <Ionicons name="qr-code-outline" size={18} color="#F59E0B" />
            </View>
            <View style={styles.textCol}>
              <View style={styles.titleWithBadge}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Scan QR Code</Text>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </View>
              <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>
                Scan Westcott QR codes for fast, free and easy payments.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Option 3: Other Banks */}
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate('transferBank')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="business-outline" size={18} color={theme.accent} />
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Bank Transfer</Text>
              <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>
                Send money to supported US and European bank accounts.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default TransferMenuScreen;

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
  content: { paddingHorizontal: 18, paddingTop: 10 },
  headerBlock: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4 },
  menuCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    borderBottomWidth: 1,
    gap: 14,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(112, 82, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  textCol: { flex: 1 },
  titleWithBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  newBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: { color: '#F59E0B', fontSize: 9, fontWeight: '800' },
  rowDesc: { fontSize: 12, lineHeight: 17, marginTop: 3 },
});
