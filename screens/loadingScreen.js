import React, { useCallback } from 'react';
import { useAppTheme } from '../hooks/useAppTheme';
import { StyleSheet, Text, View, StatusBar, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { AuthService } from '../services/authService';
import { supabase } from '../services/supabaseClient';

const LoadingScreen = ({ navigation }) => {
  const { theme, isDark } = useAppTheme();
  const dispatch = useDispatch();

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const checkAuth = async () => {
        try {
          const [initialProfile] = await Promise.all([
            AuthService.getCurrentSession(),
            new Promise((resolve) => setTimeout(resolve, 1000)),
          ]);

          if (!isMounted) return;

          let activeProfile = initialProfile;

          // Double check with live Supabase session to prevent stale/empty profile states
          if (!activeProfile || !activeProfile.name) {
            const { data: sessionData } = await supabase.auth.getSession();
            const sessionUserId = sessionData?.session?.user?.id;

            if (sessionUserId) {
              const { data: liveProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionUserId)
                .maybeSingle();

              if (liveProfile) {
                activeProfile = liveProfile;
              }
            }
          }

          if (activeProfile && activeProfile.id) {
            dispatch({ type: 'SET_USER', payload: activeProfile });
            navigation.reset({ index: 0, routes: [{ name: 'lock' }] });
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'auth' }] });
          }
        } catch (error) {
          if (isMounted) {
            navigation.reset({ index: 0, routes: [{ name: 'auth' }] });
          }
        }
      };

      checkAuth();

      return () => {
        isMounted = false;
      };
    }, [navigation, dispatch])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0C" />
      <View style={styles.mainContent}>
        <View style={styles.logoBadge}>
          <Ionicons name="sparkles" size={40} color="#7052FF" />
        </View>
        <Text style={styles.brandTitle}>Westcott Reserve</Text>
        <Text style={styles.brandSubtitle}>DIGITAL PRIVATE BANKING</Text>
        <ActivityIndicator size="small" color="#7052FF" style={{ marginTop: 24 }} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure 256-bit Encrypted Banking Session</Text>
      </View>
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(112, 82, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(112, 82, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7052FF',
    letterSpacing: 2.5,
    marginTop: 6,
  },
  footer: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
  },
});
