import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { WebAnchor } from "../components/WebAnchor";

const NAV_LINKS = [
  { id: "experience", title: "Experience" },
  { id: "features", title: "Features" },
  { id: "download", title: "Download APK" },
  { id: "how-it-works", title: "How it works" },
  { id: "faq", title: "FAQ" },
];

const FEATURES = [
  {
    icon: "01",
    title: "A familiar account dashboard",
    description:
      "Explore a banking-inspired overview of balances, account details, and recent activity using simulated demo data.",
  },
  {
    icon: "02",
    title: "Cards and spending controls",
    description:
      "Preview card-management screens and common spending controls in a safe, non-financial prototype.",
  },
  {
    icon: "03",
    title: "Transfers, reimagined",
    description:
      "Walk through transfer flows and sample receipts. No funds move and no payment rails are connected.",
  },
  {
    icon: "04",
    title: "Designed for everyday clarity",
    description:
      "Browse account tools, history, profile settings, and helpful product information from one simple interface.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Explore the experience",
    description:
      "Browse this overview, then open the app to see its interactive screens.",
  },
  {
    number: "02",
    title: "Use demo information",
    description:
      "Create an account with test details in the configured Supabase project. Never use your real banking credentials.",
  },
  {
    number: "03",
    title: "Try the prototype",
    description:
      "Explore sample account features. Balances, cards, and transaction activity are simulations only.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Is Westcott Reserve a real bank?",
    answer:
      "No. Westcott Reserve is an educational software prototype. It is not a bank or a financial institution, and it does not offer real accounts or financial services.",
  },
  {
    question: "Can I send money or use a real card?",
    answer:
      "No. Transfers, balances, card screens, and receipts are for demonstration. The app is not connected to real payment networks and must not be used to move or store money.",
  },
  {
    question: "What information should I use to sign in?",
    answer:
      "Use test information and a unique password for this prototype. Do not enter real financial details, identity documents, or passwords used for other services.",
  },
  {
    question: "How is sign-in configured?",
    answer:
      "Authentication and profile data use the Supabase project configured by the app operator. The operator is responsible for configuring that project and its access policies.",
  },
];

