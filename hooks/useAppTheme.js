// hooks/useAppTheme.js
import { useState, useEffect } from "react";
import { useColorScheme, Appearance } from "react-native";
import { useSelector } from "react-redux";
import { darkTheme, lightTheme } from "../redux/themeReducer";
import { useAppUIConfig } from "../components/AppUIConfigProvider";

const withOpacity = (hex, opacity) => {
  const cleanHex = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex.slice(1) : "7052FF";
  const red = parseInt(cleanHex.slice(0, 2), 16);
  const green = parseInt(cleanHex.slice(2, 4), 16);
  const blue = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};

export const useAppTheme = () => {
  const { config } = useAppUIConfig();
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

  const palette = config.theme;
  const baseTheme = isDark ? darkTheme : lightTheme;
  const theme = {
    ...baseTheme,
    bg: isDark ? palette.darkBackground : palette.lightBackground,
    cardBg: isDark ? palette.darkCard : palette.lightCard,
    accent: palette.accent,
    accentSoft: withOpacity(palette.accent, isDark ? 0.15 : 0.1),
  };

  return {
    themeMode,
    isDark,
    theme,
    systemColorScheme: systemScheme,
  };
};