// hooks/useAppTheme.js
import { useState, useEffect } from "react";
import { useColorScheme, Appearance } from "react-native";
import { useSelector } from "react-redux";
import { darkTheme, lightTheme } from "../redux/themeReducer";

export const useAppTheme = () => {
  // Read direct native appearance scheme first, fallback to hook or 'dark'
  const hookColorScheme = useColorScheme();
  const [systemScheme, setSystemScheme] = useState(
    Appearance.getColorScheme() || hookColorScheme || "dark"
  );

  useEffect(() => {
    // Sync initially on mount
    const currentScheme = Appearance.getColorScheme();
    if (currentScheme) {
      setSystemScheme(currentScheme);
    }

    // Subscribe to live OS theme changes (Android/iOS settings toggle)
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) {
        setSystemScheme(colorScheme);
      }
    });

    return () => subscription.remove();
  }, []);

  // Update whenever hook detects change
  useEffect(() => {
    if (hookColorScheme) {
      setSystemScheme(hookColorScheme);
    }
  }, [hookColorScheme]);

  const themeMode = useSelector((state) => state.themeReducer?.themeMode || "system");

  // If themeMode is 'system', evaluate systemScheme; otherwise respect explicit preference
  const isDark =
    themeMode === "system"
      ? systemScheme === "dark"
      : themeMode === "dark";

  const theme = isDark ? darkTheme : lightTheme;

  return {
    themeMode,
    isDark,
    theme,
    systemColorScheme: systemScheme,
  };
};