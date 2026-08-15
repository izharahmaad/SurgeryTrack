import './src/services/firebase';
import './src/utils/setupText';

import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  View,
} from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

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

void SplashScreen.preventAutoHideAsync();

const ONBOARDING_COMPLETED_KEY =
  '@surgerytrack/onboarding_completed';

type RootStackParamList = {
  Dashboard: undefined;
  CreateSurgery: undefined;
  SurgeryDetail: {
    surgeryId: string;
  };
  UpdateStatus: {
    surgeryId?: string;
  };
  Scan: undefined;
  ChatBot: undefined;
};

type AuthStackParamList = {
  RoleSelection: undefined;
  StaffRoleSelection: undefined;
  Login: undefined;
};

type OnboardingStackParamList = {
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
};

type StartupRoute =
  | 'onboarding'
  | 'auth'
  | 'main';

const MainStack =
  createNativeStackNavigator<RootStackParamList>();

const AuthStack =
  createNativeStackNavigator<AuthStackParamList>();

const OnboardingStack =
  createNativeStackNavigator<OnboardingStackParamList>();

export default function App() {
  const initAuth = useAuthStore(
    (state) => state.initAuth
  );

  const user = useAuthStore(
    (state) => state.user
  );

  const isLoading = useAuthStore(
    (state) => state.isLoading
  );

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const [showCustomSplash, setShowCustomSplash] =
    useState(true);

  const [onboardingLoaded, setOnboardingLoaded] =
    useState(false);

  const [onboardingCompleted, setOnboardingCompleted] =
    useState(false);

  const [bootstrapFinished, setBootstrapFinished] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const bootstrapApp = async () => {
      console.log('[App] bootstrap started');

      try {
        console.log('[App] calling initAuth');

        await initAuth();

        console.log('[App] initAuth finished');

        const completed = await AsyncStorage.getItem(
          ONBOARDING_COMPLETED_KEY
        );

        console.log(
          '[App] onboarding value:',
          completed
        );

        if (!mounted) {
          return;
        }

        setOnboardingCompleted(completed === 'true');
        setOnboardingLoaded(true);
        setBootstrapFinished(true);

        console.log('[App] bootstrap finished');
      } catch (error) {
        console.error(
          '[App] bootstrap error:',
          error
        );

        if (!mounted) {
          return;
        }

        setOnboardingCompleted(false);
        setOnboardingLoaded(true);
        setBootstrapFinished(true);
      }
    };

    void bootstrapApp();

    return () => {
      mounted = false;
    };
  }, [initAuth]);

  const hideNativeSplash = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
    } catch (error) {
      console.warn(
        '[App] failed to hide native splash:',
        error
      );
    }
  }, []);

  useEffect(() => {
    if (
      fontsLoaded &&
      !isLoading &&
      onboardingLoaded &&
      bootstrapFinished
    ) {
      void hideNativeSplash();
    }
  }, [
    fontsLoaded,
    isLoading,
    onboardingLoaded,
    bootstrapFinished,
    hideNativeSplash,
  ]);

  const finishOnboarding = async (): Promise<void> => {
    await AsyncStorage.setItem(
      ONBOARDING_COMPLETED_KEY,
      'true'
    );

    setOnboardingCompleted(true);
  };

  if (
    !fontsLoaded ||
    isLoading ||
    !onboardingLoaded ||
    !bootstrapFinished
  ) {
    return (
      <View style={styles.bootContainer}>
        <ActivityIndicator
          size="large"
          color="#F06292"
        />

        <StatusBar style="auto" />
      </View>
    );
  }

  if (showCustomSplash) {
    return (
      <View style={styles.bootContainer}>
        <AnimatedSplash
          onFinish={() => {
            console.log(
              '[App] AnimatedSplash finished'
            );

            setShowCustomSplash(false);
          }}
        />

        <StatusBar style="auto" />
      </View>
    );
  }

  const startupRoute: StartupRoute = user
    ? 'main'
    : onboardingCompleted
      ? 'auth'
      : 'onboarding';

  console.log(
    '[App] rendering route:',
    startupRoute
  );

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
            <OnboardingNavigator
              onComplete={finishOnboarding}
            />
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
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <MainStack.Screen
        name="Dashboard"
        component={BottomTabNavigator}
      />

      <MainStack.Screen
        name="CreateSurgery"
        component={CreateSurgeryScreen}
      />

      <MainStack.Screen
        name="SurgeryDetail"
        component={SurgeryDetailScreen}
      />

      <MainStack.Screen
        name="UpdateStatus"
        component={UpdateStatusScreen}
      />

      <MainStack.Screen
        name="Scan"
        component={ScanScreen}
      />

      <MainStack.Screen
        name="ChatBot"
        component={ChatBotScreen}
      />
    </MainStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen
        name="RoleSelection"
        component={RoleSelectionScreen}
      />

      <AuthStack.Screen
        name="StaffRoleSelection"
        component={StaffRoleSelectionScreen}
      />

      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
      />
    </AuthStack.Navigator>
  );
}

function OnboardingNavigator({
  onComplete,
}: {
  onComplete: () => Promise<void>;
}) {
  return (
    <OnboardingStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <OnboardingStack.Screen name="Onboarding1">
        {({ navigation }) => (
          <OnboardingScreen1
            onNext={() => {
              navigation.navigate('Onboarding2');
            }}
          />
        )}
      </OnboardingStack.Screen>

      <OnboardingStack.Screen name="Onboarding2">
        {({ navigation }) => (
          <OnboardingScreen2
            onBack={() => {
              navigation.goBack();
            }}
            onNext={() => {
              navigation.navigate('Onboarding3');
            }}
          />
        )}
      </OnboardingStack.Screen>

      <OnboardingStack.Screen name="Onboarding3">
        {({ navigation }) => (
          <OnboardingScreen3
            onBack={() => {
              navigation.goBack();
            }}
            onFinish={onComplete}
          />
        )}
      </OnboardingStack.Screen>
    </OnboardingStack.Navigator>
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