export default function WestcottWebLanding({ onLaunchApp }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const isMobile = width < 640;

  if (Platform.OS !== "web") {
    return (
      <View style={styles.unsupported}>
        <Text style={styles.unsupportedText}>
          The Westcott Reserve overview is available in a web browser.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroSection} nativeID="home">
        <View style={styles.shell}>
          <Header
            isDesktop={isDesktop}
            isMobile={isMobile}
            onLaunchApp={onLaunchApp}
          />
          <Hero isDesktop={isDesktop} isMobile={isMobile} onLaunchApp={onLaunchApp} />
        </View>
      </View>

      <View style={styles.noticeBand}>
        <View style={[styles.shell, styles.noticeInner, isMobile && styles.stack]}>
          <Notice title="An educational prototype" text="Not a bank or financial service" />
          <Notice title="Simulated data" text="No real money or payments" />
          <Notice title="Use test details" text="Never enter sensitive credentials" />
        </View>
      </View>

      <View style={styles.section} nativeID="experience">
        <View style={styles.shell}>
          <SectionHeading
            eyebrow="A more considered digital experience"
            title="Everyday banking ideas, thoughtfully explored."
            description="Westcott Reserve brings familiar account tools together in a polished, interactive prototype. Explore the experience without connecting real money."
            align="left"
          />
          <ExperiencePanel isMobile={isMobile} />
        </View>
      </View>

      <View style={styles.featuresSection} nativeID="features">
        <View style={styles.shell}>
          <SectionHeading
            eyebrow="Inside the experience"
            title="The tools you’d expect. A safe place to explore."
            description="A product concept for learning and demonstration—not a live banking service."
          />
          <View style={[styles.cardGrid, isMobile && styles.stack]}>
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.icon} feature={feature} />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section} nativeID="how-it-works">
        <View style={styles.shell}>
          <SectionHeading
            eyebrow="Getting started"
            title="Explore the prototype in three steps."
            description="The experience is designed to be straightforward—from the first screen to the last."
          />
          <View style={[styles.stepsRow, isMobile && styles.stack]}>
            {STEPS.map((step) => (
              <View key={step.number} style={styles.stepCard}>
                <Text style={styles.stepNumber}>{step.number}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.bodyText}>{step.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.securitySection}>
        <View style={[styles.shell, styles.securityLayout, !isDesktop && styles.stack]}>
          <View style={styles.securityCopy}>
            <Text style={styles.eyebrowLight}>Built with care</Text>
            <Text style={styles.sectionTitleLight}>
              Your real-world financial details don’t belong in a demo.
            </Text>
            <Text style={styles.bodyTextLight}>
              Sign-in is powered by the Supabase project configured for this
              prototype. Use test information only, and review the privacy
              information below before creating an account.
            </Text>
            <AuthAction onLaunchApp={onLaunchApp} style={styles.outlineAction}>
              <Text style={styles.outlineActionText}>Open the app</Text>
            </AuthAction>
          </View>
          <View style={styles.safetyCard}>
            <SafetyRow
              title="Use a unique test password"
              description="Do not reuse passwords from email, banking, or other accounts."
            />
            <SafetyRow
              title="Keep personal data out"
              description="Use sample details; don’t submit real financial or identity information."
            />
            <SafetyRow
              title="Remember what this is"
              description="Displayed balances and activity are illustrative and have no cash value."
              last
            />
          </View>
        </View>
      </View>

      <DownloadSection isMobile={isMobile} />

      <View style={styles.section} nativeID="faq">
        <View style={styles.shell}>
          <SectionHeading
            eyebrow="Good to know"
            title="Frequently asked questions."
            description="Important details about this demonstration project."
          />
          <View style={styles.faqGrid}>
            {FAQ_ITEMS.map((item) => (
              <View key={item.question} style={styles.faqItem}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Text style={styles.bodyText}>{item.answer}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.legalSection}>
        <View style={styles.shell}>
          <SectionHeading
            eyebrow="Transparency"
            title="Clear terms. Clear privacy information."
            description="These summaries explain how this prototype is intended to be used. They are not a substitute for legal advice."
            align="left"
          />
          <View style={[styles.legalGrid, isMobile && styles.stack]}>
            <View style={styles.legalCard} nativeID="terms">
              <Text style={styles.legalTitle}>Terms of use</Text>
              <Text style={styles.bodyText}>
                Westcott Reserve is provided for educational and demonstration
                purposes only. It is not a bank and does not provide deposit,
                payment, credit, investment, or other financial services. Any
                account, card, balance, transfer, or receipt shown is simulated
                and has no monetary value. Do not rely on the prototype for
                financial decisions or enter real banking or identity
                information. The software is provided as-is; features may change
                or be unavailable.
              </Text>
            </View>
            <View style={styles.legalCard} nativeID="privacy">
              <Text style={styles.legalTitle}>Privacy information</Text>
              <Text style={styles.bodyText}>
                When you use sign-in, authentication and profile information are
                handled by the Supabase project configured by the app operator.
                The mobile app may store session and profile data on your
                device. The operator controls the Supabase configuration,
                access policies, and retention. Do not submit sensitive or
                real-world financial information. For questions about data in a
                configured instance, contact its operator.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.shell}>
          <Footer isMobile={isMobile} onLaunchApp={onLaunchApp} />
        </View>
      </View>
    </ScrollView>
  );
}

function Header({ isDesktop, isMobile, onLaunchApp }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.header}>
      <WebAnchor href="#home" style={styles.brand}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>W</Text>
        </View>
        <View>
          <Text style={styles.brandName}>WESTCOTT RESERVE</Text>
          <Text style={styles.brandCaption}>A digital banking prototype</Text>
        </View>
      </WebAnchor>

      {isDesktop ? (
        <View style={styles.navLinks}>
          {NAV_LINKS.map((link) => (
            <WebAnchor key={link.id} href={`#${link.id}`} style={styles.navLink}>
              <Text style={styles.navLinkText}>{link.title}</Text>
            </WebAnchor>
          ))}
          <AuthAction onLaunchApp={onLaunchApp} style={styles.headerAction}>
            <Text style={styles.headerActionText}>Sign in</Text>
          </AuthAction>
        </View>
      ) : (
        <View style={styles.menuContainer}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            accessibilityState={{ expanded: menuOpen }}
            onPress={() => setMenuOpen((open) => !open)}
            style={styles.menuButton}
          >
            <Text style={styles.menuButtonText}>{menuOpen ? "Close" : "Menu"}</Text>
          </TouchableOpacity>
          {menuOpen && (
            <View style={[styles.mobileMenu, isMobile && styles.mobileMenuNarrow]}>
              {NAV_LINKS.map((link) => (
                <WebAnchor key={link.id} href={`#${link.id}`} style={styles.mobileMenuLink}>
                  <Text style={styles.mobileMenuText}>{link.title}</Text>
                </WebAnchor>
              ))}
              <AuthAction
                onLaunchApp={onLaunchApp}
                style={[styles.headerAction, styles.mobileMenuAction]}
              >
                <Text style={styles.headerActionText}>Sign in / get started</Text>
              </AuthAction>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function Hero({ isDesktop, isMobile, onLaunchApp }) {
  return (
    <View style={[styles.hero, !isDesktop && styles.heroStack]}>
      <View style={[styles.heroCopy, !isDesktop && styles.fullWidth]}>
        <View style={styles.heroEyebrow}>
          <View style={styles.heroDot} />
          <Text style={styles.heroEyebrowText}>A DIGITAL BANKING PROTOTYPE</Text>
        </View>
        <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
          Banking,{"\n"}
          <Text style={styles.heroTitleAccent}>reimagined for clarity.</Text>
        </Text>
        <Text style={styles.heroDescription}>
          Explore a thoughtful, modern banking experience—built as an
          educational prototype, with simulated accounts and activity.
        </Text>
        <View style={[styles.heroActions, isMobile && styles.heroActionsStack]}>
          <AuthAction onLaunchApp={onLaunchApp} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Explore the app</Text>
            <Text style={styles.actionArrow}>→</Text>
          </AuthAction>
          <WebAnchor href="#features" style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Discover the experience</Text>
          </WebAnchor>
        </View>
        <Text style={styles.heroFinePrint}>
          No real accounts, deposits, or payments. Demo use only.
        </Text>
      </View>
      <View style={[styles.heroVisual, !isDesktop && styles.heroVisualTablet]}>
        <DemoDashboard />
      </View>
    </View>
  );
}

function DemoDashboard() {
  return (
    <View style={styles.dashboard}>
      <View style={styles.dashboardTop}>
        <View>
          <Text style={styles.dashboardLabel}>WESTCOTT RESERVE</Text>
          <Text style={styles.dashboardTitle}>Your overview</Text>
        </View>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>SAMPLE</Text>
        </View>
      </View>
      <View style={styles.balancePanel}>
        <Text style={styles.balanceLabel}>Illustrative balance</Text>
        <Text style={styles.balanceAmount}>$ 12,480.00</Text>
        <Text style={styles.balanceNote}>Simulated demo value · not real funds</Text>
      </View>
      <View style={styles.accountRow}>
        <View style={styles.accountIcon}>
          <Text style={styles.accountIconText}>A</Text>
        </View>
        <View style={styles.accountCopy}>
          <Text style={styles.accountTitle}>Everyday account</Text>
          <Text style={styles.accountSubtitle}>Sample activity</Text>
        </View>
        <Text style={styles.accountAmount}>$ 1,250</Text>
      </View>
      <View style={styles.accountDivider} />
      <View style={styles.accountRow}>
        <View style={[styles.accountIcon, styles.cardIcon]}>
          <Text style={styles.accountIconText}>V</Text>
        </View>
        <View style={styles.accountCopy}>
          <Text style={styles.accountTitle}>Virtual card</Text>
          <Text style={styles.accountSubtitle}>Preview interface</Text>
        </View>
        <Text style={styles.cardLastFour}>•••• 2048</Text>
      </View>
      <View style={styles.dashboardFooter}>
        <Text style={styles.dashboardFooterText}>
          Illustrative interface · no live financial data
        </Text>
      </View>
    </View>
  );
}

function Notice({ title, text }) {
  return (
    <View style={styles.notice}>
      <View style={styles.noticeCheck}>
        <Text style={styles.noticeCheckText}>✓</Text>
      </View>
      <View style={styles.noticeCopy}>
        <Text style={styles.noticeTitle}>{title}</Text>
        <Text style={styles.noticeText}>{text}</Text>
      </View>
    </View>
  );
}

function SectionHeading({ eyebrow, title, description, align = "center" }) {
  const leftAligned = align === "left";
  return (
    <View style={[styles.sectionHeading, leftAligned && styles.sectionHeadingLeft]}>
      <Text style={[styles.eyebrow, leftAligned && styles.textLeft]}>{eyebrow}</Text>
      <Text style={[styles.sectionTitle, leftAligned && styles.textLeft]}>{title}</Text>
      <Text style={[styles.sectionDescription, leftAligned && styles.textLeft]}>
        {description}
      </Text>
    </View>
  );
}

function ExperiencePanel({ isMobile }) {
  return (
    <View style={[styles.experiencePanel, isMobile && styles.experiencePanelMobile]}>
      <View style={styles.experienceText}>
        <Text style={styles.panelEyebrow}>A clearer view of your finances</Text>
        <Text style={styles.panelTitle}>Designed around the details that matter.</Text>
        <Text style={styles.bodyText}>
          A calm, considered interface helps make complex financial concepts
          easier to explore. Every figure shown here is sample data created for
          demonstration.
        </Text>
        <View style={styles.panelPills}>
          <Text style={styles.panelPill}>Sample balances</Text>
          <Text style={styles.panelPill}>Demo activity</Text>
          <Text style={styles.panelPill}>No live accounts</Text>
        </View>
      </View>
      <View style={styles.activityPanel}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>Recent activity</Text>
          <Text style={styles.activityCaption}>EXAMPLE ONLY</Text>
        </View>
        <ActivityRow mark="↗" title="Sample transfer" detail="Illustrative entry" amount="− $42.00" />
        <ActivityRow mark="＋" title="Sample deposit" detail="Illustrative entry" amount="+ $180.00" positive />
        <ActivityRow mark="◇" title="Card purchase" detail="Illustrative entry" amount="− $18.50" />
      </View>
    </View>
  );
}

function ActivityRow({ mark, title, detail, amount, positive }) {
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityMark}>
        <Text style={styles.activityMarkText}>{mark}</Text>
      </View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityRowTitle}>{title}</Text>
        <Text style={styles.activityDetail}>{detail}</Text>
      </View>
      <Text style={[styles.activityAmount, positive && styles.positiveAmount]}>
        {amount}
      </Text>
    </View>
  );
}

function FeatureCard({ feature }) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureTop}>
        <Text style={styles.featureNumber}>{feature.icon}</Text>
        <Text style={styles.featureArrow}>↗</Text>
      </View>
      <Text style={styles.featureTitle}>{feature.title}</Text>
      <Text style={styles.bodyText}>{feature.description}</Text>
    </View>
  );
}

