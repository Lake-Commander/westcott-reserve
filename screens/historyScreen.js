// screens/historyScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Circle } from 'react-native-svg';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import { BankService } from '../services/bankService';

const { width } = Dimensions.get('window');

const HistoryScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const currentUser = useSelector((state) => state.userReducer?.user);

  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'insights'
  const [search, setSearch] = useState('');
  const [rawTransactions, setRawTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [currentUser?.id]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await BankService.getTransactions(currentUser?.id);
      setRawTransactions(data || []);
    } catch (err) {
      console.warn('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group transactions by Date Header (e.g., "April 1", "March 27")
  const getGroupedTransactions = () => {
    const filtered = rawTransactions.filter((tx) => {
      const target = (tx.counterparty || tx.receiver_name || tx.note || '').toLowerCase();
      return target.includes(search.toLowerCase());
    });

    const groups = {};
    filtered.forEach((tx) => {
      const d = new Date(tx.created_at || tx.timestamp || Date.now());
      const dateHeader = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      if (!groups[dateHeader]) groups[dateHeader] = [];
      groups[dateHeader].push(tx);
    });

    return Object.keys(groups).map((header) => ({
      title: header,
      data: groups[header],
    }));
  };

  // Calculate Insights Metrics
  const calculateInsights = () => {
    let totalCredit = 0;
    let totalDebit = 0;

    const categories = {
      'Bill Payments': { amount: 0, count: 0, color: '#10B981', icon: 'phone-portrait-outline' },
      'Loans and Debts': { amount: 0, count: 0, color: '#EF4444', icon: 'card-outline' },
      'Transportation': { amount: 0, count: 0, color: '#A855F7', icon: 'car-outline' },
      'Taxes and Government Fees': { amount: 0, count: 0, color: '#F59E0B', icon: 'scale-outline' },
      'Others': { amount: 0, count: 0, color: '#FFFFFF', icon: 'grid-outline' },
    };

    rawTransactions.forEach((tx) => {
      const amt = parseFloat(tx.amount || 0);
      if (tx.type === 'CREDIT') {
        totalCredit += amt;
      } else {
        totalDebit += amt;
        const note = (tx.note || tx.counterparty || '').toLowerCase();
        if (note.includes('bill') || note.includes('recharge') || note.includes('airtime')) {
          categories['Bill Payments'].amount += amt;
          categories['Bill Payments'].count += 1;
        } else if (note.includes('loan') || note.includes('debt')) {
          categories['Loans and Debts'].amount += amt;
          categories['Loans and Debts'].count += 1;
        } else if (note.includes('ride') || note.includes('uber') || note.includes('transport')) {
          categories['Transportation'].amount += amt;
          categories['Transportation'].count += 1;
        } else if (note.includes('tax') || note.includes('fee')) {
          categories['Taxes and Government Fees'].amount += amt;
          categories['Taxes and Government Fees'].count += 1;
        } else {
          categories['Others'].amount += amt;
          categories['Others'].count += 1;
        }
      }
    });

    const totalVolume = totalCredit + totalDebit;
    const creditPct = totalVolume > 0 ? ((totalCredit / totalVolume) * 100).toFixed(1) : '50.0';
    const debitPct = totalVolume > 0 ? ((totalDebit / totalVolume) * 100).toFixed(1) : '50.0';

    return {
      totalCredit,
      totalDebit,
      totalVolume,
      creditPct,
      debitPct,
      categories,
    };
  };

  const insights = calculateInsights();
  const groupedData = getGroupedTransactions();

  // SVG Donut Chart Renderer
  const renderDonutChart = () => {
    const size = 180;
    const strokeWidth = 24;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;

    const catKeys = Object.keys(insights.categories);
    let accumulatedAngle = 0;

    return (
      <View style={styles.donutContainer}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {catKeys.map((key) => {
              const cat = insights.categories[key];
              if (cat.amount <= 0 || insights.totalDebit <= 0) return null;

              const pct = cat.amount / insights.totalDebit;
              const strokeDashoffset = circumference - circumference * pct;
              const rotation = accumulatedAngle;
              accumulatedAngle += pct * 360;

              return (
                <Circle
                  key={key}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={cat.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation={rotation}
                  origin={`${center}, ${center}`}
                  fill="transparent"
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.donutCenterContent}>
          <Text style={[styles.donutTotalText, { color: theme.textPrimary }]}>
            ${insights.totalDebit.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.donutLabel, { color: theme.textMuted }]}>Debit</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>History</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Ionicons name="calendar-outline" size={18} color="#7052FF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Ionicons name="funnel-outline" size={18} color="#7052FF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Tab Switcher */}
      <View style={[styles.segmentContainer, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'transactions' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('transactions')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, { color: activeTab === 'transactions' ? '#FFFFFF' : theme.textMuted }]}>
            Transactions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'insights' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('insights')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, { color: activeTab === 'insights' ? '#FFFFFF' : theme.textMuted }]}>
            Spending Insights
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* VIEW 1: TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <>
            {/* Search Input */}
            <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
              <Ionicons name="search-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search transactions"
                placeholderTextColor={theme.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#7052FF" />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading history...</Text>
              </View>
            ) : (
              groupedData.map((group) => (
                <View key={group.title} style={styles.groupSection}>
                  <Text style={[styles.groupTitleHeader, { color: theme.textSecondary }]}>{group.title}</Text>
                  <View style={[styles.groupCardContainer, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                    {group.data.map((tx, idx) => {
                      const isCredit = tx.type === 'CREDIT';
                      const amt = parseFloat(tx.amount || 0);
                      const timeStr = new Date(tx.created_at || tx.timestamp || Date.now()).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      });

                      return (
                        <TouchableOpacity
                          key={tx.id || idx}
                          style={[
                            styles.txRow,
                            idx < group.data.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
                          ]}
                          onPress={() => navigation.navigate('transactionDetails', {
                            transaction: tx,
                            currency: currentUser?.currency,
                          })}
                          activeOpacity={0.7}
                        >
                          <View style={styles.txLeftCol}>
                            <View style={[styles.txAvatar, { backgroundColor: isCredit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                              <Ionicons
                                name={isCredit ? 'arrow-down' : 'arrow-up'}
                                size={14}
                                color={isCredit ? '#10B981' : '#F59E0B'}
                                style={styles.directionBadge}
                              />
                              <Text style={[styles.txAvatarText, { color: isCredit ? '#10B981' : '#F59E0B' }]}>
                                {isCredit ? 'IN' : 'OUT'}
                              </Text>
                            </View>

                            <View>
                              <Text style={[styles.txName, { color: theme.textPrimary }]}>
                                {tx.counterparty || tx.receiver_name || 'Transaction'}
                              </Text>
                              <Text style={[styles.txSub, { color: theme.textMuted }]}>
                                {tx.account_number || tx.note || 'Direct Transfer'}
                              </Text>
                            </View>
                          </View>

                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.txAmountText, { color: theme.textPrimary }]}>
                              {isCredit ? '+' : '-'}${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Text>
                            <Text style={[styles.txTimeText, { color: theme.textMuted }]}>{timeStr}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* VIEW 2: SPENDING INSIGHTS TAB */}
        {activeTab === 'insights' && (
          <>
            <Text style={[styles.insightsSubHeader, { color: theme.textMuted }]}>Showing</Text>
            <Text style={[styles.insightsTitleHeader, { color: theme.textPrimary }]}>Default Volume</Text>

            {/* Overview Balance Card */}
            <View style={[styles.overviewCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View style={styles.overviewRow}>
                <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>Credit</Text>
                <Text style={styles.creditValText}>
                  ${insights.totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                  <Text style={styles.pctSub}>({insights.creditPct}%)</Text>
                </Text>
              </View>

              <View style={[styles.overviewRow, { marginTop: 10 }]}>
                <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>Debit</Text>
                <Text style={styles.debitValText}>
                  ${insights.totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                  <Text style={styles.pctSub}>({insights.debitPct}%)</Text>
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

              <View style={styles.overviewRow}>
                <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>Total</Text>
                <Text style={[styles.totalValText, { color: theme.textPrimary }]}>
                  ${insights.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {/* Donut Chart */}
            {renderDonutChart()}

            {/* Categories Breakdown Cards */}
            <View style={{ gap: 10, marginTop: 20 }}>
              {Object.keys(insights.categories).map((catName) => {
                const cat = insights.categories[catName];
                const pct = insights.totalDebit > 0 ? ((cat.amount / insights.totalDebit) * 100).toFixed(2) : '0.00';

                return (
                  <View key={catName} style={[styles.categoryCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                    <View style={[styles.categoryIconCircle, { backgroundColor: theme.surfaceLight }]}>
                      <Ionicons name={cat.icon} size={18} color={cat.color} />
                    </View>

                    <View style={styles.categoryTextCol}>
                      <Text style={[styles.categoryTitle, { color: cat.color }]}>{catName}</Text>
                      <Text style={[styles.categorySub, { color: theme.textMuted }]}>
                        {cat.count} {cat.count === 1 ? 'Transaction' : 'Transactions'}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.categoryAmount, { color: cat.color }]}>
                        ${cat.amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </Text>
                      <Text style={[styles.categoryPct, { color: theme.textMuted }]}>{pct}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
  },
  screenTitle: { fontSize: 24, fontWeight: '800' },
  headerIcons: { flexDirection: 'row', gap: 10 },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 18,
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 },
  segmentBtnActive: { backgroundColor: '#7052FF' },
  segmentText: { fontSize: 13, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 120 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  loadingBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  loadingText: { fontSize: 13, fontWeight: '500' },
  groupSection: { marginBottom: 18 },
  groupTitleHeader: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  groupCardContainer: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  txLeftCol: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  txAvatarText: { fontSize: 10, fontWeight: '800' },
  directionBadge: { position: 'absolute', top: 4, right: 4 },
  txName: { fontSize: 14, fontWeight: '700' },
  txSub: { fontSize: 12, marginTop: 2 },
  txAmountText: { fontSize: 14, fontWeight: '800' },
  txTimeText: { fontSize: 11, marginTop: 2 },
  insightsSubHeader: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  insightsTitleHeader: { fontSize: 15, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  overviewCard: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 24 },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overviewLabel: { fontSize: 13, fontWeight: '600' },
  creditValText: { color: '#10B981', fontSize: 14, fontWeight: '800' },
  debitValText: { color: '#EF4444', fontSize: 14, fontWeight: '800' },
  pctSub: { fontSize: 12, fontWeight: '500' },
  totalValText: { fontSize: 15, fontWeight: '800' },
  divider: { height: 1, marginVertical: 12 },
  donutContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 10, position: 'relative' },
  donutCenterContent: { position: 'absolute', alignItems: 'center' },
  donutTotalText: { fontSize: 20, fontWeight: '800' },
  donutLabel: { fontSize: 12, marginTop: 2 },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTextCol: { flex: 1 },
  categoryTitle: { fontSize: 14, fontWeight: '700' },
  categorySub: { fontSize: 12, marginTop: 2 },
  categoryAmount: { fontSize: 14, fontWeight: '800' },
  categoryPct: { fontSize: 12, marginTop: 2 },
});