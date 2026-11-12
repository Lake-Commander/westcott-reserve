
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Alert,
  Platform,
} from 'react-native';

import { supabase } from '../services/supabaseClient';
import { useAppTheme } from '../hooks/useAppTheme';

export default function FeatureGate({
  featureKey,
  children,
  fallbackMode = 'screen',
  fallbackMessage = 'There is a problem with this transaction. Please contact technical support at support@westcottreserve.com, submit a ticket, or use the live chat system for resolution.',
  alertTitle = 'Transaction Error',
}) {
  const { theme } = useAppTheme();

  // Fail closed until the admin flag has been checked.
  const [state, setState] = useState({
    loading: true,
    enabled: false,
    error: '',
  });

  useEffect(() => {
    let active = true;

    const checkAvailability = async () => {
      setState({
        loading: true,
        enabled: false,
        error: '',
      });

      try {
        // 1. Check the admin-controlled feature flag.
        const {
          data: featureData,
          error: featureError,
        } = await supabase.rpc('is_feature_enabled', {
          p_feature_key: featureKey,
        });

        console.log('[FeatureGate] Feature:', featureKey);
        console.log('[FeatureGate] Admin flag:', featureData);
        console.log('[FeatureGate] RPC error:', featureError);

        if (featureError) {
          throw featureError;
        }

        // Only an explicit true value enables the feature.
        if (featureData !== true) {
          console.warn(
            `[FeatureGate] ${featureKey} is disabled by the administrator.`
          );

          if (active) {
            setState({
              loading: false,
              enabled: false,
              error: '',
            });
          }

          return;
        }

        // 2. Check individual account transfer restrictions.
        if (featureKey === 'transfers' || featureKey === 'transfer') {
          const {
            data: authData,
            error: authError,
          } = await supabase.auth.getUser();

          if (authError) {
            throw authError;
          }

          if (authData?.user) {
            const {
              data: restriction,
              error: restrictionError,
            } = await supabase
              .from('account_transfer_restrictions')
              .select('user_id')
              .eq('user_id', authData.user.id)
              .maybeSingle();

            if (restrictionError) {
              throw restrictionError;
            }

            if (restriction) {
              console.warn(
                '[FeatureGate] This account has a transfer restriction.'
              );

              if (active) {
                setState({
                  loading: false,
                  enabled: false,
                  error: '',
                });
              }

              return;
            }
          }
        }

        // 3. Feature is enabled and the account is not restricted.
        if (active) {
          setState({
            loading: false,
            enabled: true,
            error: '',
          });
        }
      } catch (error) {
        console.error('[FeatureGate] Feature check failed:', {
          message: error?.message,
          code: error?.code,
          details: error?.details,
        });

        if (active) {
          setState({
            loading: false,
            enabled: false,
            error: error?.message || 'Unable to verify feature availability.',
          });
        }
      }
    };

    checkAvailability();

    return () => {
      active = false;
    };
  }, [featureKey]);

  // Display an error message on both web and mobile.
  const showRestrictionAlert = () => {
    console.warn(
      `[FeatureGate] Blocked tap. Feature: ${featureKey}`,
      state.error || 'Administrator restriction'
    );

    const message = state.error
      ? `${fallbackMessage}\n\nFeature verification failed. Please try again later.`
      : fallbackMessage;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${alertTitle}\n\n${message}`);
    } else {
      Alert.alert(alertTitle, message);
    }
  };

  // 4. Intercept taps directly on the protected button.
  if (fallbackMode === 'interceptTap') {
    const child = React.Children.only(children);

    if (!React.isValidElement(child)) {
      console.error(
        '[FeatureGate] interceptTap requires one valid React element.'
      );

      return null;
    }

    const originalOnPress = child.props.onPress;
    const originalDisabled = child.props.disabled;

    const handlePress = (...args) => {
      if (state.loading) {
        console.log('[FeatureGate] Still checking feature availability.');
        return;
      }

      if (!state.enabled) {
        showRestrictionAlert();
        return;
      }

      // Preserve the original button action and validation.
      if (typeof originalOnPress === 'function') {
        originalOnPress(...args);
      }
    };

    return React.cloneElement(child, {
      onPress: handlePress,
      disabled: state.loading
        ? true
        : state.enabled
          ? originalDisabled
          : false,
    });
  }

  // 5. Show a loading screen while checking the admin flag.
  if (state.loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Checking feature availability...
        </Text>
      </View>
    );
  }

  // 6. Block the entire feature if the admin has disabled it.
  if (!state.enabled) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Feature unavailable
        </Text>

        <Text style={[styles.text, { color: theme.textSecondary }]}>
          {state.error
            ? 'We could not verify this feature. Please try again later or contact technical support.'
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

  title: {
    fontSize: 20,
    fontWeight: '700',
  },

  text: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