function SafetyRow({ title, description, last = false }) {
  return (
    <View style={[styles.safetyRow, last && styles.safetyRowLast]}>
      <View style={styles.safetyCheck}>
        <Text style={styles.safetyCheckText}>✓</Text>
      </View>
      <View style={styles.safetyCopy}>
        <Text style={styles.safetyTitle}>{title}</Text>
        <Text style={styles.safetyDescription}>{description}</Text>
      </View>
    </View>
  );
}

function DownloadSection({ isMobile }) {
  return (
    <View style={styles.downloadSection} nativeID="download">
      <View style={[styles.shell, styles.downloadCard, isMobile && styles.downloadCardMobile]}>
        <View style={styles.downloadCopy}>
          <Text style={styles.eyebrow}>For Android</Text>
          <Text style={styles.downloadTitle}>Take the prototype with you.</Text>
          <Text style={styles.bodyText}>
            Download the standalone Android app. It includes the app bundle and
            does not require a computer or Metro server to launch.
          </Text>
          <View style={styles.downloadMetaRow}>
            <Text style={styles.downloadMeta}>Android APK</Text>
            <Text style={styles.downloadMetaDot}>·</Text>
            <Text style={styles.downloadMeta}>ARM 32-bit and 64-bit</Text>
            <Text style={styles.downloadMetaDot}>·</Text>
            <Text style={styles.downloadMeta}>Prototype only</Text>
          </View>
        </View>
        <WebAnchor
          href="/downloads/westcott-reserve.apk"
          download="westcott-reserve.apk"
          target="_self"
          style={[styles.downloadButton, isMobile && styles.downloadButtonMobile]}
        >
          <Text style={styles.downloadButtonText}>Download Android APK</Text>
          <Text style={styles.downloadButtonArrow}>↓</Text>
        </WebAnchor>
      </View>
    </View>
  );
}

