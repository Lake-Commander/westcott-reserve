import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const Header = ({ title = "Westcott Reserve", showBack = true, onBack }) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) onBack();
    else if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <View style={styles.header}>
      <View style={styles.sideCol}>
        {showBack ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#D4AF37" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="shield-checkmark" size={20} color="#D4AF37" />
        )}
      </View>

      <Text style={styles.headerTitle}>{title}</Text>

      <View style={styles.sideCol} />
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#0B0F0E",
    borderBottomWidth: 1,
    borderBottomColor: "#1E2925",
  },
  sideCol: {
    width: 32,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
  },
});