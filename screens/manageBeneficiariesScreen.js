// screens/manageBeneficiariesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import { BankService } from '../services/bankService';

const ManageBeneficiariesScreen = ({ navigation, route }) => {
  const { theme } = useAppTheme();
  const currentUser = useSelector((state) => state.userReducer?.user);

  const returnTarget = route?.params?.returnTarget;
  const lockTab = route?.params?.lockTab;

  const [activeTab, setActiveTab] = useState(lockTab || 'westcott');
  const [search, setSearch] = useState('');
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lockTab) {
      setActiveTab(lockTab);
    }
  }, [lockTab]);

  const loadBeneficiaries = async () => {
    setLoading(true);
    const data = await BankService.getTransferredBeneficiaries(currentUser?.id);
    setBeneficiaries(data);
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadBeneficiaries();
    }, [currentUser?.id])
  );

  const currentTabItems = beneficiaries.filter((b) =>
    activeTab === 'westcott' ? b.isWestcott : !b.isWestcott
  );

  const filteredList = currentTabItems.filter(
    (item) =>
      String(item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(item.identifier || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectBeneficiary = (item) => {
    const accNum = item.accountNumber || (
      !item.isUsernameBeneficiary ? item.identifier : ''
    );
    const uname = item.username || (
      String(item.identifier || '').startsWith('@')
        ? String(item.identifier).replace(/^@/, '')
        : ''
    );
    const bank = item.bank || item.bankName || 'Westcott Reserve Bank';
    const beneficiary = {
      name: item.name || '',
      username: uname,
      accountNumber: accNum,
      bank,
      isWestcott: Boolean(item.isWestcott),
    };

    if (returnTarget === 'transferBank') {
      navigation.navigate('transferBank', {
        beneficiary,
        recipientAccount: accNum,
        recipientBank: bank,
        recipientName: beneficiary.name,
      });
    } else if (returnTarget === 'transferUsername') {
      if (!item.isUsernameBeneficiary || !uname) {
        navigation.navigate('transferBank', {
          beneficiary,
          recipientAccount: accNum,
          recipientBank: bank,
          recipientName: beneficiary.name,
        });
        return;
      }
      navigation.navigate('transferUsername', {
        beneficiary,
        recipientUsername: uname,
      });
    } else {
      if (item.isUsernameBeneficiary) {
        navigation.navigate('transferUsername', {
          beneficiary,
          recipientUsername: uname,
        });
      } else {
        navigation.navigate('transferBank', {
          beneficiary,
          recipientAccount: accNum,
          recipientBank: bank,
          recipientName: beneficiary.name,
        });
      }
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Manage Beneficiaries</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Easily manage your saved beneficiaries.
        </Text>

        <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Ionicons name="search-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search"
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

        <View style={[styles.tabBar, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'westcott' && [styles.activeTabBtn, { backgroundColor: theme.surfaceLight }],
              lockTab && lockTab !== 'westcott' && { opacity: 0.4 },
            ]}
            onPress={() => !lockTab && setActiveTab('westcott')}
            disabled={!!lockTab}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'westcott' ? theme.textPrimary : theme.textMuted },
              ]}
            >
              Westcott
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'other' && [styles.activeTabBtn, { backgroundColor: theme.surfaceLight }],
              lockTab && lockTab !== 'other' && { opacity: 0.4 },
            ]}
            onPress={() => !lockTab && setActiveTab('other')}
            disabled={!!lockTab}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'other' ? theme.textPrimary : theme.textMuted },
              ]}
            >
              Other Banks
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#7052FF" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Fetching beneficiaries...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredList}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.itemCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
                onPress={() => handleSelectBeneficiary(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons
                    name={item.isWestcott ? 'sparkles' : 'business-outline'}
                    size={18}
                    color="#7052FF"
                  />
                </View>

                <View style={styles.itemTextCol}>
                  <Text style={[styles.itemName, { color: theme.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.itemSub, { color: theme.textSecondary }]}>
                    {item.identifier} • {item.bank}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons
                    name={activeTab === 'westcott' ? 'person-remove-outline' : 'business-outline'}
                    size={26}
                    color="#7052FF"
                  />
                </View>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  {activeTab === 'westcott'
                    ? 'No Westcott beneficiaries found.'
                    : 'No saved beneficiaries for other banks.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenWrapper>
  );
};

export default ManageBeneficiariesScreen;

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
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 4 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 18 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  activeTabBtn: { borderWidth: 1, borderColor: 'rgba(112, 82, 255, 0.2)' },
  tabText: { fontSize: 13, fontWeight: '700' },
  listContent: { paddingBottom: 40, gap: 10 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemTextCol: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700' },
  itemSub: { fontSize: 12, marginTop: 2 },
  loadingBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  loadingText: { fontSize: 13, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyIconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 13, fontWeight: '500' },
});