import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const ComingSoonScreen = ({ navigation, route }) => {
  const { theme } = useAppTheme();
  const title = route?.params?.title || 'Coming soon';
  const message = route?.params?.message || 'This feature is being prepared for launch. Try again soon.';

  return (
    <ScreenWrapper>
      <View style={styles.topBar}>
        <TouchableOpacity style={[styles.backCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.center}>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}> 
          <Ionicons name="construct-outline" size={36} color={theme.accent} />
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default ComingSoonScreen;

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: 16, paddingVertical: 8 },
  backCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 360, borderRadius: 24, borderWidth: 1, padding: 24, alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  message: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
