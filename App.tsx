import './src/services/firebase';
import './src/utils/setupText';

import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import {
  NavigationContainer,
  CommonActions,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import CreateSurgeryScreen from './src/screens/hospital/CreateSurgeryScreen';
import SurgeryDetailScreen from './src/screens/hospital/SurgeryDetailScreen';
import UpdateStatusScreen from './src/screens/hospital/UpdateStatusScreen';
import ScanScreen from './src/screens/family/ScanScreen';
import ChatBotScreen from './src/screens/family/ChatBotScreen';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

const ONBOARDING_COMPLETED_KEY = '@surgerytrack/onboarding_completed';

type StartupRoute =
  | 'onboarding'
  | 'auth'
  | 'main';

export default function App() {
  const {
    initAuth,
    isLoading,
    user,
  } = useAuthStore();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    let mounted = true;

    const bootstrapApp = async () => {
      try {
        await initAuth();

        const completed = await AsyncStorage.getItem(
          ONBOARDING_COMPLETED_KEY
        );

        if (mounted) {
          setOnboardingCompleted(completed === 'true');
          setOnboardingLoaded(true);
        }
      } catch (error) {
        console.error('App bootstrap error:', error);

        if (mounted) {
          setOnboardingCompleted(false);
          setOnboardingLoaded(true);
        }
      }
    };

    bootstrapApp();

    return () => {
      mounted = false;
    };
  }, [initAuth]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && !isLoading && onboardingLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading, onboardingLoaded]);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setOnboardingCompleted(true);
  };

  if (!fontsLoaded || isLoading || !onboardingLoaded) {
    return (
      <View style={styles.bootContainer}>
        <ActivityIndicator size="large" color="#F06292" />
      </View>
    );
  }

  if (showCustomSplash) {
    return (
      <View style={styles.bootContainer} onLayout={onLayoutRootView}>
        <AnimatedSplash
          onFinish={() => setShowCustomSplash(false)}
        />
      </View>
    );
  }

  const startupRoute: StartupRoute = user
    ? 'main'
    : onboardingCompleted
    ? 'auth'
    : 'onboarding';

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer>
          {startupRoute === 'main' && (
            <MainNavigator />
          )}

          {startupRoute === 'auth' && (
            <AuthNavigator />
          )}

          {startupRoute === 'onboarding' && (
            <OnboardingNavigator onComplete={finishOnboarding} />
          )}
        </NavigationContainer>

        <StatusBar style="auto" />
        <Toast />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={BottomTabNavigator}
      />

      <Stack.Screen
        name="CreateSurgery"
        component={CreateSurgeryScreen}
      />

      <Stack.Screen
        name="SurgeryDetail"
        component={SurgeryDetailScreen}
      />

      <Stack.Screen
        name="UpdateStatus"
        component={UpdateStatusScreen}
      />

      <Stack.Screen
        name="Scan"
        component={ScanScreen}
      />

      <Stack.Screen
        name="ChatBot"
        component={ChatBotScreen}
      />
    </Stack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="RoleSelection"
        component={RoleSelectionScreen}
      />

      <Stack.Screen
        name="StaffRoleSelection"
        component={StaffRoleSelectionScreen}
      />

      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />
    </Stack.Navigator>
  );
}

function OnboardingNavigator({
  onComplete,
}: {
  onComplete: () => Promise<void>;
}) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Onboarding1">
        {(props) => (
          <OnboardingScreen1
            {...props}
            onFinish={onComplete}
          />
        )}
      </Stack.Screen>
AA
      <Stack.Screen name="Onboarding2">
        {(props) => (
          <OnboardingScreen2
            {...props}
            onFinish={onComplete}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Onboarding3">
        {(props) => (
          <OnboardingScreen3
            {...props}
            onFinish={onComplete}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = {
  bootContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F7',
  },
};