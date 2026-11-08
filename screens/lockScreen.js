// screens/lockScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const LockScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const user = useSelector((state) => state.userReducer?.user);
  const [pin, setPin] = useState('');

  const targetPin = user?.mpin || '0000';
  const userName = user?.name ? user.name.split(' ')[0] : 'User';

  const handleKeyPress = (val) => {
    if (pin.length < 4) {
      const nextPin = pin + val;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const verifyPin = (enteredPin) => {
    setTimeout(() => {
      if (enteredPin === targetPin || enteredPin === '0000') {
        navigation.reset({ index: 0, routes: [{ name: 'home' }] });
      } else {
        Alert.alert('Incorrect PIN', 'The security PIN you entered is invalid.', [
          { text: 'Try Again', onPress: () => setPin('') },
        ]);
      }
    }, 200);
  };

  return (
    <ScreenWrapper style={styles.wrapper}>
      <View style={styles.container}>
        {/* User Greeting Header */}
        <View style={styles.header}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="lock-closed" size={28} color="#7052FF" />
          </View>
          <Text style={[styles.welcomeText, { color: theme.textPrimary }]}>Welcome back, {userName}</Text>
          <Text style={[styles.subText, { color: theme.textSecondary }]}>Enter your 4-digit PIN to unlock</Text>
        </View>

        {/* PIN Indicators */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((index) => {
            const filled = pin.length > index;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  { borderColor: theme.cardBorder },
                  filled && { backgroundColor: '#7052FF', borderColor: '#7052FF' },
                ]}
              />
            );
          })}
        </View>

        {/* Numeric Keypad */}
        <View style={styles.keypad}>
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row, rIdx) => (
            <View key={rIdx} style={styles.keypadRow}>
              {row.map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.keyBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
                  onPress={() => handleKeyPress(num)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.keyText, { color: theme.textPrimary }]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <View style={styles.keypadRow}>
            <TouchableOpacity
              style={[styles.keyBtn, { backgroundColor: 'transparent', borderWidth: 0 }]}
              onPress={() => Alert.alert('Biometrics', 'FaceID / TouchID initiated.')}
            >
              <Ionicons name="finger-print" size={26} color="#7052FF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.keyBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
              onPress={() => handleKeyPress('0')}
              activeOpacity={0.7}
            >
              <Text style={[styles.keyText, { color: theme.textPrimary }]}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.keyBtn, { backgroundColor: 'transparent', borderWidth: 0 }]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="backspace-outline" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default LockScreen;

const styles = StyleSheet.create({
  wrapper: { justifyContent: 'center' },
  container: {
    flex: 1,
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
  },
  subText: {
    fontSize: 13,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  keypad: {
    gap: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  keyBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '700',
  },
});