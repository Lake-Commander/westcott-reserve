import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '../services/supabaseClient';
import { DEFAULT_UI_CONFIG, normalizeUIConfig } from '../services/appUiConfig';

const AppUIConfigContext = createContext({
  config: DEFAULT_UI_CONFIG,
  configError: '',
  refreshConfig: async () => DEFAULT_UI_CONFIG,
  replaceConfig: () => {},
});

export function AppUIConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_UI_CONFIG);
  const [configError, setConfigError] = useState('');

  const refreshConfig = useCallback(async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session?.user) {
      setConfig(DEFAULT_UI_CONFIG);
      setConfigError('');
      return DEFAULT_UI_CONFIG;
    }

    const { data, error } = await supabase
      .from('app_ui_config')
      .select('config')
      .eq('id', 'default')
      .maybeSingle();
    if (error) {
      setConfigError(error.message);
      throw error;
    }
    const nextConfig = normalizeUIConfig(data?.config || DEFAULT_UI_CONFIG);
    setConfig(nextConfig);
    setConfigError('');
    return nextConfig;
  }, []);

  const replaceConfig = useCallback((value) => {
    const normalized = normalizeUIConfig(value);
    setConfig(normalized);
    setConfigError('');
  }, []);

  useEffect(() => {
    let active = true;
    const refreshIfActive = () => {
      if (!active) return;
      refreshConfig().catch((error) => {
        if (active) console.warn('Unable to load app UI configuration:', error.message);
      });
    };

    refreshIfActive();
    const { data: authSubscription } = supabase.auth.onAuthStateChange(() => {
      setTimeout(refreshIfActive, 0);
    });
    const channel = supabase
      .channel('app-ui-config')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_ui_config', filter: 'id=eq.default' },
        refreshIfActive
      )
      .subscribe();

    return () => {
      active = false;
      authSubscription.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [refreshConfig]);

  const contextValue = useMemo(
    () => ({ config, configError, refreshConfig, replaceConfig }),
    [config, configError, refreshConfig, replaceConfig]
  );
  return (
    <AppUIConfigContext.Provider value={contextValue}>
      {children}
    </AppUIConfigContext.Provider>
  );
}

export function useAppUIConfig() {
  return useContext(AppUIConfigContext);
}
