import React from 'react';
import { useAppTheme } from '../hooks/useAppTheme';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MENU_ITEMS = [
  { id: 'topup', name: 'Top Up', icon: 'call', color: '#8B5CF6', bg: '#251D33' },
  { id: 'bills', name: 'Pay Bills', icon: 'flash', color: '#F59E0B', bg: '#332619' },
  { id: 'savings', name: 'Savings', icon: 'wallet', color: '#EC4899', bg: '#331B2D' },
  { id: 'global', name: 'Global', icon: 'globe', color: '#10B981', bg: '#162C26' },
  { id: 'stocks', name: 'Stocks', icon: 'trending-up', color: '#6366F1', bg: '#1D1E3A' },
  { id: 'bitcoin', name: 'Bitcoin', icon: 'logo-bitcoin', color: '#F59E0B', bg: '#332619' },
  { id: 'giftcards', name: 'Gift Cards', icon: 'gift', color: '#EC4899', bg: '#331B2D' },
  { id: 'internet', name: 'Internet', icon: 'wifi', color: '#F97316', bg: '#332019' },
];

const AllMenuPopup = ({ visible, onClose }) => {
  const { theme, isDark } = useAppTheme();
  const handleItemPress = (item) => {
    onClose();
    Alert.alert(item.name, `${item.name} module active in Westcott Reserve.`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.cardContainer}>
              {/* Header Badge */}
              <View style={styles.pillHeader}>
                <View style={styles.pillIconBadge}>
                  <Ionicons name="apps" size={16} color="#7052FF" />
                </View>
                <Text style={styles.pillTitle}>All Menu</Text>
              </View>

              {/* Grid */}
              <View style={styles.grid}>
                {MENU_ITEMS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.gridItem}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
                      <Ionicons name={item.icon} size={20} color={item.color} />
                    </View>
                    <Text style={styles.itemLabel}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>

          {/* Close FAB */}
          <TouchableOpacity style={styles.closeFab} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default AllMenuPopup;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 24,
  },
  cardContainer: {
    width: '92%',
    backgroundColor: '#16161A',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#24242C',
  },
  pillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202029',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
    marginBottom: 20,
  },
  pillIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(112, 82, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  gridItem: {
    width: '23%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLabel: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeFab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#7052FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#7052FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
