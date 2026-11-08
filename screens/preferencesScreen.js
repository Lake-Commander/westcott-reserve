// screens/preferencesScreen.js
import React, { useState } from "react";
import ScreenWrapper from '../components/ScreenWrapper';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { SET_THEME_MODE } from "../redux/constant";
import { useAppTheme } from "../hooks/useAppTheme";

const PreferencesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { themeMode, isDark, theme } = useAppTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showThemeOptions, setShowThemeOptions] = useState(false);

  const setThemeMode = (mode) => {
    dispatch({ type: SET_THEME_MODE, payload: mode });
  };

  const getThemeLabel = () => {
    if (themeMode === "system") return "System (Auto)";
    return themeMode === "dark" ? "Dark Mode" : "Light Mode";
  };

  return (
    <ScreenWrapper>

      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.backCircle, { backgroundColor: theme.cardBg }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Preferences</Text>

        {/* Preferences Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {/* Notifications Toggle */}
          <View style={[styles.itemRow, { borderBottomColor: theme.cardBorder }]}>
            <View style={styles.leftCol}>
              <View style={styles.iconCircle}>
                <Ionicons name="notifications-outline" size={18} color="#7052FF" />
              </View>
              <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#262632", true: "#7052FF" }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Change Theme */}
          <TouchableOpacity
            style={[
              styles.itemRow,
              { borderBottomColor: theme.cardBorder },
              !showThemeOptions && { borderBottomWidth: 0 },
            ]}
            onPress={() => setShowThemeOptions(!showThemeOptions)}
            activeOpacity={0.7}
          >
            <View style={styles.leftCol}>
              <View style={styles.iconCircle}>
                <Ionicons name="moon-outline" size={18} color="#7052FF" />
              </View>
              <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Change Theme</Text>
            </View>
            <View style={styles.rightTagRow}>
              <Text style={[styles.activeThemeText, { color: theme.textSecondary }]}>{getThemeLabel()}</Text>
              <Ionicons
                name={showThemeOptions ? "chevron-up" : "chevron-down"}
                size={16}
                color="#7052FF"
              />
            </View>
          </TouchableOpacity>

          {/* Expanded Theme Selection Options */}
          {showThemeOptions && (
            <View style={styles.themeOptionsContainer}>
              {/* System (Auto) */}
              <TouchableOpacity
                style={styles.themeOptionRow}
                onPress={() => setThemeMode("system")}
              >
                <Text
                  style={[
                    styles.themeOptionLabel,
                    { color: theme.textSecondary },
                    themeMode === "system" && styles.activeOptionText,
                  ]}
                >
                  System Default (Match Device)
                </Text>
                {themeMode === "system" && <Ionicons name="checkmark-circle" size={18} color="#7052FF" />}
              </TouchableOpacity>

              {/* Light Mode */}
              <TouchableOpacity
                style={styles.themeOptionRow}
                onPress={() => setThemeMode("light")}
              >
                <Text
                  style={[
                    styles.themeOptionLabel,
                    { color: theme.textSecondary },
                    themeMode === "light" && styles.activeOptionText,
                  ]}
                >
                  Light Mode
                </Text>
                {themeMode === "light" && <Ionicons name="checkmark-circle" size={18} color="#7052FF" />}
              </TouchableOpacity>

              {/* Dark Mode */}
              <TouchableOpacity
                style={styles.themeOptionRow}
                onPress={() => setThemeMode("dark")}
              >
                <Text
                  style={[
                    styles.themeOptionLabel,
                    { color: theme.textSecondary },
                    themeMode === "dark" && styles.activeOptionText,
                  ]}
                >
                  Dark Mode (Obsidian)
                </Text>
                {themeMode === "dark" && <Ionicons name="checkmark-circle" size={18} color="#7052FF" />}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default PreferencesScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingVertical: 8 },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { paddingHorizontal: 18, paddingTop: 10 },
  screenTitle: { fontSize: 24, fontWeight: "800", marginBottom: 20 },
  card: { borderRadius: 20, paddingHorizontal: 18, borderWidth: 1 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  leftCol: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(112, 82, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  itemLabel: { fontSize: 14, fontWeight: "600" },
  rightTagRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  activeThemeText: { fontSize: 13, fontWeight: "500" },
  themeOptionsContainer: { paddingVertical: 8, paddingHorizontal: 4 },
  themeOptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  themeOptionLabel: { fontSize: 13.5, fontWeight: "500" },
  activeOptionText: { color: "#7052FF", fontWeight: "700" },
});
