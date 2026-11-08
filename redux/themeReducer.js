// redux/themeReducer.js
import { Theme, SET_THEME_MODE } from "./constant";

export const darkTheme = {
  mode: "dark",
  bg: "#0A0A0C",
  cardBg: "#16161A",
  cardBorder: "#22222A",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  accent: "#7052FF",
  accentSoft: "rgba(112, 82, 255, 0.15)",
  tabBg: "#0F0F12",
  tabBorder: "#1A1A22",
  surfaceLight: "#1E1E26",
  inputBg: "#16161A",
  inputBorder: "#24242C",
};

export const lightTheme = {
  mode: "light",
  bg: "#F1F5F9",
  cardBg: "#FFFFFF",
  cardBorder: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  accent: "#7052FF",
  accentSoft: "rgba(112, 82, 255, 0.10)",
  tabBg: "#0F0F12", // Persistent dark tab bar as requested
  tabBorder: "#1A1A22",
  surfaceLight: "#F8FAFC",
  inputBg: "#FFFFFF",
  inputBorder: "#CBD5E1",
};

const initialState = {
  themeMode: "system", // 'system' | 'dark' | 'light'
};

export const themeReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_THEME_MODE:
      return {
        ...state,
        themeMode: action.payload,
      };
    case Theme: {
      const nextMode = state.themeMode === "dark" ? "light" : "dark";
      return {
        ...state,
        themeMode: nextMode,
      };
    }
    default:
      return state;
  }
};

export default themeReducer;