function AuthAction({ onLaunchApp, style, children }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onLaunchApp}
      style={style}
      activeOpacity={0.82}
    >
      {children}
    </TouchableOpacity>
  );
}

function Footer({ isMobile, onLaunchApp }) {
  return (
    <View>
      <View style={[styles.footerTop, isMobile && styles.stack]}>
        <View style={styles.footerBrandBlock}>
          <WebAnchor href="#home" style={styles.brand}>
            <View style={styles.footerBrandMark}>
              <Text style={styles.brandMarkText}>W</Text>
            </View>
            <Text style={styles.footerBrandName}>WESTCOTT RESERVE</Text>
          </WebAnchor>
          <Text style={styles.footerTagline}>
            A thoughtful digital banking concept.
          </Text>
          <Text style={styles.footerDisclaimer}>
            Independent educational prototype. Not a bank or financial service.
          </Text>
        </View>
        <View style={[styles.footerLinks, isMobile && styles.footerLinksMobile]}>
          <View style={styles.footerLinkColumn}>
            <Text style={styles.footerColumnTitle}>Explore</Text>
            {NAV_LINKS.slice(0, 3).map((link) => (
              <FooterLink key={link.id} href={`#${link.id}`} title={link.title} />
            ))}
            <AuthAction onLaunchApp={onLaunchApp} style={styles.footerLink}>
              <Text style={styles.footerLinkText}>Open the app</Text>
            </AuthAction>
          </View>
          <View style={styles.footerLinkColumn}>
            <Text style={styles.footerColumnTitle}>Information</Text>
            <FooterLink href="#terms" title="Terms of use" />
            <FooterLink href="#privacy" title="Privacy information" />
            <FooterLink href="#faq" title="Frequently asked questions" />
          </View>
        </View>
      </View>
      <View style={styles.footerBottom}>
        <Text style={styles.footerCopyright}>
          © {new Date().getFullYear()} Westcott Reserve. For demonstration only.
        </Text>
        <WebAnchor href="#home" style={styles.backToTop}>
          <Text style={styles.backToTopText}>Back to top ↑</Text>
        </WebAnchor>
      </View>
    </View>
  );
}

