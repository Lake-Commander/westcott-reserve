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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { WebAnchor } from "../components/WebAnchor";
import BrandLockup from "../components/BrandLockup";

const NAV_LINKS = [
  { id: "experience", title: "Accounts" },
  { id: "features", title: "Explore" },
  { id: "privacy-policy", title: "Security", href: "/privacy-policy" },
  { id: "faqs", title: "Support", href: "/faqs" },
  { id: "download", title: "Get the app", href: "/download-app", cta: true },
];

const FEATURES = [
  {
    icon: "01",
    title: "A familiar account dashboard",
    description:
      "See account information and activity in a clean, easy-to-navigate overview.",
  },
  {
    icon: "02",
    title: "Cards and spending controls",
    description:
      "Review card options and controls with helpful account-level details.",
  },
  {
    icon: "03",
    title: "Transfers, reimagined",
    description:
      "Follow a clear transfer journey and keep a record of account activity.",
  },
  {
    icon: "04",
    title: "Designed for everyday clarity",
    description:
      "Keep everyday account tools, preferences, and support close at hand.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Get started",
    description:
      "Create an account with your email and a secure password.",
  },
  {
    number: "02",
    title: "Set your preferences",
    description:
      "Choose the settings and notifications that work for you.",
  },
  {
    number: "03",
    title: "Stay in control",
    description:
      "Review your profile, devices, and recent account activity.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Is Westcott Reserve a real bank?",
    answer:
      "No. Westcott Reserve is a digital banking prototype, not a licensed bank or financial institution. It does not provide deposit accounts or regulated payment services.",
  },
  {
    question: "Are balances, transfers, and cards real?",
    answer:
      "No. Balances, transfers, cards, receipts, and market information are illustrative features. They are not connected to payment networks, do not represent real funds, and cannot be used to make payments.",
  },
  {
    question: "What information should I use to create an account?",
    answer:
      "Use a unique password and only the profile details needed to try the app. Do not submit payment credentials, identity documents, or passwords used for other services.",
  },
  {
    question: "What information does the service process?",
    answer:
      "The configured service may process sign-in and profile details, app preferences, support messages, basic device-session details, and push-notification tokens when enabled. See the privacy policy for details.",
  },
  {
    question: "Can I turn notifications off?",
    answer:
      "In-app and push notifications have separate settings. Push notifications require a supported device, notification permission, and completed project setup; you can also revoke permission in your device settings.",
  },
  {
    question: "How can I contact customer care?",
    answer:
      "Use the customer-care form in the app or email support@westcottreserve.com. Do not include passwords, payment information, or identity documents in a support message.",
  },
  {
    question: "Where can I get the Android app?",
    answer:
      "Visit the download page for the Android installer. This prototype is distributed outside Google Play; your device may ask you to allow installation from your browser. Only install it if you trust the source.",
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
      stickyHeaderIndices={[0]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.siteHeaderWrap} nativeID="home">
        <View style={styles.shell}>
          <Header
            isDesktop={isDesktop}
            isMobile={isMobile}
            onLaunchApp={onLaunchApp}
          />
        </View>
      </View>

      <View style={styles.heroSection}>
        <LinearGradient
          colors={["#0B1725", "#11253A", "#142B3A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.heroGlow} />
        <View style={styles.shell}>
          <Hero isDesktop={isDesktop} isMobile={isMobile} onLaunchApp={onLaunchApp} />
          <View style={[styles.heroDisclosure, isMobile && styles.heroDisclosureMobile]}>
            <View style={styles.heroDisclosureMark}>
              <Ionicons name="information-outline" size={16} color="#E5CC99" />
            </View>
            <Text style={styles.heroDisclosureText}>
              A digital finance experience — not a bank or a payment service.
            </Text>
            <WebAnchor href="/terms" target="_self" style={styles.heroDisclosureLink}>
              <Text style={styles.heroDisclosureLinkText}>How it works</Text>
              <Ionicons name="arrow-forward" size={13} color="#E5CC99" />
            </WebAnchor>
          </View>
        </View>
      </View>

      <View style={styles.section} nativeID="experience">
        <View style={styles.shell}>
          <SectionHeading
            eyebrow="Built around your day"
            title="A more considered way to manage your money."
            description="Bring your account overview, cards, transfers, and activity together in one clear digital experience."
            align="left"
          />
          <ExperiencePanel isMobile={isMobile} />
        </View>
      </View>

      <View style={styles.featuresSection} nativeID="features">
        <View style={styles.shell}>
          <SectionHeading
            eyebrow="One connected experience"
            title="Everyday money, made easier to navigate."
            description="Find the details you need, understand what is happening, and manage your preferences in a few simple steps."
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
            eyebrow="Made to feel straightforward"
            title="A simpler way to stay on top of things."
            description="Thoughtful details make it easier to get started and find your way around."
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
              Your information deserves thoughtful care.
            </Text>
            <Text style={styles.bodyTextLight}>
              Account access is protected with secure sign-in options, device
              history, and notification controls. Read our privacy policy to
              understand how information is handled by the service operator.
            </Text>
            <AuthAction onLaunchApp={onLaunchApp} style={styles.outlineAction}>
              <Text style={styles.outlineActionText}>Open the app</Text>
            </AuthAction>
          </View>
          <View style={styles.safetyCard}>
            <SafetyRow
              title="Account security"
              description="Authenticator-based sign-in protection and device history help you keep track of access."
            />
            <SafetyRow
              title="Clear privacy information"
              description="Understand how account and contact information is handled."
            />
            <SafetyRow
              title="Your preferences"
              description="Manage notifications and key account settings in one place."
              last
            />
          </View>
        </View>
      </View>

      <DownloadSection isMobile={isMobile} />

      <View style={styles.section} nativeID="faq">
        <View style={styles.shell}>
          <SectionHeading
            eyebrow="Here to help"
            title="Questions, answered."
            description="Find clear answers about accounts, access, and the features available here."
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
            eyebrow="The important details"
            title="Privacy and terms, clearly explained."
            description="Read the policies that explain account access, information handling, and service availability."
            align="left"
          />
          <View style={[styles.legalGrid, isMobile && styles.stack]}>
            <View style={styles.legalCard} nativeID="terms">
              <Text style={styles.legalTitle}>Terms and conditions</Text>
              <Text style={styles.bodyText}>
                Westcott Reserve is not a licensed bank or financial institution.
                Features displayed in this version are illustrative and are not
                connected to real payment networks. Review the full terms before
                using the service.
              </Text>
              <WebAnchor href="/terms" target="_self" style={styles.policyLink}>
                <Text style={styles.policyLinkText}>Read terms and conditions →</Text>
              </WebAnchor>
            </View>
            <View style={styles.legalCard} nativeID="privacy">
              <Text style={styles.legalTitle}>Privacy policy</Text>
              <Text style={styles.bodyText}>
                When you use sign-in, authentication and profile information are
                handled by the Supabase project configured by the service
                operator. The operator manages access controls, retention, and
                connected service providers.
              </Text>
              <WebAnchor href="/privacy-policy" target="_self" style={styles.policyLink}>
                <Text style={styles.policyLinkText}>Read privacy policy →</Text>
              </WebAnchor>
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
      <WebAnchor href="/" target="_self" style={styles.brand}>
        <BrandLockup dark subtitle="Digital finance" />
      </WebAnchor>

      {isDesktop ? (
        <View style={styles.navLinks}>
          {NAV_LINKS.map((link) => (
            <WebAnchor
              key={link.id}
              href={link.href || `#${link.id}`}
              target={link.href ? "_self" : "_blank"}
              style={link.cta ? [styles.headerAction, styles.headerDownloadAction] : styles.navLink}
            >
              <Text style={link.cta
                ? [styles.headerActionText, styles.headerDownloadActionText]
                : styles.navLinkText}
              >
                {link.title}
              </Text>
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
                <WebAnchor
                  key={link.id}
                  href={link.href || `#${link.id}`}
                  target={link.href ? "_self" : "_blank"}
                  style={link.cta
                    ? [styles.headerAction, styles.headerDownloadAction, styles.mobileMenuAction]
                    : styles.mobileMenuLink}
                >
                  <Text style={link.cta
                    ? [styles.headerActionText, styles.headerDownloadActionText]
                    : styles.mobileMenuText}
                  >
                    {link.title}
                  </Text>
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
          <Ionicons name="sparkles-outline" size={14} color="#E5CC99" />
          <Text style={styles.heroEyebrowText}>A MORE CONSIDERED EXPERIENCE</Text>
        </View>
        <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
          Your finances,{"\n"}
          <Text style={styles.heroTitleAccent}>in better focus.</Text>
        </Text>
        <Text style={styles.heroDescription}>
          A beautifully clear place to explore your accounts, follow activity,
          and keep everyday tools close at hand.
        </Text>
        <View style={[styles.heroActions, isMobile && styles.heroActionsStack]}>
          <AuthAction onLaunchApp={onLaunchApp} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Get started</Text>
            <Ionicons name="arrow-forward" size={17} color="#142238" />
          </AuthAction>
          <WebAnchor href="/download-app" target="_self" style={styles.secondaryAction}>
            <Ionicons name="phone-portrait-outline" size={17} color="#FFFFFF" />
            <Text style={styles.secondaryActionText}>Get the app</Text>
          </WebAnchor>
        </View>
        <View style={[styles.heroHighlights, isMobile && styles.heroHighlightsMobile]}>
          <View style={styles.heroHighlight}>
            <Ionicons name="grid-outline" size={15} color="#D8B978" />
            <Text style={styles.heroHighlightText}>Everything in one view</Text>
          </View>
          <View style={styles.heroHighlightDivider} />
          <View style={styles.heroHighlight}>
            <Ionicons name="shield-checkmark-outline" size={15} color="#D8B978" />
            <Text style={styles.heroHighlightText}>Your preferences, your way</Text>
          </View>
        </View>
      </View>
      <View style={[
        styles.heroVisual,
        !isDesktop && styles.heroVisualTablet,
        isMobile && styles.heroVisualMobile,
      ]}>
        <View pointerEvents="none" style={styles.heroVisualRing} />
        <View style={styles.previewFloat}>
          <View style={styles.previewFloatIcon}>
            <Ionicons name="sparkles" size={15} color="#15263B" />
          </View>
          <View>
            <Text style={styles.previewFloatTitle}>A little more clarity</Text>
            <Text style={styles.previewFloatCaption}>Designed around your day</Text>
          </View>
        </View>
        <AccountOverviewGraphic />
        <View style={styles.previewFoot}>
          <Ionicons name="eye-outline" size={13} color="#E5CC99" />
          <Text style={styles.previewFootText}>Illustrative interface preview</Text>
        </View>
      </View>
    </View>
  );
}

function AccountOverviewGraphic() {
  return (
    <View style={styles.dashboard}>
      <View style={styles.dashboardTop}>
        <View>
          <Text style={styles.dashboardLabel}>WESTCOTT RESERVE</Text>
          <Text style={styles.dashboardTitle}>Your overview</Text>
        </View>
        <View style={styles.accountStatusPill}><View style={styles.accountStatusDot} /><Text style={styles.accountStatusText}>YOUR OVERVIEW</Text></View>
      </View>
      <View style={styles.balancePanel}>
        <Text style={styles.balanceLabel}>Your money, at a glance</Text>
        <Text style={styles.balanceAmount}>More in view.</Text>
        <Text style={styles.balanceNote}>Accounts · activity · preferences</Text>
        <View style={styles.graphicChart}>
          {[26, 34, 30, 45, 37, 51, 42, 63, 54, 72].map((height, index) => (
            <View key={index} style={[styles.graphicChartBar, { height }]} />
          ))}
          <View style={styles.chartShine} />
        </View>
      </View>
      <View style={styles.accountRow}>
        <View style={styles.accountIcon}>
          <Text style={styles.accountIconText}>A</Text>
        </View>
        <View style={styles.accountCopy}>
          <Text style={styles.accountTitle}>Everyday account</Text>
          <Text style={styles.accountSubtitle}>Your account details</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#AAB6C5" />
      </View>
      <View style={styles.accountDivider} />
      <View style={styles.accountRow}>
        <View style={[styles.accountIcon, styles.cardIcon]}>
          <Text style={styles.accountIconText}>V</Text>
        </View>
        <View style={styles.accountCopy}>
          <Text style={styles.accountTitle}>Virtual card</Text>
          <Text style={styles.accountSubtitle}>Manage card options</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#AAB6C5" />
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
          A calm, considered interface helps you see account information,
          follow activity, and find the tools you need without extra clutter.
        </Text>
        <View style={styles.panelPills}>
          <Text style={styles.panelPill}>Account overview</Text>
          <Text style={styles.panelPill}>Clear activity</Text>
          <Text style={styles.panelPill}>Personal controls</Text>
        </View>
      </View>
      <View style={styles.activityPanel}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>Recent activity</Text>
          <Text style={styles.activityCaption}>ACCOUNT ACTIVITY</Text>
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
          <Text style={styles.downloadTitle}>Your account, wherever you are.</Text>
          <Text style={styles.bodyText}>
            Get the Westcott Reserve Android app and access your account tools
            from your mobile device.
          </Text>
          <View style={styles.downloadMetaRow}>
            <Text style={styles.downloadMeta}>Android APK</Text>
            <Text style={styles.downloadMetaDot}>·</Text>
            <Text style={styles.downloadMeta}>ARM 32-bit and 64-bit</Text>
            <Text style={styles.downloadMetaDot}>·</Text>
            <Text style={styles.downloadMeta}>Android 8.0 and up</Text>
          </View>
        </View>
        <WebAnchor
          href="/download-app"
          target="_self"
          style={[styles.downloadButton, isMobile && styles.downloadButtonMobile]}
        >
          <Text style={styles.downloadButtonText}>View app and download</Text>
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
          <WebAnchor href="/" target="_self" style={styles.brand}>
            <BrandLockup dark subtitle="Digital finance" />
          </WebAnchor>
          <Text style={styles.footerTagline}>
            Clarity for everyday finances.
          </Text>
          <Text style={styles.footerDisclaimer}>
            Westcott Reserve is not a licensed financial institution. Features shown in this version
            are illustrative and do not move or hold funds.
          </Text>
        </View>
        <View style={[styles.footerLinks, isMobile && styles.footerLinksMobile]}>
          <View style={styles.footerLinkColumn}>
            <Text style={styles.footerColumnTitle}>Explore</Text>
            {NAV_LINKS.slice(0, 2).map((link) => (
              <FooterLink key={link.id} href={link.href || `#${link.id}`} title={link.title} />
            ))}
            <FooterLink href="/download-app" title="Get the app" />
            <AuthAction onLaunchApp={onLaunchApp} style={styles.footerLink}>
              <Text style={styles.footerLinkText}>Sign in</Text>
            </AuthAction>
          </View>
          <View style={styles.footerLinkColumn}>
            <Text style={styles.footerColumnTitle}>Information</Text>
            <FooterLink href="/privacy-policy" title="Privacy policy" />
            <FooterLink href="/terms" title="Terms and conditions" />
            <FooterLink href="/faqs" title="FAQs" />
          </View>
        </View>
      </View>
      <View style={styles.footerBottom}>
        <Text style={styles.footerCopyright}>
          © {new Date().getFullYear()} Westcott Reserve
        </Text>
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
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#0D1B2A",
    paddingBottom: 34,
  },
  heroGlow: {
    position: "absolute",
    width: 580,
    height: 580,
    borderRadius: 290,
    top: -290,
    right: -80,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(216,185,120,0.09)",
  },
  heroDisclosure: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 64,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  heroDisclosureMobile: {
    flexWrap: "wrap",
    paddingTop: 15,
    paddingBottom: 8,
    marginTop: 42,
  },
  heroDisclosureMark: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(216,185,120,0.12)",
  },
  heroDisclosureText: {
    flex: 1,
    color: "#C2CBD5",
    fontSize: 12,
    lineHeight: 18,
  },
  heroDisclosureLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 8,
  },
  heroDisclosureLinkText: {
    color: "#E5CC99",
    fontSize: 12,
    fontWeight: "700",
  },
  siteHeaderWrap: {
    backgroundColor: "#0D1B2A",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  header: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
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
  headerDownloadAction: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.38)",
  },
  headerDownloadActionText: {
    color: "#FFFFFF",
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
    gap: 48,
    paddingTop: 86,
    paddingBottom: 12,
  },
  heroStack: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 40,
    paddingTop: 54,
  },
  heroCopy: {
    flex: 1,
    maxWidth: 540,
  },
  heroEyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(216,185,120,0.32)",
    backgroundColor: "rgba(216,185,120,0.08)",
    borderRadius: 24,
    marginBottom: 27,
  },
  heroEyebrowText: {
    color: "#E5CC99",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 60,
    lineHeight: 67,
    fontWeight: "600",
    letterSpacing: -2,
  },
  heroTitleMobile: {
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -1.2,
  },
  heroTitleAccent: {
    color: "#E0C27F",
  },
  heroDescription: {
    maxWidth: 500,
    color: "#C2CBD5",
    fontSize: 16,
    lineHeight: 28,
    marginTop: 25,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 32,
  },
  heroActionsStack: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  primaryAction: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: "#E0C27F",
    shadowColor: "#E0C27F",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primaryActionText: {
    color: "#142238",
    fontSize: 13,
    fontWeight: "800",
  },
  actionArrow: {
    color: "#142238",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryAction: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
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
    position: "relative",
    width: "47%",
    maxWidth: 510,
    minWidth: 360,
    paddingTop: 52,
    paddingBottom: 20,
  },
  heroHighlights: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 26,
  },
  heroHighlightsMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 22,
  },
  heroHighlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  heroHighlightText: {
    color: "#C2CBD5",
    fontSize: 11,
    fontWeight: "600",
  },
  heroHighlightDivider: {
    width: 1,
    height: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  heroVisualMobile: {
    width: "100%",
    paddingTop: 46,
    paddingBottom: 8,
  },
  heroVisualRing: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    right: -38,
    top: -16,
    borderWidth: 1,
    borderColor: "rgba(216,185,120,0.16)",
    backgroundColor: "rgba(216,185,120,0.025)",
  },
  previewFloat: {
    position: "absolute",
    zIndex: 2,
    top: 0,
    left: -28,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  previewFloatIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#F4EBD5",
  },
  previewFloatTitle: {
    color: "#1D2E43",
    fontSize: 10,
    fontWeight: "800",
  },
  previewFloatCaption: {
    color: "#7A8796",
    fontSize: 9,
    marginTop: 3,
  },
  previewFoot: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 11,
    marginRight: 4,
  },
  previewFootText: {
    color: "#C2CBD5",
    fontSize: 10,
  },
  heroVisualTablet: {
    width: "100%",
    minWidth: 0,
    maxWidth: 520,
    alignSelf: "center",
    paddingTop: 46,
  },
  dashboard: {
    width: "100%",
    padding: 25,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    shadowColor: "#020A13",
    shadowOpacity: 0.3,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 22 },
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
    fontSize: 30,
    fontWeight: "700",
    marginTop: 8,
  },
  balanceNote: {
    color: "#738093",
    fontSize: 10,
    marginTop: 6,
  },
  accountStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6F2",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },
  accountStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#378B67",
  },
  accountStatusText: {
    color: "#3D7159",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  graphicChart: {
    position: "relative",
    height: 68,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 7,
    marginTop: 19,
  },
  graphicChartBar: {
    flex: 1,
    borderRadius: 4,
    backgroundColor: "#D8B978",
    opacity: 0.84,
  },
  chartShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
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
  policyLink: {
    alignSelf: "flex-start",
    paddingTop: 12,
  },
  policyLinkText: {
    color: "#705B32",
    fontSize: 12,
    fontWeight: "700",
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
