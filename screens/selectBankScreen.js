// screens/selectBankScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const BANK_LIST = [
  { id: '1', name: 'Westcott Reserve' },
  { id: '2', name: 'Access Bank' },
  { id: '3', name: 'First Bank of Nigeria' },
  { id: '4', name: 'GTBank (Guaranty Trust)' },
  { id: '5', name: 'Kuda Microfinance Bank' },
  { id: '6', name: 'Moniepoint Microfinance Bank' },
  { id: '7', name: 'OPay Digital Services' },
  { id: '8', name: 'Palmpay' },
  { id: '9', name: 'Stanbic IBTC Bank' },
  { id: '10', name: 'United Bank for Africa (UBA)' },
  { id: '11', name: 'Zenith Bank' },
];

const SelectBankScreen = ({ navigation, route }) => {
  // 1. Call hook at top level of the Screen component
  const { theme } = useAppTheme();
  const [search, setSearch] = useState('');

  const onSelect = route?.params?.onSelect;

  const filteredBanks = BANK_LIST.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (bankName) => {
    if (onSelect) {
      onSelect(bankName);
    }
    navigation.goBack();
  };

  // 2. Pure render item that consumes `theme` from closure scope
  const renderBankItem = ({ item }) => {
    const isWestcott = item.name.toLowerCase().includes('westcott');
    return (
      <TouchableOpacity
        style={[
          styles.bankRow,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}
        onPress={() => handleSelect(item.name)}
        activeOpacity={0.7}
      >
        <View style={styles.bankLeft}>
          <View
            style={[
              styles.bankIconCircle,
              { backgroundColor: isWestcott ? 'rgba(112, 82, 255, 0.15)' : theme.surfaceLight },
            ]}
          >
            <Ionicons
              name={isWestcott ? 'sparkles' : 'business-outline'}
              size={18}
              color={isWestcott ? '#7052FF' : theme.textSecondary}
            />
          </View>
          <Text style={[styles.bankName, { color: theme.textPrimary }]}>{item.name}</Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.backCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Select Bank</Text>
      </View>

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Ionicons name="search" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search bank name..."
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

        {/* Bank List */}
        <FlatList
          data={filteredBanks}
          keyExtractor={(item) => item.id}
          renderItem={renderBankItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No bank matches "{search}"</Text>
            </View>
          }
        />
      </View>
    </ScreenWrapper>
  );
};

export default SelectBankScreen;

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginVertical: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 40,
    gap: 8,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  bankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankName: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});