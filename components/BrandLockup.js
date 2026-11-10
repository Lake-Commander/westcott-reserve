import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function BrandLockup({
  dark = false,
  iconSize = 42,
  subtitle,
  compact = false,
}) {
  const primary = dark ? '#FFFFFF' : '#152238';
  const secondary = dark ? '#B8C2CE' : '#687487';

  return (
    <View style={styles.lockup}>
      <Image
        accessibilityLabel="Westcott Reserve crest"
        source={require('../assets/icon.png')}
        style={[styles.mark, { width: iconSize, height: iconSize, borderRadius: iconSize * 0.26 }]}
      />
      {!compact && (
        <View style={styles.copy}>
          <Text style={[styles.name, { color: primary }]}>WESTCOTT RESERVE</Text>
          {!!subtitle && (
            <Text style={[styles.subtitle, { color: secondary }]}>{subtitle}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  mark: { resizeMode: 'cover' },
  copy: { minWidth: 0 },
  name: { fontSize: 13, fontWeight: '800', letterSpacing: 1.15 },
  subtitle: { fontSize: 9, fontWeight: '600', letterSpacing: 0.35, marginTop: 4 },
});
