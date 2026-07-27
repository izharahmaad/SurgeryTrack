import './src/services/firebase';
import './src/utils/setupText';
import React, { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';

import { paperTheme } from './src/theme';
import { useAuthStore } from './src/hooks/useAuthStore';
import AnimatedSplash from './src/components/AnimatedSplash';

import OnboardingScreen1 from './src/screens/onboarding/OnboardingScreen1';
import OnboardingScreen2 from './src/screens/onboarding/OnboardingScreen2';
import OnboardingScreen3 from './src/screens/onboarding/OnboardingScreen3';
import RoleSelectionScreen from './src/screens/auth/RoleSelectionScreen';
import StaffRoleSelectionScreen from './src/screens/auth/StaffRoleSelectionScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import DashboardScreen from './src/screens/hospital/DashboardScreen';
import CreateSurgeryScreen from './src/screens/hospital/CreateSurgeryScreen';
import ScanScreen from './src/screens/family/ScanScreen';
import ChatBotScreen from './src/screens/family/ChatBotScreen';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const { initAuth, isLoading } = useAuthStore();
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    initAuth();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && !isLoading) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  if (!fontsLoaded || isLoading) return null;

  if (showCustomSplash) {
    return (
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <AnimatedSplash onFinish={() => setShowCustomSplash(false)} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="Onboarding1" component={OnboardingScreen1} />
            <Stack.Screen name="Onboarding2" component={OnboardingScreen2} />
            <Stack.Screen name="Onboarding3" component={OnboardingScreen3} />
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="StaffRoleSelection" component={StaffRoleSelectionScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="CreateSurgery" component={CreateSurgeryScreen} />
            <Stack.Screen name="Scan" component={ScanScreen} />
            <Stack.Screen name="ChatBot" component={ChatBotScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
        <Toast />
      </PaperProvider>
    </SafeAreaProvider>
  );
}