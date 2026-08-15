import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { COLORS, FONTS } from '../constants';

import DashboardScreen from '../screens/hospital/DashboardScreen';
import AllSurgeriesScreen from '../screens/hospital/AllSurgeriesScreen';
import CalendarScreen from '../screens/shared/CalendarScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();

interface TabConfig {
  name: string;
  icon: string;
  activeIcon: string;
  label: string;
}

const TAB_CONFIG: TabConfig[] = [
  { name: 'DashboardTab', icon: 'view-dashboard-outline', activeIcon: 'view-dashboard', label: 'Home' },
  { name: 'AllSurgeries', icon: 'heart-pulse', activeIcon: 'heart-pulse', label: 'Surgeries' },
  { name: 'Calendar', icon: 'calendar-blank-outline', activeIcon: 'calendar', label: 'Calendar' },
  { name: 'Notifications', icon: 'bell-outline', activeIcon: 'bell', label: 'Alerts' },
  { name: 'Profile', icon: 'account-outline', activeIcon: 'account', label: 'Profile' },
];

interface TabIconProps {
  focused: boolean;
  iconName: string;
  activeIconName: string;
  label: string;
}

function TabIcon({ focused, iconName, activeIconName, label }: TabIconProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.12 : 1, { damping: 12, stiffness: 180 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.tabIconWrap}>
      <Animated.View style={[styles.iconCircle, focused && styles.iconCircleActive, animatedStyle]}>
        <MaterialCommunityIcons
          name={(focused ? activeIconName : iconName) as any}
          size={22}
          color={focused ? COLORS.surface : COLORS.textMuted}
        />
      </Animated.View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG.find((t) => t.name === route.name);
          if (!config) return null;

          const onPress = () => {
            Haptics.selectionAsync();
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.85} style={styles.tabItem}>
              <TabIcon
                focused={isFocused}
                iconName={config.icon}
                activeIconName={config.activeIcon}
                label={config.label}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} />
      <Tab.Screen name="AllSurgeries" component={AllSurgeriesScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 24,
    paddingTop: 10,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrap: {
    alignItems: 'center',
    gap: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleActive: {
    backgroundColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: 10.5,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
});