import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const parseQrCode = (rawValue) => {
  const value = (rawValue || '').trim();
  if (!value) return null;

  const payMatch = value.match(/westcott:\/\/pay\?user=([^&]+)&name=(.+)$/i);
  if (payMatch) {
    return {
      recipientUsername: decodeURIComponent(payMatch[1]).replace(/^@/, ''),
      recipientName: decodeURIComponent(payMatch[2]),
      mode: 'username',
    };
  }

  const bankMatch = value.match(/westcott:\/\/bank\?account=([^&]+)&name=(.+)$/i);
  if (bankMatch) {
    return {
      recipientAccount: decodeURIComponent(bankMatch[1]),
      recipientName: decodeURIComponent(bankMatch[2]),
      mode: 'bank',
    };
  }

  if (/^\d{8,}$/.test(value)) {
    return { recipientAccount: value, recipientName: 'Westcott recipient', mode: 'bank' };
  }

  return { recipientUsername: value.replace(/^@/, ''), recipientName: value, mode: 'username' };
};

const QRTransferScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const [qrCode, setQrCode] = useState('westcott://pay?user=demo_user&name=Jane%20Doe');

  const handleScan = () => {
    const parsed = parseQrCode(qrCode);
    if (!parsed) {
      Alert.alert('Invalid QR', 'Paste a valid Westcott pay code or account number.');
      return;
    }

    if (parsed.mode === 'username') {
      navigation.navigate('transferUsername', { recipientUsername: parsed.recipientUsername, recipientName: parsed.recipientName });
      return;
    }

    navigation.navigate('transferBank', {
      recipientAccount: parsed.recipientAccount,
      recipientName: parsed.recipientName,
      recipientBank: 'Westcott Reserve',
    });
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Scan pay code</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}> 
        <Text style={[styles.label, { color: theme.textSecondary }]}>Paste a Westcott pay code</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
          value={qrCode}
          onChangeText={setQrCode}
          placeholder="westcott://pay?user=demo_user&name=Jane%20Doe"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={handleScan} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Recognize recipient</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

export default QRTransferScreen;

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  backCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  card: { margin: 18, borderRadius: 24, borderWidth: 1, padding: 18, gap: 12 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14, fontSize: 14 },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
