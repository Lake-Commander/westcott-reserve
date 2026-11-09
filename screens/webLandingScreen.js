import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { WebAnchor } from "../components/WebAnchor";

export default function WestcottWebLanding({ onLaunchApp }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  if (Platform.OS !== "web") {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.unsupportedText}>
          Westcott Reserve Web Portal is optimized for desktop and tablet browsers.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* SECTION 1: DARK NAVY HEADER & HERO */}
      <View style={styles.sectionHeaderHero}>
        <View style={styles.boxWidth}>
          <Navbar isDesktop={isDesktop} onLaunchApp={onLaunchApp} />
          <Hero isDesktop={isDesktop} isTablet={isTablet} onLaunchApp={onLaunchApp} />
        </View>
      </View>

      {/* SECTION 2: LIGHT SLATE CORE MODULES */}
      <View style={styles.sectionLightModules}>
        <View style={[styles.boxWidth, styles.paddingX]}>
          <CoreModules isDesktop={isDesktop} onLaunchApp={onLaunchApp} />
        </View>
      </View>

      {/* SECTION 3: DARK SLATE BENEFITS GRID */}
      <View style={styles.sectionDarkGrid}>
        <View style={[styles.boxWidth, styles.paddingX]}>
          <BenefitsGrid isDesktop={isDesktop} />
        </View>
      </View>

      {/* SECTION 4: ELECTRIC BLUE MOBILE APP BANNER */}
      <View style={styles.sectionBlueBanner}>
        <View style={[styles.boxWidth, styles.paddingX]}>
          <MobileAppSection isDesktop={isDesktop} />
        </View>
      </View>

      {/* SECTION 5: ICE BLUE CTA BANNER */}
      <View style={styles.sectionLightCTA}>
        <View style={[styles.boxWidth, styles.paddingX]}>
          <CTA isDesktop={isDesktop} onLaunchApp={onLaunchApp} />
        </View>
      </View>

      {/* SECTION 6: MIDNIGHT FOOTER */}
      <View style={styles.sectionFooter}>
        <View style={[styles.boxWidth, styles.paddingX]}>
          <Footer isDesktop={isDesktop} />
        </View>
      </View>
    </ScrollView>
  );
}

/* ==========================================================================
   SUB-COMPONENTS
   ========================================================================== */

const AuthAction = ({ onLaunchApp, style, children }) => (
  <TouchableOpacity
    accessibilityRole="button"
    onPress={onLaunchApp}
    style={style}
  >
    {children}
  </TouchableOpacity>
);

