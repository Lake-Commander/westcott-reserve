// screens/contactUsScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const ContactUsScreen = ({ navigation }) => {
  const { theme } = useAppTheme();

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
});