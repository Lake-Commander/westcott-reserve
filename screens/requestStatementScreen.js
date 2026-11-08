// screens/requestStatementScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import { BankService } from '../services/bankService';

const DURATION_OPTIONS = [
  { label: 'Last 30 Days (1 Month)', days: 30 },
  { label: 'Last 90 Days (3 Months)', days: 90 },
  { label: 'Last 6 Months', days: 180 },
  { label: 'Last 1 Year', days: 365 },
  { label: 'All Time', days: 9999 },
];

const RequestStatementScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const currentUser = useSelector((state) => state.userReducer?.user);

  const [selectedDurationOption, setSelectedDurationOption] = useState(DURATION_OPTIONS[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (selectedDurationOption) {
      loadStatementTransactions(selectedDurationOption.days);
    }
  }, [selectedDurationOption, currentUser?.id]);

  const loadStatementTransactions = async (days) => {
    setLoadingTx(true);
    try {
      const allTx = await BankService.getTransactions(currentUser?.id);
      const filtered = filterTransactionsByDuration(allTx, days);
      setTransactions(filtered);
    } catch (err) {
      console.warn('Failed to load transactions:', err);
    } finally {
      setLoadingTx(false);
    }
  };

  const filterTransactionsByDuration = (txList, days) => {
    if (days >= 9999) return txList;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return txList.filter((tx) => {
      const txDate = new Date(tx.created_at || tx.timestamp);
      return txDate >= cutoff;
    });
  };

  const generateStatementHtml = () => {
    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const userName = currentUser?.name || 'Account Holder';
    const userEmail = currentUser?.email || 'user@westcott.com';
    const userAcc = currentUser?.account_number || currentUser?.id || 'WR-88492019';

    let totalCredits = 0;
    let totalDebits = 0;

    const rowsHtml = transactions
      .map((tx) => {
        const amt = parseFloat(tx.amount || 0);
        const isCredit = tx.type === 'CREDIT';
        if (isCredit) totalCredits += amt;
        else totalDebits += amt;

        const dateStr = new Date(tx.created_at || tx.timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        return `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-size: 12px; color: #374151;">${dateStr}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-size: 12px; color: #111827; font-weight: 600;">${tx.counterparty || tx.receiver_name || 'Transaction'}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-size: 12px; color: #6B7280;">${tx.note || tx.type}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-size: 12px; text-align: right; font-weight: 700; color: ${isCredit ? '#10B981' : '#EF4444'};">
              ${isCredit ? '+' : '-'}$${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
          </tr>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111827; padding: 30px; margin: 0; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #7052FF; padding-bottom: 16px; margin-bottom: 24px; }
            .brand { font-size: 24px; font-weight: 800; color: #7052FF; letter-spacing: -0.5px; }
            .subtitle { font-size: 11px; color: #6B7280; margin-top: 2px; }
            .meta-table { width: 100%; margin-bottom: 24px; border-collapse: collapse; }
            .meta-td { padding: 6px 0; font-size: 13px; color: #4B5563; }
            .meta-val { font-weight: 700; color: #111827; }
            .summary-card { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; display: flex; justify-content: space-between; }
            .sum-item { text-align: center; flex: 1; }
            .sum-title { font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
            .sum-val { font-size: 15px; font-weight: 800; color: #111827; }
            table.tx-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #F3F4F6; color: #4B5563; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 10px 12px; text-align: left; }
            th.right { text-align: right; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">Westcott Reserve</div>
              <div class="subtitle">Official Account Statement</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; font-weight: 700;">Issued: ${formattedDate}</div>
              <div style="font-size: 11px; color: #6B7280;">Period: ${selectedDurationOption.label}</div>
            </div>
          </div>

          <table class="meta-table">
            <tr>
              <td class="meta-td">Account Holder: <span class="meta-val">${userName}</span></td>
              <td class="meta-td" style="text-align: right;">Account Number: <span class="meta-val">${userAcc}</span></td>
            </tr>
            <tr>
              <td class="meta-td">Email Address: <span class="meta-val">${userEmail}</span></td>
              <td class="meta-td" style="text-align: right;">Currency: <span class="meta-val">USD ($)</span></td>
            </tr>
          </table>

          <div class="summary-card">
            <div class="sum-item">
              <div class="sum-title">Total Inflow</div>
              <div class="sum-val" style="color: #10B981;">+$${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="sum-item" style="border-left: 1px solid #E5E7EB; border-right: 1px solid #E5E7EB;">
              <div class="sum-title">Total Outflow</div>
              <div class="sum-val" style="color: #EF4444;">-$${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="sum-item">
              <div class="sum-title">Transactions</div>
              <div class="sum-val">${transactions.length}</div>
            </div>
          </div>

          <table class="tx-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Narration</th>
                <th class="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="4" style="text-align:center; padding: 20px; font-size: 12px; color:#9CA3AF;">No transactions recorded for this period.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            Westcott Reserve Bank • Confidential Account Documentation
          </div>
        </body>
      </html>
    `;
  };

  const handleSavePdf = async () => {
    if (!selectedDurationOption) return;

    setGeneratingPdf(true);

    try {
      const htmlContent = generateStatementHtml();

      // 1. Generate PDF with base64 encoding enabled
      const { base64 } = await Print.printToFileAsync({
        html: htmlContent,
        base64: true,
      });

      // 2. Write Base64 string to documentDirectory
      const fileName = `Statement_${Date.now()}.pdf`;
      const targetUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(targetUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setGeneratingPdf(false);

      // 3. Share or Save PDF using local document directory path
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(targetUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Account Statement PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF Saved', `Statement saved at: ${targetUri}`);
      }
    } catch (err) {
      setGeneratingPdf(false);
      Alert.alert('PDF Generation Failed', err.message || 'Could not save PDF file.');
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

      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Request Statement</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          View transactions for your selected duration and save as PDF.
        </Text>

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Duration</Text>

        <TouchableOpacity
          style={[styles.dropdownBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.dropdownText,
              { color: selectedDurationOption ? theme.textPrimary : theme.textMuted },
            ]}
          >
            {selectedDurationOption ? selectedDurationOption.label : 'Select Duration'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* Transactions Preview List */}
        <View style={styles.previewHeader}>
          <Text style={[styles.previewTitle, { color: theme.textPrimary }]}>Transactions ({transactions.length})</Text>
        </View>

        {loadingTx ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#7052FF" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Fetching transactions...</Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item, index) => item.id || `tx_${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isCredit = item.type === 'CREDIT';
              const amt = parseFloat(item.amount || 0);

              return (
                <View style={[styles.txCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                  <View style={[styles.txIconCircle, { backgroundColor: isCredit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)' }]}>
                    <Ionicons
                      name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
                      size={18}
                      color={isCredit ? '#10B981' : '#EF4444'}
                    />
                  </View>
                  <View style={styles.txTextCol}>
                    <Text style={[styles.txTitle, { color: theme.textPrimary }]}>
                      {item.counterparty || item.receiver_name || 'Transaction'}
                    </Text>
                    <Text style={[styles.txDate, { color: theme.textMuted }]}>
                      {new Date(item.created_at || item.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: isCredit ? '#10B981' : '#EF4444' }]}>
                    {isCredit ? '+' : '-'}${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="receipt-outline" size={32} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No transactions found for this duration.
                </Text>
              </View>
            }
          />
        )}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[
            styles.proceedBtn,
            (!selectedDurationOption || generatingPdf) && styles.proceedDisabled,
          ]}
          onPress={handleSavePdf}
          disabled={!selectedDurationOption || generatingPdf}
          activeOpacity={0.8}
        >
          {generatingPdf ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.proceedText}>Save as PDF</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Duration Picker Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Duration</Text>
            {DURATION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[styles.modalOption, { borderBottomColor: theme.cardBorder }]}
                onPress={() => {
                  setSelectedDurationOption(option);
                  setModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    { color: selectedDurationOption?.label === option.label ? '#7052FF' : theme.textPrimary },
                  ]}
                >
                  {option.label}
                </Text>
                {selectedDurationOption?.label === option.label && (
                  <Ionicons name="checkmark" size={18} color="#7052FF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenWrapper>
  );
};

export default RequestStatementScreen;

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
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 18, lineHeight: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  dropdownBox: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdownText: { fontSize: 14.5, fontWeight: '500' },
  previewHeader: { marginBottom: 10 },
  previewTitle: { fontSize: 13.5, fontWeight: '700' },
  listContent: { paddingBottom: 20, gap: 8 },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txTextCol: { flex: 1 },
  txTitle: { fontSize: 13.5, fontWeight: '700' },
  txDate: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '800' },
  loadingBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { fontSize: 12 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 12.5 },
  footer: { padding: 18, borderTopWidth: 1 },
  proceedBtn: {
    backgroundColor: '#7052FF',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proceedDisabled: { opacity: 0.4 },
  proceedText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 14 },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalOptionText: { fontSize: 14, fontWeight: '600' },
});