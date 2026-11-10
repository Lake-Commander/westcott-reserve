import React, { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebAnchor } from '../components/WebAnchor';
import BrandLockup from '../components/BrandLockup';

const APK_URL = '/downloads/westcott-reserve.apk';

const PREVIEW_ITEMS = [
  { title: 'Your overview', detail: 'A clear view of your account', icon: 'grid-outline' },
  { title: 'Market watch', detail: 'Follow major stock market symbols', icon: 'trending-up-outline' },
  { title: 'Card controls', detail: 'Explore virtual and physical card screens', icon: 'card-outline' },
];

export default function WebDownloadScreen() {
  const { width } = useWindowDimensions();
  const isDark = useColorScheme() === 'dark';
  const isMobile = width < 760;
  const [downloadPromptVisible, setDownloadPromptVisible] = useState(false);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Open this page in a web browser to download the Android APK.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.page, isDark && styles.pageDark]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.topBar, isDark && styles.topBarDark]}>
          <WebAnchor href="/" target="_self" style={styles.brandLink}>
            <BrandLockup dark={isDark} subtitle="APP LISTING" />
          </WebAnchor>
          <WebAnchor href="/" target="_self" style={styles.siteLink}>
            <Text style={[styles.siteLinkText, isDark && styles.darkLinkText]}>Visit website</Text>
          </WebAnchor>
        </View>

        <View style={[styles.content, isMobile && styles.contentMobile]}>
          <View style={[styles.listingCard, isDark && styles.surfaceDark]}>
            <View style={[styles.appSummary, isMobile && styles.appSummaryMobile]}>
              <Image source={require('../assets/icon.png')} style={styles.appIcon} />
              <View style={styles.appDetails}>
                <Text style={[styles.appName, isDark && styles.lightText]}>Westcott Reserve</Text>
                <Text style={styles.developer}>Westcott Reserve</Text>
                <Text style={[styles.category, isDark && styles.mutedDarkText]}>Finance</Text>
                <View style={styles.ratingRow}>
                  <Text style={[styles.rating, isDark && styles.lightText]}>Android app</Text>
                  <Text style={[styles.ratingDivider, isDark && styles.mutedDarkText]}>·</Text>
                  <Text style={[styles.ratingNote, isDark && styles.mutedDarkText]}>App details</Text>
                  <Text style={[styles.ratingDivider, isDark && styles.mutedDarkText]}>·</Text>
                  <Text style={[styles.ratingNote, isDark && styles.mutedDarkText]}>Version 1.0</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setDownloadPromptVisible(true)}
              style={styles.installButton}
              activeOpacity={0.85}
            >
              <Text style={styles.installButtonText}>Download APK</Text>
            </TouchableOpacity>
            <Text style={[styles.installNote, isDark && styles.mutedDarkText]}>Android app · Installer download</Text>

            <View style={[styles.listingDivider, isDark && styles.dividerDark]} />
            <View style={styles.sectionHeadingRow}>
              <Text style={[styles.sectionTitle, isDark && styles.lightText]}>About this app</Text>
              <Ionicons name="arrow-forward" size={18} color={isDark ? '#AAB4C2' : '#5F6368'} />
            </View>
            <Text style={[styles.description, isDark && styles.mutedDarkText]}>
              Explore everyday account tools, an equity watchlist, card controls, transfers, and
              transaction history in one thoughtfully designed mobile experience.
            </Text>

            <View style={styles.infoGrid}>
              <InfoItem label="Version" value="1.0" dark={isDark} />
              <InfoItem label="Requires Android" value="Android 8.0+" dark={isDark} />
            </View>

            <View style={[styles.listingDivider, isDark && styles.dividerDark]} />
            <View style={styles.sectionHeadingRow}>
              <Text style={[styles.sectionTitle, isDark && styles.lightText]}>Screenshots</Text>
              <Text style={[styles.screenshotHint, isDark && styles.mutedDarkText]}>App preview</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previewStrip}
            >
              {PREVIEW_ITEMS.map((item, index) => (
                <AppPreview key={item.title} item={item} index={index} dark={isDark} />
              ))}
            </ScrollView>

            <View style={[styles.safetyNotice, isDark && styles.noticeDark]}>
              <Ionicons name="information-circle-outline" size={20} color={isDark ? '#AAB4C2' : '#5F6368'} />
              <Text style={[styles.safetyNoticeText, isDark && styles.mutedDarkText]}>
                Westcott Reserve
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={downloadPromptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDownloadPromptVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.dialog, isDark && styles.surfaceDark]}>
            <View style={styles.dialogIcon}>
              <Ionicons name="download-outline" size={25} color="#1967D2" />
            </View>
            <Text style={[styles.dialogTitle, isDark && styles.lightText]}>Allow the download</Text>
            <Text style={[styles.dialogText, isDark && styles.mutedDarkText]}>
              Your browser may ask you to confirm this APK download. If it is blocked, allow downloads
              for this site in your browser’s site or download settings, then try again.
            </Text>
            <WebAnchor
              href={APK_URL}
              download="Westcott Reserve.apk"
              target="_self"
              style={styles.dialogDownload}
            >
              <Text style={styles.dialogDownloadText}>Continue to download</Text>
            </WebAnchor>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setDownloadPromptVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={[styles.cancelButtonText, isDark && styles.mutedDarkText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoItem({ label, value, dark = false }) {
  return (
    <View style={styles.infoItem}>
      <Text style={[styles.infoLabel, dark && styles.mutedDarkText]}>{label}</Text>
      <Text style={[styles.infoValue, dark && styles.lightText]}>{value}</Text>
    </View>
  );
}

function AppPreview({ item, index, dark }) {
  return (
    <View style={[styles.phoneFrame, index > 0 && styles.phoneFrameAlternate, dark && styles.phoneDark]}>
      <View style={styles.phoneTopLine} />
      <View style={styles.phoneHeader}>
        <View>
          <Text style={[styles.phoneBrand, dark && styles.mutedDarkText]}>WESTCOTT RESERVE</Text>
          <Text style={[styles.phoneTitle, dark && styles.lightText]}>{item.title}</Text>
        </View>
        <View style={styles.phoneAvatar}><Text style={styles.phoneAvatarText}>W</Text></View>
      </View>
      <View style={[styles.phoneBalance, dark && styles.phoneSurfaceDark]}>
        <Text style={[styles.phoneBalanceLabel, dark && styles.mutedDarkText]}>ACCOUNT OVERVIEW</Text>
        <Text style={[styles.phoneBalanceValue, dark && styles.lightText]}>•••• ••••</Text>
        <View style={styles.phoneChart}>
          {[24, 38, 29, 48, 34, 55, 42, 64, 51, 72].map((height, barIndex) => (
            <View key={barIndex} style={[styles.phoneChartBar, { height }]} />
          ))}
        </View>
      </View>
      <View style={styles.phoneActionRow}>
        <View style={[styles.phoneAction, dark && styles.phoneSurfaceDark]}><Ionicons name="arrow-down-outline" size={15} color="#8170E8" /><Text style={styles.phoneActionText}>Receive</Text></View>
        <View style={[styles.phoneAction, dark && styles.phoneSurfaceDark]}><Ionicons name="swap-horizontal-outline" size={15} color="#8170E8" /><Text style={styles.phoneActionText}>Transfer</Text></View>
      </View>
      <View style={[styles.phonePreviewFoot, dark && styles.phoneSurfaceDark]}>
        <View style={styles.phonePreviewIcon}><Ionicons name={item.icon} size={16} color="#5141C7" /></View>
        <View style={styles.phonePreviewCopy}>
          <Text style={[styles.phonePreviewTitle, dark && styles.lightText]}>{item.title}</Text>
          <Text style={[styles.phonePreviewDetail, dark && styles.mutedDarkText]}>{item.detail}</Text>
        </View>
      </View>
      <Text style={styles.phoneSampleTag}>WESTCOTT RESERVE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F6F8FC' },
  pageDark: { backgroundColor: '#10151D' },
  scrollContent: { flexGrow: 1, paddingBottom: 48 },
  topBar: {
    minHeight: 72,
    paddingHorizontal: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  topBarDark: { backgroundColor: '#171E29', borderBottomColor: '#2B3543' },
  brandLink: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#D8B978', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#132237', fontSize: 21, fontWeight: '800' },
  brandName: { color: '#1F2937', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  brandCaption: { color: '#77808C', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 3 },
  siteLink: { paddingVertical: 10, paddingHorizontal: 14 },
  siteLinkText: { color: '#1967D2', fontSize: 13, fontWeight: '700' },
  darkLinkText: { color: '#93B8FF' },
  content: { width: '100%', maxWidth: 1020, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 34 },
  contentMobile: { paddingHorizontal: 12, paddingTop: 18 },
  listingCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E8EAED', padding: 28 },
  surfaceDark: { backgroundColor: '#171E29', borderColor: '#2B3543' },
  appSummary: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  appSummaryMobile: { alignItems: 'flex-start', gap: 14 },
  appIcon: { width: 88, height: 88, borderRadius: 20, backgroundColor: '#F2F4F7' },
  appDetails: { flex: 1 },
  appName: { color: '#202124', fontSize: 25, fontWeight: '700' },
  lightText: { color: '#F4F6F8' },
  developer: { color: '#188038', fontSize: 14, marginTop: 4, fontWeight: '600' },
  category: { color: '#5F6368', fontSize: 13, marginTop: 5 },
  mutedDarkText: { color: '#B0BAC8' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12, flexWrap: 'wrap' },
  rating: { color: '#3C4043', fontSize: 12, fontWeight: '700' },
  ratingDivider: { color: '#9AA0A6' },
  ratingNote: { color: '#5F6368', fontSize: 11 },
  installButton: { backgroundColor: '#1967D2', borderRadius: 8, minHeight: 46, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  installButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  installNote: { color: '#70757A', fontSize: 11, textAlign: 'center', marginTop: 9 },
  listingDivider: { height: 1, backgroundColor: '#E8EAED', marginVertical: 25 },
  dividerDark: { backgroundColor: '#2B3543' },
  sectionHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#202124', fontSize: 18, fontWeight: '700' },
  description: { color: '#5F6368', fontSize: 13, lineHeight: 21, marginTop: 12, maxWidth: 740 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 26, marginTop: 22 },
  infoItem: { minWidth: 120, gap: 5 },
  infoLabel: { color: '#80868B', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: '700' },
  infoValue: { color: '#3C4043', fontSize: 12, fontWeight: '600' },
  screenshotHint: { color: '#70757A', fontSize: 11 },
  previewStrip: { gap: 14, paddingTop: 17, paddingBottom: 4 },
  phoneFrame: { width: 218, minHeight: 355, borderRadius: 25, padding: 17, backgroundColor: '#F6F7FB', borderWidth: 1, borderColor: '#E0E3E9' },
  phoneFrameAlternate: { backgroundColor: '#F7F5FF' },
  phoneDark: { backgroundColor: '#111722', borderColor: '#303B4B' },
  phoneTopLine: { width: 44, height: 4, borderRadius: 3, backgroundColor: '#B9BEC8', alignSelf: 'center', marginBottom: 16 },
  phoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phoneBrand: { color: '#7C8492', fontSize: 7, fontWeight: '800', letterSpacing: 0.8 },
  phoneTitle: { color: '#1E293B', fontSize: 14, fontWeight: '800', marginTop: 4 },
  phoneAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#5141C7', alignItems: 'center', justifyContent: 'center' },
  phoneAvatarText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  phoneBalance: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 13, marginTop: 18, borderWidth: 1, borderColor: '#EBEDF2' },
  phoneSurfaceDark: { backgroundColor: '#202A38', borderColor: '#303B4B' },
  phoneBalanceLabel: { color: '#77808C', fontSize: 7, fontWeight: '800', letterSpacing: 0.5 },
  phoneBalanceValue: { color: '#1E293B', fontSize: 17, fontWeight: '800', marginTop: 5 },
  phoneChart: { height: 66, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 9 },
  phoneChartBar: { width: 10, borderRadius: 5, backgroundColor: '#D7D1FF' },
  phoneActionRow: { flexDirection: 'row', gap: 9, marginTop: 11 },
  phoneAction: { flex: 1, height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#EBEDF2' },
  phoneActionText: { color: '#8170E8', fontSize: 9, fontWeight: '700' },
  phonePreviewFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, marginTop: 10, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EBEDF2' },
  phonePreviewIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#EEEAFE', alignItems: 'center', justifyContent: 'center' },
  phonePreviewCopy: { flex: 1 },
  phonePreviewTitle: { color: '#202124', fontSize: 9, fontWeight: '700' },
  phonePreviewDetail: { color: '#70757A', fontSize: 7, marginTop: 3 },
  phoneSampleTag: { color: '#9AA0A6', fontSize: 7, letterSpacing: 0.7, fontWeight: '800', textAlign: 'center', marginTop: 13 },
  safetyNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#F8F9FA', borderRadius: 12, padding: 14, marginTop: 23 },
  noticeDark: { backgroundColor: '#202A38' },
  safetyNoticeText: { flex: 1, color: '#5F6368', fontSize: 11, lineHeight: 17 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(20, 28, 38, 0.42)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24, gap: 13, shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 8 } },
  dialogIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#E8F0FE', alignItems: 'center', justifyContent: 'center' },
  dialogTitle: { color: '#202124', fontSize: 20, fontWeight: '700' },
  dialogText: { color: '#5F6368', fontSize: 13, lineHeight: 20 },
  dialogDownload: { minHeight: 44, borderRadius: 8, backgroundColor: '#1967D2', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  dialogDownloadText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  cancelButton: { minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: '#5F6368', fontSize: 13, fontWeight: '600' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F6F8FC' },
  fallbackText: { color: '#5F6368', fontSize: 14, textAlign: 'center' },
});
