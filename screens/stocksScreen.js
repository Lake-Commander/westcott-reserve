import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'META'];

const formatCurrency = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
};

const StocksScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadStocks = async () => {
      try {
        const results = await Promise.all(
          STOCK_SYMBOLS.map(async (symbol) => {
            const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=5m`);
            if (!response.ok) throw new Error(`Unable to fetch ${symbol}`);
            const payload = await response.json();
            const quote = payload?.chart?.result?.[0]?.meta || {};
            const close = quote.regularMarketPrice || quote.previousClose || 0;
            const open = quote.regularMarketOpen || close;
            const change = close - open;
            const percent = open ? (change / open) * 100 : 0;
            return {
              symbol,
              name: symbol,
              price: close,
              change,
              percent,
            };
          })
        );

        if (active) setStocks(results);
      } catch (error) {
        console.warn('Stocks fetch failed:', error);
        if (active) {
          setStocks(
            STOCK_SYMBOLS.map((symbol) => ({
              symbol,
              name: symbol,
              price: 0,
              change: 0,
              percent: 0,
            }))
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadStocks();
    const timer = setInterval(loadStocks, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Stocks</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.headerCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}> 
          <Text style={[styles.marketLabel, { color: theme.textSecondary }]}>Live market</Text>
          <Text style={[styles.marketValue, { color: theme.textPrimary }]}>U.S. equities watchlist</Text>
        </View>

        {loading ? (
          <View style={styles.loading}><ActivityIndicator color="#7052FF" /></View>
        ) : (
          stocks.map((stock) => {
            const positive = stock.change >= 0;
            return (
              <View key={stock.symbol} style={[styles.stockCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}> 
                <View style={styles.stockHeader}>
                  <View>
                    <Text style={[styles.symbol, { color: theme.textPrimary }]}>{stock.symbol}</Text>
                    <Text style={[styles.name, { color: theme.textSecondary }]}>{stock.name}</Text>
                  </View>
                  <View style={[styles.changePill, { backgroundColor: positive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}> 
                    <Text style={{ color: positive ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: '700' }}>
                      {positive ? '+' : ''}{stock.percent.toFixed(2)}%
                    </Text>
                  </View>
                </View>
                <View style={styles.stockFooter}>
                  <Text style={[styles.price, { color: theme.textPrimary }]}>{formatCurrency(stock.price)}</Text>
                  <Text style={[styles.change, { color: positive ? '#10B981' : '#EF4444' }]}> 
                    {positive ? '+' : ''}{formatCurrency(stock.change)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default StocksScreen;

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  backCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  content: { padding: 18, gap: 12 },
  headerCard: { borderWidth: 1, borderRadius: 20, padding: 18 },
  marketLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2 },
  marketValue: { marginTop: 8, fontSize: 22, fontWeight: '800' },
  loading: { paddingVertical: 32, alignItems: 'center' },
  stockCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  stockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  symbol: { fontSize: 18, fontWeight: '800' },
  name: { fontSize: 12, marginTop: 4 },
  changePill: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999 },
  stockFooter: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 18, fontWeight: '800' },
  change: { fontSize: 13, fontWeight: '700' },
});
