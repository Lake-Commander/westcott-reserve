// App.js
import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "./hooks/useAppTheme";

import WebLandingScreen from "./screens/webLandingScreen";

import LoadingScreen from "./screens/loadingScreen";
import AuthScreen from "./screens/authScreen";
import ForgotPasswordScreen from "./screens/forgotPasswordScreen";
import LockScreen from "./screens/lockScreen";
import HomeScreen from "./screens/homeScreen";
import CardsScreen from "./screens/cardsScreen";
import HistoryScreen from "./screens/historyScreen";
import ProfileScreen from "./screens/profileScreen";
import PersonalInfoScreen from "./screens/personalInfoScreen";
import PreferencesScreen from "./screens/preferencesScreen";
import AllMenuPopup from "./screens/allMenuPopup";

// Sub Profile Screens
import VerificationScreen from "./screens/verificationScreen";
import SecurityScreen from "./screens/securityScreen";
import AccountLimitsScreen from "./screens/accountLimitsScreen";
import TransactionFeesScreen from "./screens/transactionFeesScreen";
import NotificationSettingsScreen from "./screens/notificationSettingsScreen";
import ManageBeneficiariesScreen from "./screens/manageBeneficiariesScreen";
import RequestStatementScreen from "./screens/requestStatementScreen";
import DeviceHistoryScreen from "./screens/deviceHistoryScreen";
import ContactUsScreen from "./screens/contactUsScreen";
import TermsConditionsScreen from "./screens/termsConditionsScreen";

// Additional Homepage Feature Screens
import PayBillsScreen from "./screens/payBillsScreen";
import SavingsScreen from "./screens/savingsScreen";
import GlobalAccountsScreen from "./screens/globalAccountsScreen";

import TransferMenuScreen from "./screens/transferMenuScreen";
import TransferUsernameScreen from "./screens/transferUsernameScreen";
import TransferBankScreen from "./screens/transferBankScreen";
import SelectBankScreen from "./screens/selectBankScreen";
import TransferSuccessScreen from "./screens/transferSuccessScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const EmptyCenterScreen = () => null;

const MainTabs = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  const bottomInset = Math.max(insets.bottom, 12);
  const totalBarHeight = 60 + bottomInset;

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: theme.cardBg,
              borderTopColor: theme.cardBorder,
              height: totalBarHeight,
              paddingBottom: bottomInset,
            },
          ],
          tabBarActiveTintColor: "#7052FF",
          tabBarInactiveTintColor: theme.textMuted,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIcon: ({ color, size, focused }) => {
            let iconName;
            if (route.name === "Home") iconName = focused ? "home" : "home-outline";
            else if (route.name === "Cards") iconName = focused ? "card" : "card-outline";
            else if (route.name === "History") iconName = focused ? "receipt" : "receipt-outline";
            else if (route.name === "Profile") iconName = focused ? "person" : "person-outline";

            return <Ionicons name={iconName} size={20} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Cards" component={CardsScreen} />

        {/* Center Floating Button */}
        <Tab.Screen
          name="Menu"
          component={EmptyCenterScreen}
          options={{
            tabBarLabel: () => null,
            tabBarButton: () => (
              <TouchableOpacity
                style={[styles.floatingCenterBtn, { bottom: bottomInset + 10 }]}
                onPress={() => setMenuVisible(true)}
                activeOpacity={0.8}
              >
                <View style={[styles.floatingInner, { borderColor: theme.bg }]}>
                  <Ionicons name="sparkles" size={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ),
          }}
        />

        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>

      <AllMenuPopup visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
};

const App = () => {
  const [showAppOnWeb, setShowAppOnWeb] = useState(false);

  // Serve landing page ONLY on Web platform before launching app console
  if (Platform.OS === 'web' && !showAppOnWeb) {
    return <WebLandingScreen onLaunchApp={() => setShowAppOnWeb(true)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "none" }} initialRouteName="loading">
        <Stack.Screen name="loading" component={LoadingScreen} />
        <Stack.Screen name="auth" component={AuthScreen} />
        <Stack.Screen name="forgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="lock" component={LockScreen} />
        <Stack.Screen name="home" component={MainTabs} />
        <Stack.Screen name="personalInfo" component={PersonalInfoScreen} />
        <Stack.Screen name="preferences" component={PreferencesScreen} />

        {/* Profile Settings Stack */}
        <Stack.Screen name="verification" component={VerificationScreen} />
        <Stack.Screen name="security" component={SecurityScreen} />
        <Stack.Screen name="accountLimits" component={AccountLimitsScreen} />
        <Stack.Screen name="transactionFees" component={TransactionFeesScreen} />
        <Stack.Screen name="notificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="manageBeneficiaries" component={ManageBeneficiariesScreen} />
        <Stack.Screen name="requestStatement" component={RequestStatementScreen} />
        <Stack.Screen name="deviceHistory" component={DeviceHistoryScreen} />
        <Stack.Screen name="contactUs" component={ContactUsScreen} />
        <Stack.Screen name="termsConditions" component={TermsConditionsScreen} />

        {/* Homepage Feature Stack */}
        <Stack.Screen name="payBills" component={PayBillsScreen} />
        <Stack.Screen name="savings" component={SavingsScreen} />
        <Stack.Screen name="globalAccounts" component={GlobalAccountsScreen} />

        {/* Transfer Stack */}
        <Stack.Screen name="transferMenu" component={TransferMenuScreen} />
        <Stack.Screen name="transferUsername" component={TransferUsernameScreen} />
        <Stack.Screen name="transferBank" component={TransferBankScreen} />
        <Stack.Screen name="selectBank" component={SelectBankScreen} />
        <Stack.Screen name="transferSuccess" component={TransferSuccessScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 16,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  floatingCenterBtn: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 10,
  },
  floatingInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7052FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    elevation: 8,
    shadowColor: "#7052FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});