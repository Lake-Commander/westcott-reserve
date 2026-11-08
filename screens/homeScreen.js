// screens/homeScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { BankService } from "../services/bankService";
import { supabase } from "../services/supabaseClient";
import ScreenWrapper from "../components/ScreenWrapper";
import { useAppTheme } from "../hooks/useAppTheme";

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const reduxUser = useSelector((state) => state.userReducer?.user);
  
  const { theme, isDark } = useAppTheme();

  const [user, setUser] = useState(reduxUser || null);
  const [balance, setBalance] = useState(reduxUser?.balance || 250000.0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(!reduxUser?.id);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);

  const syncLiveAccount = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData?.session?.user;

      if (!authUser) {
        navigation.reset({ index: 0, routes: [{ name: "auth" }] });
        return;
      }

      let { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!profile) {
        const genAcc = "80" + Math.floor(10000000 + Math.random() * 90000000).toString();
        const resolvedName =
          authUser.user_metadata?.name ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split("@")[0] ||
          "Account Holder";
        const resolvedUsername =
          authUser.user_metadata?.username ||
          authUser.email?.split("@")[0] ||
          "user";

        const { data: createdProfile } = await supabase
          .from("profiles")
          .upsert(
            {
              id: authUser.id,
              email: authUser.email,
              name: resolvedName,
              username: resolvedUsername,
              account_number: genAcc,
              balance: 250000.0,
              currency: "USD",
              mpin: "0000",
            },
            { onConflict: "id" }
          )
          .select()
          .single();

        profile = createdProfile;
      }

      if (profile) {
        setUser(profile);
        setBalance(parseFloat(profile.balance || 0));
        dispatch({ type: "SET_USER", payload: profile });
      }

      const txs = await BankService.getTransactions(authUser.id);
      if (Array.isArray(txs)) {
        setTransactions(txs);
      }
    } catch (err) {
      console.warn("DB synchronization error:", err);
    } finally {
      setLoading(false);
    }
  }, [navigation, dispatch]);

  useEffect(() => {
    syncLiveAccount();

    let unsubscribe;
    if (user?.id) {
      unsubscribe = BankService.subscribeToUpdates(user.id, () => {
        syncLiveAccount();
      });
    }

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [user?.id, syncLiveAccount]);

  const onRefresh = async () => {
    setRefreshing(true);
    await syncLiveAccount();
    setRefreshing(false);
  };

  const displayName = user?.name || "Account Holder";
  const userInitials =
    displayName
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "WR";

  const handleName = user?.username
    ? `@${user.username}`
    : user?.email
    ? `@${user.email.split("@")[0]}`
    : "@user";

  const accountNumberDisplay = user?.account_number || "8000000000";

  const handleCopyAccount = async () => {
    await Clipboard.setStringAsync(accountNumberDisplay);
    Alert.alert("Account Copied", `Account number ${accountNumberDisplay} copied to clipboard.`);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <ScreenWrapper>
      {/* Top Header */}
      <View style={[styles.headerBar, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => navigation.navigate("personalInfo")}
            activeOpacity={0.7}
          >
            <Text style={styles.avatarText}>{userInitials}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerTextCol}
            onPress={() => navigation.navigate("personalInfo")}
            activeOpacity={0.7}
          >
            <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>Welcome 👋</Text>
            <Text style={[styles.handleText, { color: theme.textPrimary }]}>{handleName}</Text>
          </TouchableOpacity>
        </View>

        {/* Top Header Right Buttons */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            onPress={() => Alert.alert("Concierge Desk", "Encrypted private support channel online.")}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={19} color={theme.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            onPress={() => Alert.alert("Notifications", "No unread alerts.")}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={19} color={theme.textPrimary} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7052FF" />
        }
      >
        {/* Main Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.balanceTopRow}>
            <Text style={[styles.balanceTitle, { color: theme.textSecondary }]}>Main Balance</Text>
            
            {/* Interactive Full Account Number Pill */}
            <TouchableOpacity
              style={[styles.bankPill, { backgroundColor: theme.surfaceLight }]}
              onPress={handleCopyAccount}
              activeOpacity={0.7}
            >
              <Text style={[styles.bankPillText, { color: theme.textSecondary }]}>
                {accountNumberDisplay}
              </Text>
              <Ionicons name="copy-outline" size={13} color={theme.textMuted} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.amountEyeRow}>
            <Text style={[styles.balanceValue, { color: theme.textPrimary }]}>
              {loading && !refreshing
                ? "Updating..."
                : showBalance
                ? formatCurrency(balance)
                : "••••••••"}
            </Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)} style={styles.eyeBtn}>
              <Ionicons
                name={showBalance ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={theme.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Quick Dual Actions */}
          <View style={styles.dualActionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surfaceLight }]}
              onPress={() => setReceiveModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>Receive ↙</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.accent }]}
              onPress={() => navigation.navigate("transferMenu")}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>Send ↗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4 Feature Circles Row */}
        <View style={[styles.quickServicesCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.servicesGrid}>
            <TouchableOpacity
              style={styles.quickItem}
              onPress={() => Alert.alert("Coming Soon", "Sabistok Stock Trading & Investments will launch in the next update.")}
            >
              <View style={[styles.quickIconCircle, { backgroundColor: "rgba(139, 92, 246, 0.15)" }]}>
                <Ionicons name="trending-up" size={20} color="#8B5CF6" />
              </View>
              <Text style={[styles.quickItemLabel, { color: theme.textSecondary }]}>Stocks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickItem}
              onPress={() => navigation.navigate("payBills")}
            >
              <View style={[styles.quickIconCircle, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                <Ionicons name="flash" size={20} color="#F59E0B" />
              </View>
              <Text style={[styles.quickItemLabel, { color: theme.textSecondary }]}>Pay Bills</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickItem}
              onPress={() => navigation.navigate("savings")}
            >
              <View style={[styles.quickIconCircle, { backgroundColor: "rgba(236, 72, 153, 0.15)" }]}>
                <Ionicons name="shield-checkmark" size={20} color="#EC4899" />
              </View>
              <Text style={[styles.quickItemLabel, { color: theme.textSecondary }]}>Savings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickItem}
              onPress={() => navigation.navigate("globalAccounts")}
            >
              <View style={[styles.quickIconCircle, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                <Ionicons name="globe" size={20} color="#10B981" />
              </View>
              <Text style={[styles.quickItemLabel, { color: theme.textSecondary }]}>Global</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Carousel */}
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Financial Products</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          <TouchableOpacity
            style={[styles.productCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("globalAccounts")}
          >
            <View style={styles.productBadge}>
              <Text style={styles.productBadgeText}>GLOBAL FX</Text>
            </View>
            <Ionicons name="globe-outline" size={28} color="#7052FF" style={{ marginVertical: 8 }} />
            <Text style={[styles.productCardTitle, { color: theme.textPrimary }]}>USD & EUR Accounts</Text>
            <Text style={[styles.productCardSub, { color: theme.textSecondary }]}>
              Receive direct international wires from clients and platforms worldwide.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.productCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("savings")}
          >
            <View style={[styles.productBadge, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
              <Text style={[styles.productBadgeText, { color: "#F59E0B" }]}>24% APY</Text>
            </View>
            <Ionicons name="trending-up-outline" size={28} color="#F59E0B" style={{ marginVertical: 8 }} />
            <Text style={[styles.productCardTitle, { color: theme.textPrimary }]}>Target Vaults</Text>
            <Text style={[styles.productCardSub, { color: theme.textSecondary }]}>
              Lock funds safely with automated daily interest payouts credited to your account.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.productCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Cards")}
          >
            <View style={[styles.productBadge, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
              <Text style={[styles.productBadgeText, { color: "#10B981" }]}>ACTIVE</Text>
            </View>
            <Ionicons name="card-outline" size={28} color="#10B981" style={{ marginVertical: 8 }} />
            <Text style={[styles.productCardTitle, { color: theme.textPrimary }]}>Virtual Dollar Card</Text>
            <Text style={[styles.productCardSub, { color: theme.textSecondary }]}>
              Spend securely online on Apple, Spotify, AWS, and international checkout sites.
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Promo Banner */}
        <View style={[styles.promoBanner, { backgroundColor: isDark ? "#18142E" : "#F8FAFC", borderColor: isDark ? "#292150" : "#CBD5E1" }]}>
          <View style={styles.promoTagRow}>
            <View style={[styles.promoBadge, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
              <Ionicons name="sparkles" size={12} color="#F59E0B" />
              <Text style={styles.promoBadgeText}>Special Promotion</Text>
            </View>
            <Text style={[styles.promoExpText, { color: theme.textSecondary }]}>Expires in 4 days</Text>
          </View>
          <Text style={[styles.promoTitle, { color: theme.textPrimary }]}>Earn up to 30% Return Upfront</Text>
          <Text style={[styles.promoDesc, { color: theme.textSecondary }]}>
            Save with Westcott Wealth Reserve this quarter and lock in guaranteed fixed interest.
          </Text>
          <View style={styles.promoActionsRow}>
            <TouchableOpacity
              style={[styles.promoWhiteBtn, { backgroundColor: isDark ? "#FFFFFF" : "#E2E8F0" }]}
              onPress={() => navigation.navigate("savings")}
            >
              <Text style={[styles.promoWhiteBtnText, { color: "#0A0A0C" }]}>View Plans</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.promoDarkBtn, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(15, 23, 42, 0.08)" }]}
              onPress={() => navigation.navigate("termsConditions")}
            >
              <Text style={[styles.promoDarkBtnText, { color: theme.textPrimary }]}>Terms</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={[styles.txCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.txHeaderRow}>
            <Text style={[styles.txCardTitle, { color: theme.textPrimary }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate("History")} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See All ↗</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyTxBox}>
              <Text style={[styles.emptyTxText, { color: theme.textMuted }]}>No transactions on record yet.</Text>
            </View>
          ) : (
            transactions.slice(0, 3).map((tx) => (
              <View key={tx.id} style={[styles.txRow, { borderBottomColor: theme.cardBorder }]}>
                <View
                  style={[
                    styles.txIconCircle,
                    {
                      backgroundColor:
                        tx.type === "CREDIT" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    },
                  ]}
                >
                  <Ionicons
                    name={tx.type === "CREDIT" ? "arrow-down" : "arrow-up"}
                    size={16}
                    color={tx.type === "CREDIT" ? "#10B981" : "#EF4444"}
                  />
                </View>
                <View style={styles.txDetails}>
                  <Text style={[styles.txName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {tx.counterparty || "Direct Wire"}
                  </Text>
                  <Text style={[styles.txCategory, { color: theme.textMuted }]}>
                    {tx.category || "Transfer"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    { color: tx.type === "CREDIT" ? "#10B981" : theme.textPrimary },
                  ]}
                >
                  {tx.type === "CREDIT" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Receive Modal */}
      <Modal visible={receiveModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Receive Funds</Text>
              <TouchableOpacity onPress={() => setReceiveModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 18 }}>
              Provide this 10-digit account number to counterparties to receive direct wire credits.
            </Text>

            <TouchableOpacity
              style={[styles.receiveAccBox, { backgroundColor: theme.surfaceLight, borderColor: theme.cardBorder }]}
              onPress={handleCopyAccount}
              activeOpacity={0.7}
            >
              <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "700" }}>WESTCOTT ACCOUNT NUMBER</Text>
              <Text style={styles.receiveAccNum}>{accountNumberDisplay}</Text>
              <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: "600" }}>{displayName}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={async () => {
                await handleCopyAccount();
                setReceiveModalVisible(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSubmitBtnText}>Copy Account Number</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7052FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  headerTextCol: {
    justifyContent: "center",
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  handleText: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderWidth: 1,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
    position: "absolute",
    top: 8,
    right: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  balanceTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceTitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  bankPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  bankPillText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  amountEyeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 18,
  },
  balanceValue: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 1,
  },
  eyeBtn: {
    marginLeft: 12,
  },
  dualActionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  quickServicesCard: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 18,
    borderWidth: 1,
  },
  servicesGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  quickItem: {
    alignItems: "center",
    width: "22%",
  },
  quickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickItemLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
    marginLeft: 4,
  },
  horizontalScroll: {
    gap: 12,
    paddingBottom: 18,
  },
  productCard: {
    width: 210,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  productBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(112, 82, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  productBadgeText: {
    color: "#7052FF",
    fontSize: 10,
    fontWeight: "800",
  },
  productCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 6,
  },
  productCardSub: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 4,
  },
  promoBanner: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 18,
  },
  promoTagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  promoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  promoBadgeText: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "700",
  },
  promoExpText: {
    fontSize: 11,
  },
  promoTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },
  promoDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  promoActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  promoWhiteBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  promoWhiteBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  promoDarkBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  promoDarkBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  txCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  txHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  txCardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  seeAllText: {
    color: "#7052FF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  emptyTxBox: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyTxText: {
    fontSize: 13,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txName: {
    fontSize: 14,
    fontWeight: "600",
  },
  txCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalSubmitBtn: {
    backgroundColor: "#7052FF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  modalSubmitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  receiveAccBox: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    marginVertical: 10,
  },
  receiveAccNum: {
    color: "#7052FF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 2,
    marginVertical: 4,
  },
});