function FooterLink({ href, title }) {
  return (
    <WebAnchor href={href} style={styles.footerLink}>
      <Text style={styles.footerLinkText}>{title}</Text>
    </WebAnchor>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  pageContent: {
    paddingBottom: 0,
  },
  shell: {
    width: "100%",
    maxWidth: 1160,
    alignSelf: "center",
    paddingHorizontal: 36,
  },
  stack: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  fullWidth: {
    width: "100%",
  },
  textLeft: {
    textAlign: "left",
  },
  unsupported: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F9FC",
    padding: 28,
  },
  unsupportedText: {
    color: "#344054",
    fontSize: 16,
    textAlign: "center",
  },
  heroSection: {
    backgroundColor: "#0D1B2A",
    paddingBottom: 86,
  },
  header: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#D8B978",
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: {
    color: "#132237",
    fontSize: 21,
    fontWeight: "800",
  },
  brandName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.15,
  },
  brandCaption: {
    color: "#AEBAC8",
    fontSize: 11,
    marginTop: 3,
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 26,
  },
  navLink: {
    paddingVertical: 12,
  },
  navLinkText: {
    color: "#D4DBE3",
    fontSize: 13,
    fontWeight: "600",
  },
  headerAction: {
    backgroundColor: "#D8B978",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActionText: {
    color: "#142238",
    fontSize: 13,
    fontWeight: "800",
  },
  menuContainer: {
    position: "relative",
    zIndex: 5,
  },
  menuButton: {
    minWidth: 68,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    paddingHorizontal: 12,
  },
  menuButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  mobileMenu: {
    position: "absolute",
    top: 54,
    right: 0,
    width: 240,
    padding: 16,
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#15263B",
    borderWidth: 1,
    borderColor: "#34465B",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  mobileMenuNarrow: {
    width: 220,
  },
  mobileMenuLink: {
    paddingVertical: 10,
  },
  mobileMenuText: {
    color: "#E8EDF2",
    fontSize: 14,
    fontWeight: "600",
  },
  mobileMenuAction: {
    marginTop: 8,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 56,
    paddingTop: 76,
  },
  heroStack: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 40,
    paddingTop: 54,
  },
  heroCopy: {
    flex: 1,
    maxWidth: 560,
  },
  heroEyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(216,185,120,0.32)",
    backgroundColor: "rgba(216,185,120,0.08)",
    borderRadius: 24,
    marginBottom: 24,
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#D8B978",
  },
  heroEyebrowText: {
    color: "#E5CC99",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 52,
    lineHeight: 60,
    fontWeight: "700",
    letterSpacing: -1.6,
  },
  heroTitleMobile: {
    fontSize: 40,
    lineHeight: 47,
    letterSpacing: -1,
  },
  heroTitleAccent: {
    color: "#D8B978",
  },
  heroDescription: {
    maxWidth: 500,
    color: "#C2CBD5",
    fontSize: 16,
    lineHeight: 27,
    marginTop: 22,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 30,
  },
  heroActionsStack: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  primaryAction: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#D8B978",
  },
  primaryActionText: {
    color: "#142238",
    fontSize: 14,
    fontWeight: "800",
  },
  actionArrow: {
    color: "#142238",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryAction: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  heroFinePrint: {
    color: "#AAB5C2",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
  },
  heroVisual: {
    width: "46%",
    maxWidth: 490,
    minWidth: 360,
  },
  heroVisualTablet: {
    width: "100%",
    minWidth: 0,
    maxWidth: 520,
    alignSelf: "center",
  },
  dashboard: {
    width: "100%",
    padding: 24,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E8ED",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  dashboardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  dashboardLabel: {
    color: "#738093",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  dashboardTitle: {
    color: "#17283D",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 5,
  },
  demoBadge: {
    backgroundColor: "#F5F0E4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  demoBadgeText: {
    color: "#806A3F",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  balancePanel: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#F5F7F9",
    borderWidth: 1,
    borderColor: "#EDF0F3",
  },
  balanceLabel: {
    color: "#738093",
    fontSize: 12,
  },
  balanceAmount: {
    color: "#17283D",
    fontSize: 29,
    fontWeight: "700",
    marginTop: 8,
  },
  balanceNote: {
    color: "#738093",
    fontSize: 10,
    marginTop: 6,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 17,
  },
  accountIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9EFF7",
  },
  cardIcon: {
    backgroundColor: "#F5F0E4",
  },
  accountIconText: {
    color: "#294563",
    fontWeight: "800",
  },
  accountCopy: {
    flex: 1,
  },
  accountTitle: {
    color: "#24364B",
    fontSize: 12,
    fontWeight: "700",
  },
  accountSubtitle: {
    color: "#8290A0",
    fontSize: 10,
    marginTop: 4,
  },
  accountAmount: {
    color: "#24364B",
    fontSize: 12,
    fontWeight: "700",
  },
  cardLastFour: {
    color: "#657487",
    fontSize: 11,
    fontWeight: "600",
  },
  accountDivider: {
    height: 1,
    backgroundColor: "#EDF0F3",
  },
  dashboardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#EDF0F3",
    paddingTop: 14,
    marginTop: 2,
  },
  dashboardFooterText: {
    color: "#8995A3",
    fontSize: 10,
    textAlign: "center",
  },
  noticeBand: {
    backgroundColor: "#F6F7F8",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EBEF",
  },
  noticeInner: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 22,
    paddingVertical: 20,
  },
  notice: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  noticeCheck: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EFEA",
  },
  noticeCheckText: {
    color: "#456B52",
    fontSize: 14,
    fontWeight: "800",
  },
  noticeCopy: {
    flex: 1,
  },
  noticeTitle: {
    color: "#26364A",
    fontSize: 12,
    fontWeight: "800",
  },
  noticeText: {
    color: "#6A7787",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  section: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 86,
  },
  sectionHeading: {
    alignItems: "center",
    maxWidth: 720,
    alignSelf: "center",
    marginBottom: 42,
  },
  sectionHeadingLeft: {
    alignItems: "flex-start",
    alignSelf: "flex-start",
    maxWidth: 720,
  },
  eyebrow: {
    color: "#927849",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    textAlign: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#15263B",
    fontSize: 35,
    lineHeight: 43,
    fontWeight: "700",
    letterSpacing: -0.8,
    textAlign: "center",
  },
  sectionDescription: {
    color: "#637183",
    fontSize: 15,
    lineHeight: 25,
    maxWidth: 650,
    textAlign: "center",
    marginTop: 12,
  },
  experiencePanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 54,
    padding: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E9ED",
    backgroundColor: "#FBFCFD",
  },
  experiencePanelMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    padding: 22,
    gap: 30,
  },
  experienceText: {
    flex: 1,
  },
  panelEyebrow: {
    color: "#927849",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  panelTitle: {
    color: "#17283D",
    fontSize: 27,
    lineHeight: 35,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 12,
  },
  bodyText: {
    color: "#647284",
    fontSize: 13,
    lineHeight: 21,
  },
  panelPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 20,
  },
  panelPill: {
    overflow: "hidden",
    backgroundColor: "#EFF2F4",
    color: "#49586A",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
  },
  activityPanel: {
    flex: 1,
    minWidth: 0,
    padding: 18,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8EBEF",
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  activityTitle: {
    color: "#25374B",
    fontSize: 14,
    fontWeight: "800",
  },
  activityCaption: {
    color: "#9A8352",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  activityRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F4",
  },
  activityMark: {
    width: 32,
    height: 32,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F4F7",
  },
  activityMarkText: {
    color: "#4F6278",
    fontSize: 14,
    fontWeight: "700",
  },
  activityCopy: {
    flex: 1,
  },
  activityRowTitle: {
    color: "#2C3D51",
    fontSize: 11,
    fontWeight: "700",
  },
  activityDetail: {
    color: "#8995A3",
    fontSize: 9,
    marginTop: 3,
  },
  activityAmount: {
    color: "#586678",
    fontSize: 10,
    fontWeight: "700",
  },
  positiveAmount: {
    color: "#47765A",
  },
  featuresSection: {
    backgroundColor: "#F6F7F8",
    paddingVertical: 86,
  },
  downloadSection: {
    backgroundColor: "#F6F7F8",
    paddingVertical: 28,
  },
  downloadCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 30,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E9ED",
    backgroundColor: "#FFFFFF",
  },
  downloadCardMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    padding: 23,
  },
  downloadCopy: {
    flex: 1,
  },
  downloadTitle: {
    color: "#15263B",
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "700",
    marginBottom: 8,
  },
  downloadMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  downloadMeta: {
    color: "#536276",
    fontSize: 11,
    fontWeight: "700",
  },
  downloadMetaDot: {
    color: "#AAB2BC",
    fontSize: 13,
  },
  downloadButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#D8B978",
  },
  downloadButtonMobile: {
    alignSelf: "stretch",
  },
  downloadButtonText: {
    color: "#142238",
    fontSize: 13,
    fontWeight: "800",
  },
  downloadButtonArrow: {
    color: "#142238",
    fontSize: 17,
    fontWeight: "800",
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  featureCard: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 250,
    minHeight: 206,
    padding: 24,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EAED",
  },
  featureTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  featureNumber: {
    color: "#A88D56",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  featureArrow: {
    color: "#8491A0",
    fontSize: 18,
  },
  featureTitle: {
    color: "#1C2D42",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 9,
  },
  stepsRow: {
    flexDirection: "row",
    gap: 18,
  },
  stepCard: {
    flex: 1,
    padding: 24,
    borderTopWidth: 2,
    borderTopColor: "#D8B978",
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
  },
  stepNumber: {
    color: "#967B48",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 21,
  },
  stepTitle: {
    color: "#1D2E43",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 9,
  },
  securitySection: {
    backgroundColor: "#14243A",
    paddingVertical: 78,
  },
  securityLayout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 60,
  },
  securityCopy: {
    flex: 1,
  },
  eyebrowLight: {
    color: "#D8B978",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 14,
  },
  sectionTitleLight: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  bodyTextLight: {
    color: "#C3CCD7",
    fontSize: 14,
    lineHeight: 23,
    marginTop: 15,
    marginBottom: 22,
  },
  outlineAction: {
    minHeight: 46,
    alignSelf: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#748197",
  },
  outlineActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  safetyCard: {
    flex: 1,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: "#1A2C43",
    borderWidth: 1,
    borderColor: "#34465B",
  },
  safetyRow: {
    flexDirection: "row",
    gap: 13,
    paddingVertical: 19,
    borderBottomWidth: 1,
    borderBottomColor: "#33455A",
  },
  safetyRowLast: {
    borderBottomWidth: 0,
  },
  safetyCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(216,185,120,0.16)",
  },
  safetyCheckText: {
    color: "#E1C98F",
    fontSize: 12,
    fontWeight: "800",
  },
  safetyCopy: {
    flex: 1,
  },
  safetyTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  safetyDescription: {
    color: "#B8C2CE",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  faqGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  faqItem: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 250,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E7EAED",
    borderRadius: 12,
  },
  faqQuestion: {
    color: "#1D2E43",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
    marginBottom: 9,
  },
  legalSection: {
    backgroundColor: "#F6F7F8",
    paddingVertical: 76,
  },
  legalGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 18,
  },
  legalCard: {
    flex: 1,
    padding: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E9EC",
  },
  legalTitle: {
    color: "#1D2E43",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
  },
  footer: {
    backgroundColor: "#0D1B2A",
    paddingTop: 54,
    paddingBottom: 24,
  },
  footerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 40,
    paddingBottom: 40,
  },
  footerBrandBlock: {
    flex: 1,
    maxWidth: 390,
  },
  footerBrandMark: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#D8B978",
    alignItems: "center",
    justifyContent: "center",
  },
  footerBrandName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  footerTagline: {
    color: "#D5DCE4",
    fontSize: 13,
    marginTop: 16,
  },
  footerDisclaimer: {
    color: "#9EABBA",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },
  footerLinks: {
    flexDirection: "row",
    gap: 64,
  },
  footerLinksMobile: {
    justifyContent: "space-between",
    gap: 30,
  },
  footerLinkColumn: {
    minWidth: 135,
    gap: 12,
  },
  footerColumnTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
  },
  footerLink: {
    alignSelf: "flex-start",
    paddingVertical: 3,
  },
  footerLinkText: {
    color: "#B8C3D0",
    fontSize: 12,
  },
  footerBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A394B",
    paddingTop: 19,
  },
  footerCopyright: {
    color: "#9EABBA",
    fontSize: 11,
  },
  backToTop: {
    paddingVertical: 6,
  },
  backToTopText: {
    color: "#D8B978",
    fontSize: 11,
    fontWeight: "700",
  },
});
