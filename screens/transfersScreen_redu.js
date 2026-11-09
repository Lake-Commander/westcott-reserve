import React, { useState } from "react";
import { useAppTheme } from '../hooks/useAppTheme';
import ScreenWrapper from '../components/ScreenWrapper';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import { SandboxBankApi, INSTITUTIONS } from "../services/sandboxBankApi";
import MpinVerificationModal from "../components/MpinVerificationModal";

const TransfersScreen = ({ navigation }) => {
  const { theme, isDark } = useAppTheme();
  const user = useSelector((state) => state.userReducer?.user);

  const [selectedInst, setSelectedInst] = useState(INSTITUTIONS[0]);
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [loading, setLoading] = useState(false);
  const [mpinPromptVisible, setMpinPromptVisible] = useState(false);

  // Auto-resolve beneficiary when user finishes typing
  const handleAccountChange = async (text) => {
    setAccountNumber(text);
    if (text.trim().length >= 6) {
      setResolving(true);
      const res = await SandboxBankApi.resolveAccount(text, selectedInst.id);
      setResolving(false);
      if (res.success) {
        setResolvedName(res.accountName);
      } else {
        setResolvedName("");
      }
    } else {
      setResolvedName("");
    }
  };

  const handleSend = () => {
    const parsedAmount = parseFloat(amount);
    if (!accountNumber.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Invalid Input", "Please provide a valid account number and amount.");
      return;
    }

    if (!user?.id) {
      Alert.alert("Sign In Required", "Please sign in again before making a transfer.");
      return;
    }

    if (user?.balance !== undefined && parsedAmount > parseFloat(user.balance)) {
      Alert.alert("Insufficient Balance", "Your account does not have sufficient funds for this wire.");
      return;
    }

    setMpinPromptVisible(true);
  };

  const executeTransfer = async () => {
    if (loading) return;
    const parsedAmount = parseFloat(amount);
    setLoading(true);
    try {
      const res = await SandboxBankApi.executeTransfer({
        senderId: user.id,
        receiverAccount: accountNumber.trim(),
        receiverName: resolvedName || `Account ${accountNumber.trim()}`,
        bankName: selectedInst.name,
        amount: parsedAmount,
        currency: user.currency || "USD",
        note: narration.trim() || "Wire Transfer",
      });

      Alert.alert(
        "Transfer Successful",
        `Reference: ${res.reference}\nRecipient: ${resolvedName || accountNumber}`,
        [{ text: "OK", onPress: () => navigation.navigate("Dashboard") }]
      );

      setAccountNumber("");
      setResolvedName("");
      setAmount("");
      setNarration("");
    } catch (err) {
      Alert.alert("Transfer Error", err.message || "Failed to process transfer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header title="Transfers & Payments" showBack={false} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Destination Bank Selector */}
        <Text style={styles.fieldLabel}>DESTINATION INSTITUTION</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.instRow}>
          {INSTITUTIONS.map((inst) => (
            <TouchableOpacity
              key={inst.id}
              style={[styles.instPill, selectedInst.id === inst.id && styles.instPillActive]}
              onPress={() => {
                setSelectedInst(inst);
                if (accountNumber) handleAccountChange(accountNumber);
              }}
            >
              <Text style={[styles.instText, selectedInst.id === inst.id && styles.instTextActive]}>
                {inst.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.fieldLabel}>BENEFICIARY ACCOUNT / IBAN</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. WR-882910 or 1029384756"
          placeholderTextColor="#64748B"
          value={accountNumber}
          onChangeText={handleAccountChange}
        />

        {/* Resolved Name Badge */}
        {resolving ? (
          <View style={styles.resolvingRow}>
            <ActivityIndicator size="small" color="#D4AF37" />
            <Text style={styles.resolvingText}>Resolving beneficiary details...</Text>
          </View>
        ) : resolvedName ? (
          <View style={styles.resolvedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.resolvedText}>{resolvedName}</Text>
          </View>
        ) : null}

        <Text style={styles.fieldLabel}>AMOUNT ({user?.currency || "USD"})</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#64748B"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.fieldLabel}>REMARKS / NARRATION</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Settlement Invoice"
          placeholderTextColor="#64748B"
          value={narration}
          onChangeText={setNarration}
        />

        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#0B0F0E" />
          ) : (
            <Text style={styles.sendBtnText}>Authorize Wire Transfer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <MpinVerificationModal
        visible={mpinPromptVisible}
        userId={user?.id}
        theme={theme}
        recipient={resolvedName || `Account ending ${accountNumber.trim().slice(-4)}`}
        amount={Number.isFinite(parseFloat(amount)) ? parseFloat(amount).toFixed(2) : ""}
        onCancel={() => setMpinPromptVisible(false)}
        onVerified={() => {
          setMpinPromptVisible(false);
          executeTransfer();
        }}
      />
    </ScreenWrapper>
  );
};

export default TransfersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F0E" },
  scroll: { padding: 18, gap: 8 },
  fieldLabel: { color: "#94A3B8", fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginTop: 12 },
  instRow: { flexDirection: "row", marginVertical: 6 },
  instPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  instPillActive: { borderColor: "#D4AF37", backgroundColor: "#1E2925" },
  instText: { color: "#64748B", fontSize: 12, fontWeight: "600" },
  instTextActive: { color: "#D4AF37" },
  input: {
    color: "#F8FAFC",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  resolvingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  resolvingText: { color: "#94A3B8", fontSize: 12 },
  resolvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    marginTop: 4,
  },
  resolvedText: { color: "#10B981", fontSize: 13, fontWeight: "600" },
  sendBtn: {
    backgroundColor: "#D4AF37",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  sendBtnText: { color: "#0B0F0E", fontSize: 14, fontWeight: "700" },
});
