// screens/profileScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../services/authService';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const ProfileScreen = ({ navigation }) => {
  const user = useSelector((state) => state.userReducer?.user);
  const { theme } = useAppTheme();

  const rawName = user?.name || 'Account Holder';
  const username = user?.username || (user?.email ? user.email.split('@')[0] : 'user');

  const userInitials =
    rawName
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'WR';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Westcott Reserve?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AuthService.signOut();
          navigation.reset({ index: 0, routes: [{ name: 'auth' }] });
        },
      },
    ]);
  };

  const handleVisitWebsite = async () => {
    const websiteUrl = 'https://westcottreserve.com';
    try {
      const supported = await Linking.canOpenURL(websiteUrl);
      if (supported) {
        await Linking.openURL(websiteUrl);
      } else {
        Alert.alert('Unable to Open', `Could not open ${websiteUrl}`);
      }
    } catch (err) {
      console.warn('Linking error:', err);
    }
  };

  const renderMenuItem = (icon, label, onPress, isLast = false, isDestructive = false) => (
    <TouchableOpacity
      style={[
        styles.menuRow,
        { borderBottomColor: isLast ? 'transparent' : theme.cardBorder },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: isDestructive ? 'rgba(239, 68, 68, 0.12)' : theme.accentSoft },
          ]}
        >
          <Ionicons
            name={icon}
            size={17}
            color={isDestructive ? '#EF4444' : theme.accent}
          />
        </View>
        <Text style={[styles.menuText, { color: isDestructive ? '#EF4444' : theme.textPrimary }]}>
          {label}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={isDestructive ? '#EF4444' : theme.textMuted}
      />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Tier Header Card */}
        <View style={[styles.tierCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.userTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{userInitials}</Text>
              <View style={[styles.shieldBadge, { backgroundColor: theme.cardBg }]}>
                <Ionicons name="shield-checkmark" size={10} color="#D4AF37" />
              </View>
            </View>
            <View style={styles.nameBlock}>
              <Text style={[styles.cardName, { color: theme.textPrimary }]}>
                {rawName.toUpperCase()}
              </Text>
              <Text style={[styles.cardHandle, { color: theme.textSecondary }]}>
                @{username}
              </Text>
            </View>
          </View>

          {/* Tier Progress Bar */}
          <View style={[styles.progressBarBg, { backgroundColor: theme.surfaceLight }]}>
            <View style={styles.progressBarFill} />
          </View>

          {/* Tier Upgrade Row */}
          <View style={styles.tierBottomRow}>
            <View>
              <Text style={[styles.tierText, { color: theme.textSecondary }]}>
                You are currently on Tier 2
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('accountLimits')}>
                <Text style={styles.upgradeLink}>Upgrade your limit</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => navigation.navigate('accountLimits')}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 1: SETTINGS */}
        <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>SETTINGS</Text>
        <View style={[styles.menuCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {renderMenuItem("person-outline", "Profile", () => navigation.navigate('personalInfo'))}
          {renderMenuItem("checkmark-done-circle-outline", "Verification", () => navigation.navigate('verification'))}
          {renderMenuItem("lock-closed-outline", "Security", () => navigation.navigate('security'))}
          {renderMenuItem("speedometer-outline", "Account Limits", () => navigation.navigate('accountLimits'))}
          {renderMenuItem("timer-outline", "Transaction Fees", () => navigation.navigate('transactionFees'))}
          {renderMenuItem("color-palette-outline", "App Preferences", () => navigation.navigate('preferences'))}
          {renderMenuItem("notifications-outline", "Notification Settings", () => navigation.navigate('notificationSettings'), true)}
        </View>

        {/* SECTION 2: MORE */}
        <Text style={[styles.sectionHeader, { color: theme.textMuted, marginTop: 24 }]}>MORE</Text>
        <View style={[styles.menuCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {renderMenuItem("people-outline", "Manage Beneficiaries", () => navigation.navigate('manageBeneficiaries'))}
          {renderMenuItem("receipt-outline", "Account Statement", () => navigation.navigate('requestStatement'))}
          {renderMenuItem("phone-portrait-outline", "Device History", () => navigation.navigate('deviceHistory'))}
          {renderMenuItem("call-outline", "Contact Us", () => navigation.navigate('contactUs'))}
          {renderMenuItem("scale-outline", "Terms & Condition", () => navigation.navigate('termsConditions'))}
          {renderMenuItem("globe-outline", "Visit Our Website", handleVisitWebsite)}
          {renderMenuItem("log-out-outline", "Logout", handleLogout, true, true)}
        </View>

        {/* Footer Brand Logo */}
        <View style={styles.footerBrand}>
          <View style={[styles.brandIconCircle, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="sparkles" size={20} color={theme.accent} />
          </View>
          <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>Westcott Reserve</Text>
          <Text style={[styles.versionText, { color: theme.textMuted }]}>v1.0.00</Text>
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 110,
  },
  tierCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 24,
  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7052FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  shieldBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  nameBlock: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardHandle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    marginVertical: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '65%',
    height: '100%',
    backgroundColor: '#7052FF',
    borderRadius: 2,
  },
  tierBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierText: {
    fontSize: 12,
    fontWeight: '500',
  },
  upgradeLink: {
    color: '#7052FF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  upgradeBtn: {
    backgroundColor: 'rgba(112, 82, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(112, 82, 255, 0.35)',
  },
  upgradeBtnText: {
    color: '#7052FF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 6,
  },
  menuCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  footerBrand: {
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 12,
    gap: 4,
  },
  brandIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '500',
  },
});