// 1. NAVBAR
const Navbar = ({ isDesktop, onLaunchApp }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = [
    { id: "accounts", title: "Foreign Accounts" },
    { id: "exchange", title: "Exchange" },
    { id: "cards", title: "Virtual Cards" },
    { id: "transfers", title: "Transfers" },
  ];

  return (
    <View style={styles.navbar}>
      <View style={styles.brandContainer}>
        <View style={styles.brandIcon}>
          <Text style={styles.brandIconText}>W</Text>
        </View>
        <Text style={styles.brandTitleDark}>
          WESTCOTT <Text style={styles.brandHighlight}>RESERVE</Text>
        </Text>
      </View>

      {isDesktop ? (
        <View style={styles.navLinksRow}>
          {navLinks.map((link) => (
            <WebAnchor key={link.id} href={`#${link.id}`} style={styles.navAnchor}>
              <Text style={styles.navLinkTextDark}>{link.title}</Text>
            </WebAnchor>
          ))}
          <AuthAction onLaunchApp={onLaunchApp} style={styles.navAnchor}>
            <Text style={[styles.navLinkTextDark, { color: "#FFFFFF", fontWeight: "700" }]}>Sign In</Text>
          </AuthAction>
          <AuthAction onLaunchApp={onLaunchApp} style={styles.navBtnPrimary}>
            <Text style={styles.navBtnPrimaryText}>Create Account</Text>
          </AuthAction>
        </View>
      ) : (
        <View style={{ position: "relative" }}>
          <TouchableOpacity
            onPress={() => setMenuOpen(!menuOpen)}
            style={styles.hamburgerBtn}
          >
            <Text style={{ color: "#FFF", fontSize: 22 }}>
              {menuOpen ? "✕" : "☰"}
            </Text>
          </TouchableOpacity>

          {menuOpen && (
            <View style={styles.mobileDropdown}>
              {navLinks.map((link) => (
                <WebAnchor
                  key={link.id}
                  href={`#${link.id}`}
                  style={styles.mobileNavAnchor}
                >
                  <Text style={styles.mobileNavText}>{link.title}</Text>
                </WebAnchor>
              ))}
              <View style={{ height: 1, backgroundColor: "#334155", marginVertical: 8 }} />
              <AuthAction onLaunchApp={onLaunchApp} style={styles.mobileNavAnchor}>
                <Text style={[styles.mobileNavText, { color: "#00F6FF" }]}>Sign In / Create Account</Text>
              </AuthAction>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// 2. HERO
const Hero = ({ isDesktop, isTablet, onLaunchApp }) => (
  <View
    nativeID="home"
    style={[
      styles.heroRow,
      (!isDesktop || isTablet) && styles.heroColumn,
    ]}
  >
    <View style={styles.flex1}>
      <View style={styles.heroBadgeContainer}>
        <View style={styles.heroBadgeDot} />
        <Text style={styles.heroBadgeText}>INCLUSIVE GLOBAL BANKING DESIGNED FOR YOU</Text>
      </View>

      <Text style={styles.heroHeadingText}>
        Receive, send, exchange {"\n"}
        <Text style={{ color: "#00F6FF" }}>& manage multiple currencies</Text>
      </Text>
      <Text style={styles.heroHeadingSubText}>in one app.</Text>

      <Text style={styles.heroParagraphText}>
        Open a foreign bank account from your phone for free. Access real-time currency
        exchange, instant global transfers, and dedicated IBAN balances without borders.
      </Text>

      <View style={styles.heroCtaRow}>
        <AuthAction onLaunchApp={onLaunchApp} style={styles.heroPrimaryBtn}>
          <Text style={styles.heroPrimaryBtnText}>Create free account</Text>
        </AuthAction>
        <AuthAction onLaunchApp={onLaunchApp} style={styles.heroSecondaryBtn}>
          <Text style={styles.heroSecondaryBtnText}>Sign In</Text>
        </AuthAction>
        <WebAnchor href="#download" style={{ marginLeft: 8 }}>
          <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "600", textDecorationLine: "underline" }}>
            or download APK
          </Text>
        </WebAnchor>
      </View>
    </View>

    {/* Hero Graphic */}
    <View
      style={[
        styles.flex1,
        styles.centerItems,
        { marginTop: isDesktop ? 0 : 40, width: "100%" },
      ]}
    >
      <View style={styles.cardGraphicContainer}>
        <View style={styles.cardGraphic}>
          <View style={styles.cardGraphicHeader}>
            <Text style={styles.cardBrand}>WESTCOTT GLOBAL VAULT</Text>
            <Text style={styles.cardTier}>USD / EUR / GBP</Text>
          </View>
          
          <View style={{ marginVertical: 20 }}>
            <Text style={{ color: "#94A3B8", fontSize: 13, letterSpacing: 0.5 }}>
              PRIMARY USD BALANCE
            </Text>
            <Text style={styles.cardBalanceText}>$124,500.00</Text>
          </View>

          <View style={styles.multiCurrencyRow}>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyFlag}>🇪🇺 €42,110.00</Text>
            </View>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyFlag}>🇬🇧 £18,450.00</Text>
            </View>
          </View>

          <View style={styles.cardGraphicFooter}>
            <View>
              <Text style={styles.cardSubText}>ACCOUNT HOLDER</Text>
              <Text style={styles.cardHolderText}>WESTCOTT O. POLLY</Text>
            </View>
            <View>
              <Text style={styles.cardSubText}>ROUTING / IBAN</Text>
              <Text style={styles.cardHolderText}>•••• 8842</Text>
            </View>
          </View>
        </View>

        <View style={styles.floatingWidget}>
          <View style={styles.widgetIconBg}>
            <Text style={{ fontSize: 16 }}>💱</Text>
          </View>
          <View>
            <Text style={{ color: "#0F172A", fontSize: 13, fontWeight: "700" }}>
              Instant FX Converted
            </Text>
            <Text style={{ color: "#059669", fontSize: 12, fontWeight: "600" }}>
              €5,000 ➔ $5,450.00 Cleared
            </Text>
          </View>
        </View>
      </View>
    </View>
  </View>
);

// 3. CORE MODULES
const CoreModules = ({ isDesktop, onLaunchApp }) => {
  const modules = [
    {
      id: "accounts",
      tag: "FOREIGN BANK ACCOUNTS",
      title: "Open a global multi-currency account",
      desc: "Get a bank account in just minutes. Receive and access your global payments whenever you want to.",
      btnText: "Get an account",
      icon: "🌐",
    },
    {
      id: "exchange",
      tag: "CURRENCY EXCHANGE",
      title: "Convert money at the best rates",
      desc: "Effortlessly exchange major world currencies at competitive rates. Convert money from local to foreign and back in a flash.",
      btnText: "Convert money",
      icon: "💱",
    },
    {
      id: "cards",
      tag: "VIRTUAL CARDS",
      title: "Shop and spend globally",
      desc: "Make international payments online with customizable virtual debit cards that just work everywhere.",
      btnText: "Get your card",
      icon: "💳",
    },
    {
      id: "transfers",
      tag: "MONEY TRANSFER",
      title: "Send money to clients & loved ones worldwide",
      desc: "Foreign or local payments? Westcott delivers your funds swiftly with end-to-end ledger tracking.",
      btnText: "Make a transfer",
      icon: "⚡",
    },
  ];

  return (
    <View style={{ paddingVertical: 20 }}>
      {modules.map((mod, index) => {
        const isEven = index % 2 === 0;
        return (
          <View
            key={mod.id}
            nativeID={mod.id}
            style={[
              styles.moduleRow,
              !isDesktop && styles.heroColumn,
              {
                marginVertical: 32,
                flexDirection: isDesktop && !isEven ? "row-reverse" : "row",
              },
            ]}
          >
            <View style={styles.flex1}>
              <View style={styles.lightBadgeContainer}>
                <Text style={styles.lightBadgeText}>{mod.tag}</Text>
              </View>
              <Text style={styles.heading2Light}>{mod.title}</Text>
              <Text style={styles.paragraphLight}>{mod.desc}</Text>

              <AuthAction onLaunchApp={onLaunchApp} style={[styles.modulePrimaryBtn, { marginTop: 20 }]}>
                <Text style={styles.modulePrimaryBtnText}>{mod.btnText}</Text>
              </AuthAction>
            </View>

            <View
              style={[
                styles.flex1,
                styles.centerItems,
                { marginTop: isDesktop ? 0 : 24, width: "100%" },
              ]}
            >
              <View style={styles.featureGraphicCard}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>{mod.icon}</Text>
                <Text style={{ color: "#0F172A", fontSize: 20, fontWeight: "700" }}>
                  {mod.title}
                </Text>
                <View style={styles.graphicCheckRow}>
                  <Text style={{ color: "#059669", fontWeight: "600" }}>✓ Instant Settlement</Text>
                  <Text style={{ color: "#059669", fontWeight: "600" }}>✓ Zero Hidden Fees</Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

// 4. BENEFITS GRID
const BenefitsGrid = ({ isDesktop }) => {
  const benefits = [
    { num: "01", title: "Zero account & card maintenance fees" },
    { num: "02", title: "Competitive real-time exchange rates" },
    { num: "03", title: "Instant transaction push notifications" },
    { num: "04", title: "Dedicated IBAN for your business needs" },
    { num: "05", title: "Free & instant P2P internal transfers" },
    { num: "06", title: "Integrated expense tracking & ledger reports" },
  ];

  return (
    <View style={{ paddingVertical: 30 }}>
      <View style={{ alignItems: "center", marginBottom: 36 }}>
        <View style={styles.heroBadgeContainer}>
          <Text style={styles.heroBadgeText}>A TRULY GLOBAL RESERVE ACCOUNT</Text>
        </View>
        <Text style={[styles.heading2Dark, { textAlign: "center", marginTop: 12 }]}>
          Get total control of your money
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {benefits.map((item) => (
          <View
            key={item.num}
            style={[
              styles.darkBenefitCard,
              { width: isDesktop ? "31%" : "100%" },
            ]}
          >
            <Text style={styles.darkBenefitNumber}>{item.num} —</Text>
            <Text style={styles.darkBenefitTitle}>{item.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// 5. MOBILE APP SECTION
const MobileAppSection = ({ isDesktop }) => (
  <View
    nativeID="download"
    style={[
      styles.mobileAppContainer,
      !isDesktop && styles.heroColumn,
    ]}
  >
    <View style={styles.flex1}>
      <Text style={[styles.heading2Dark, { color: "#FFFFFF" }]}>
        Get Westcott Reserve {"\n"}at your fingertips.
      </Text>
      <Text style={[styles.heroParagraphText, { color: "#DBEAFE", marginTop: 12 }]}>
        Experience direct mobile payouts, live balance tracking, virtual card locks, and
        instant bank transfers straight from your smartphone.
      </Text>

      <View style={{ marginTop: 28 }}>
        <WebAnchor
          href="/downloads/westcott-reserve.apk"
          download="westcott-reserve.apk"
          style={styles.whiteBtn}
        >
          <Text style={styles.whiteBtnText}>📥 Download Direct APK</Text>
        </WebAnchor>
        <Text style={styles.apkMetaTextLight}>v2.4.0 • Android 8.0+ Required • Free Download</Text>
      </View>
    </View>

    <View style={[styles.flex1, styles.centerItems, { marginTop: isDesktop ? 0 : 30 }]}>
      <View style={styles.mobilePhoneFrame}>
        <View style={styles.phoneNotch} />
        <Text style={styles.phoneAppTitle}>Westcott Mobile</Text>
        <View style={styles.phoneBalanceCard}>
          <Text style={{ color: "#64748B", fontSize: 11 }}>Active Total Balance</Text>
          <Text style={{ color: "#0F172A", fontSize: 22, fontWeight: "700" }}>$124,500.00</Text>
        </View>
        <View style={styles.txRow}>
          <Text style={{ color: "#334155", fontSize: 12 }}>Transfer to Account</Text>
          <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "600" }}>-$250.00</Text>
        </View>
        <View style={styles.txRow}>
          <Text style={{ color: "#334155", fontSize: 12 }}>Interest Credit</Text>
          <Text style={{ color: "#059669", fontSize: 12, fontWeight: "600" }}>+$14.20</Text>
        </View>
      </View>
    </View>
  </View>
);

// 6. CTA BANNER
const CTA = ({ isDesktop, onLaunchApp }) => (
  <View style={[styles.ctaBannerLight, !isDesktop && { flexDirection: "column", gap: 20 }]}>
    <View style={{ flex: 1 }}>
      <Text style={styles.ctaTitleLight}>Ready to experience modern banking?</Text>
      <Text style={styles.ctaSubtitleLight}>
        Create your free multi-currency reserve account today in under 3 minutes.
      </Text>
    </View>
    <AuthAction onLaunchApp={onLaunchApp} style={styles.modulePrimaryBtn}>
      <Text style={styles.modulePrimaryBtnText}>Create Account</Text>
    </AuthAction>
  </View>
);

// 7. FOOTER
const Footer = ({ isDesktop }) => (
  <View style={styles.footerContainerDark}>
    <View style={[styles.footerRow, !isDesktop && { flexDirection: "column", gap: 20 }]}>
      <View>
        <Text style={styles.brandTitleDark}>
          WESTCOTT <Text style={{ color: "#00F6FF" }}>RESERVE</Text>
        </Text>
        <Text style={styles.footerBrandSubDark}>
          Next-Generation Mobile & Global Digital Banking
        </Text>
      </View>
      <Text style={styles.footerCopyTextDark}>
        Copyright © {new Date().getFullYear()} Westcott Reserve. All Rights Reserved.
      </Text>
    </View>

    <View style={styles.legalNoticeBoxDark}>
      <Text style={styles.legalNoticeTextDark}>
        Westcott Reserve is a financial technology company, not a bank. Banking services are
        provided by licensed banking partners. Regulatory compliance protected under international
        financial oversight standards.
      </Text>
    </View>
  </View>
);

/* ==========================================================================
   STYLESHEET: SECTION-BY-SECTION COLOR PALETTE
   ========================================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    alignItems: "stretch",
    paddingBottom: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A192F",
    padding: 24,
  },
  unsupportedText: {
    color: "#00F6FF",
    fontSize: 16,
    textAlign: "center",
  },
  boxWidth: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
  },
  paddingX: {
    paddingHorizontal: 24,
  },
  flex1: {
    flex: 1,
  },
  centerItems: {
    alignItems: "center",
    justifyContent: "center",
  },

  /* ---------------- SECTION BACKGROUND WRAPPERS ---------------- */
  sectionHeaderHero: {
    width: "100%",
    backgroundColor: "#0A192F", // Deep Royal Navy
    paddingBottom: 60,
  },
  sectionLightModules: {
    width: "100%",
    backgroundColor: "#F8FAFC", // Light Slate
    paddingVertical: 40,
  },
  sectionDarkGrid: {
    width: "100%",
    backgroundColor: "#0F172A", // Dark Slate
    paddingVertical: 60,
  },
  sectionBlueBanner: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    paddingVertical: 40,
  },
  sectionLightCTA: {
    width: "100%",
    backgroundColor: "#EFF6FF", // Ice Blue
    paddingVertical: 50,
  },
  sectionFooter: {
    width: "100%",
    backgroundColor: "#030712", // Midnight Black
    paddingVertical: 40,
  },

  /* ---------------- NAVBAR ---------------- */
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#00F6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  brandIconText: {
    color: "#0A192F",
    fontWeight: "900",
    fontSize: 18,
  },
  brandTitleDark: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
  brandHighlight: {
    color: "#00F6FF",
    fontWeight: "400",
  },
  navLinksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
  },
  navAnchor: {
    paddingVertical: 6,
  },
  navLinkTextDark: {
    color: "#CBD5E1",
    fontSize: 15,
    fontWeight: "500",
  },
  navBtnPrimary: {
    backgroundColor: "#00F6FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  navBtnPrimaryText: {
    color: "#0A192F",
    fontSize: 14,
    fontWeight: "700",
  },
  hamburgerBtn: {
    padding: 8,
  },
  mobileDropdown: {
    position: "absolute",
    top: 44,
    right: 0,
    backgroundColor: "#0F172A",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    minWidth: 160,
    zIndex: 100,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  mobileNavAnchor: {
    paddingVertical: 4,
  },
  mobileNavText: {
    color: "#FFF",
    fontSize: 15,
  },

  /* ---------------- HERO (DARK) ---------------- */
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 48,
    marginTop: 20,
  },
  heroColumn: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  heroBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 246, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 246, 255, 0.25)",
    gap: 8,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00F6FF",
  },
  heroBadgeText: {
    color: "#00F6FF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heroHeadingText: {
    color: "#FFFFFF",
    fontSize: 46,
    fontWeight: "800",
    lineHeight: 54,
  },
  heroHeadingSubText: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "800",
    marginBottom: 16,
  },
  heroParagraphText: {
    color: "#94A3B8",
    fontSize: 16,
    lineHeight: 26,
    maxWidth: 480,
  },
  heroCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 28,
    flexWrap: "wrap",
  },
  heroPrimaryBtn: {
    backgroundColor: "#00F6FF",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  heroPrimaryBtnText: {
    color: "#0A192F",
    fontSize: 15,
    fontWeight: "700",
  },
  heroSecondaryBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  heroSecondaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  /* ---------------- HERO CARD GRAPHIC ---------------- */
  cardGraphicContainer: {
    width: "100%",
    maxWidth: 380,
    position: "relative",
  },
  cardGraphic: {
    backgroundColor: "#0F172A",
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  cardGraphicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardBrand: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  cardTier: {
    color: "#00F6FF",
    fontSize: 11,
    fontWeight: "700",
  },
  cardBalanceText: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "700",
    marginTop: 4,
  },
  multiCurrencyRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  currencyBadge: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  currencyFlag: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "600",
  },
  cardGraphicFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    paddingTop: 16,
  },
  cardSubText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "600",
  },
  cardHolderText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  floatingWidget: {
    position: "absolute",
    bottom: -20,
    right: -10,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  widgetIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  /* ---------------- MODULES (LIGHT) ---------------- */
  moduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 48,
  },
  lightBadgeContainer: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  lightBadgeText: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heading2Light: {
    color: "#0F172A",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
    marginBottom: 12,
  },
  paragraphLight: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 26,
    maxWidth: 480,
  },
  modulePrimaryBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  modulePrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  featureGraphicCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  graphicCheckRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 20,
  },

  /* ---------------- BENEFITS GRID (DARK) ---------------- */
  heading2Dark: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
  },
  darkBenefitCard: {
    backgroundColor: "#1E293B",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  darkBenefitNumber: {
    color: "#00F6FF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  darkBenefitTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },

  /* ---------------- MOBILE APP (BLUE) ---------------- */
  mobileAppContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    padding: 40,
    borderRadius: 28,
    gap: 48,
  },
  whiteBtn: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  whiteBtnText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "700",
  },
  apkMetaTextLight: {
    color: "#DBEAFE",
    fontSize: 12,
    marginTop: 10,
  },
  mobilePhoneFrame: {
    width: 260,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
  },
  phoneNotch: {
    width: 80,
    height: 12,
    backgroundColor: "#E2E8F0",
    borderRadius: 6,
    marginBottom: 16,
  },
  phoneAppTitle: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
  },
  phoneBalanceCard: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  txRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },

  /* ---------------- CTA (ICE BLUE TINT) ---------------- */
  ctaBannerLight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  ctaTitleLight: {
    color: "#0F172A",
    fontSize: 26,
    fontWeight: "800",
  },
  ctaSubtitleLight: {
    color: "#475569",
    fontSize: 15,
    marginTop: 6,
  },

  /* ---------------- FOOTER (MIDNIGHT) ---------------- */
  footerContainerDark: {
    width: "100%",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerBrandSubDark: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },
  footerCopyTextDark: {
    color: "#64748B",
    fontSize: 14,
  },
  legalNoticeBoxDark: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  legalNoticeTextDark: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});