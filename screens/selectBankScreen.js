// screens/selectBankScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import { WebAnchor } from '../components/WebAnchor';
import { DEFAULT_UI_CONFIG } from '../services/appUiConfig';
import { useAppUIConfig } from '../components/AppUIConfigProvider';

const SelectBankScreen = ({ navigation, route }) => {
  const { theme } = useAppTheme();
  const { config } = useAppUIConfig();
  const [search, setSearch] = useState('');

  const onSelect = route?.params?.onSelect;

  const configuredBanks = config.banks?.length ? config.banks : DEFAULT_UI_CONFIG.banks;
  const bankGroups = configuredBanks.reduce((groups, bank) => {
    const country = bank.country || 'Other';
    if (!groups[country]) groups[country] = [];
    groups[country].push(bank);
    return groups;
  }, {});
  const filteredSections = Object.entries(bankGroups)
    .map(([title, data]) => ({
      title,
      data: data.filter((bank) =>
        `${bank.name} ${bank.country}`.toLowerCase().includes(search.trim().toLowerCase())
      ),
    }))
    .filter((section) => section.data.length > 0)
    .sort((left, right) => left.title.localeCompare(right.title));

  const handleSelect = (bank) => {
    if (onSelect) {
      onSelect(bank.name);
    }
    navigation.goBack();
  };

  const renderBankItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.bankRow,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        },
      ]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.bankLeft}>
        <View
          style={[
            styles.bankIconCircle,
            { backgroundColor: item.internal ? theme.accentSoft : theme.surfaceLight },
          ]}
        >
          <Ionicons
            name={item.internal ? 'sparkles' : 'business-outline'}
            size={18}
            color={item.internal ? theme.accent : theme.textSecondary}
          />
        </View>
        <View style={styles.bankCopy}>
          <Text style={[styles.bankName, { color: theme.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.countryName, { color: theme.textMuted }]}>{item.country}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
    </TouchableOpacity>
  );

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
        <View>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Select Bank</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>United States and Europe</Text>
        </View>
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

        <WebAnchor
          href="https://github.com/smowtion/swiftcode/tree/master/AllCountries"
          style={[styles.directoryLink, { backgroundColor: theme.accentSoft }]}
        >
          <Ionicons name="globe-outline" size={17} color={theme.accent} />
          <Text style={[styles.directoryLinkText, { color: theme.accent }]}>Browse worldwide bank JSON (SWIFT/BIC)</Text>
          <Ionicons name="open-outline" size={14} color={theme.accent} />
        </WebAnchor>
        <Text style={[styles.sourceNote, { color: theme.textMuted }]}>
          The directory is organized as one JSON file per country.
        </Text>

        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          renderItem={renderBankItem}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
              {section.title}
            </Text>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                No bank matches "{search}"
              </Text>
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
  headerSubtitle: { fontSize: 11, marginTop: 2 },
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
  directoryLink: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: 'rgba(112, 82, 255, 0.09)',
  },
  directoryLinkText: { color: '#7052FF', fontSize: 12, fontWeight: '700' },
  sourceNote: { fontSize: 11, lineHeight: 16, marginTop: 7, marginBottom: 4 },
  listContent: {
    paddingBottom: 40,
    paddingTop: 4,
    gap: 8,
  },
  sectionHeader: {
    backgroundColor: 'transparent',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    paddingTop: 12,
    paddingBottom: 4,
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
    flex: 1,
  },
  bankCopy: {
    flex: 1,
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
  countryName: { fontSize: 11, marginTop: 3 },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});