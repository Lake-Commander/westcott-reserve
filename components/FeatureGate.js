import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { useAppTheme } from '../hooks/useAppTheme';

export default function FeatureGate({ featureKey, children }) {
  const { theme } = useAppTheme();
  const [state, setState] = useState({ loading: true, enabled: false, error: '' });

  useEffect(() => {
    let active = true;
    supabase.rpc('is_feature_enabled', { p_feature_key: featureKey }).then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setState({ loading: false, enabled: false, error: error.message });
      } else {
        setState({ loading: false, enabled: data === true, error: '' });
      }
    }).catch((error) => {
      if (active) setState({ loading: false, enabled: false, error: error.message });
    });
    return () => {
      active = false;
    };
  }, [featureKey]);

  if (state.loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.accent} />
        <Text style={[styles.text, { color: theme.textSecondary }]}>Checking feature availability…</Text>
      </View>
    );
  }
  if (!state.enabled) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Feature unavailable</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          {state.error
            ? `The feature setting could not be verified: ${state.error}`
            : 'This feature has been temporarily disabled by an administrator.'}
        </Text>
      </View>
    );
  }
  return children;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 12,
    backgroundColor: '#F8FAFC',
  },
  title: { color: '#172033', fontSize: 20, fontWeight: '700' },
  text: { color: '#64748B', fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
