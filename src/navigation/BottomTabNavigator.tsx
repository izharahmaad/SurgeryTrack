import React, {
  useEffect,
  useMemo,
} from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import * as Haptics from 'expo-haptics';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {
  COLORS,
  FONTS,
} from '../constants';

import DashboardScreen from '../screens/hospital/DashboardScreen';
import AllSurgeriesScreen from '../screens/hospital/AllSurgeriesScreen';
import CalendarScreen from '../screens/shared/CalendarScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import ScanScreen from '../screens/family/ScanScreen';

import {
  useAuthStore,
} from '../hooks/useAuthStore';

export type RootTabParamList = {
  Scan: undefined;
  DashboardTab: undefined;
  AllSurgeries: undefined;
  Calendar: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Tab =
  createBottomTabNavigator<RootTabParamList>();

type TabConfig = {
  name: keyof RootTabParamList;
  icon: string;
  activeIcon: string;
  label: string;
};

type TabIconProps = {
  focused: boolean;
  iconName: string;
  activeIconName: string;
  label: string;
};

function TabIcon({
  focused,
  iconName,
  activeIconName,
  label,
}: TabIconProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(
      focused ? 1.12 : 1,
      {
        damping: 12,
        stiffness: 180,
      }
    );
  }, [focused, scale]);

  const animatedStyle =
    useAnimatedStyle(() => ({
      transform: [
        {
          scale: scale.value,
        },
      ],
    }));

  return (
    <View style={styles.tabIconWrap}>
      <Animated.View
        style={[
          styles.iconCircle,
          focused &&
            styles.iconCircleActive,
          animatedStyle,
        ]}
      >
        <MaterialCommunityIcons
          name={
            (focused
              ? activeIconName
              : iconName) as any
          }
          size={22}
          color={
            focused
              ? COLORS.surface
              : COLORS.textMuted
          }
        />
      </Animated.View>

      <Text
        style={[
          styles.tabLabel,
          focused &&
            styles.tabLabelActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function CustomTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const user = useAuthStore(
    (store) => store.user
  );

  const isFamily =
    user?.role?.toLowerCase() === 'family';

  const tabConfig = useMemo<TabConfig[]>(
    () => {
      if (isFamily) {
        return [
          {
            name: 'Scan',
            icon: 'qrcode-scan',
            activeIcon: 'qrcode-scan',
            label: 'Scan',
          },
          {
            name: 'DashboardTab',
            icon: 'view-dashboard-outline',
            activeIcon: 'view-dashboard',
            label: 'Home',
          },
          {
            name: 'Calendar',
            icon: 'calendar-blank-outline',
            activeIcon: 'calendar',
            label: 'Calendar',
          },
          {
            name: 'Notifications',
            icon: 'bell-outline',
            activeIcon: 'bell',
            label: 'Alerts',
          },
          {
            name: 'Profile',
            icon: 'account-outline',
            activeIcon: 'account',
            label: 'Profile',
          },
        ];
      }

      return [
        {
          name: 'DashboardTab',
          icon: 'view-dashboard-outline',
          activeIcon: 'view-dashboard',
          label: 'Home',
        },
        {
          name: 'AllSurgeries',
          icon: 'heart-pulse',
          activeIcon: 'heart-pulse',
          label: 'Surgeries',
        },
        {
          name: 'Calendar',
          icon: 'calendar-blank-outline',
          activeIcon: 'calendar',
          label: 'Calendar',
        },
        {
          name: 'Notifications',
          icon: 'bell-outline',
          activeIcon: 'bell',
          label: 'Alerts',
        },
        {
          name: 'Profile',
          icon: 'account-outline',
          activeIcon: 'account',
          label: 'Profile',
        },
      ];
    },
    [isFamily]
  );

  return (
    <View
      style={styles.tabBarContainer}
      accessibilityRole="tablist"
    >
      <View style={styles.tabBar}>
        {state.routes.map(
          (route, index) => {
            const config =
              tabConfig.find(
                (item) =>
                  item.name === route.name
              );

            if (!config) {
              return null;
            }

            const isFocused =
              state.index === index;

            const onPress = () => {
              Haptics.selectionAsync();

              const event =
                navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

              if (
                !isFocused &&
                !event.defaultPrevented
              ) {
                navigation.navigate(
                  route.name as never
                );
              }
            };

            const onLongPress = () => {
              Haptics.selectionAsync();

              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.85}
                style={styles.tabItem}
                accessibilityRole="tab"
                accessibilityLabel={
                  `${config.label} tab`
                }
                accessibilityState={{
                  selected: isFocused,
                }}
              >
                <TabIcon
                  focused={isFocused}
                  iconName={config.icon}
                  activeIconName={
                    config.activeIcon
                  }
                  label={config.label}
                />
              </TouchableOpacity>
            );
          }
        )}
      </View>
    </View>
  );
}

export default function BottomTabNavigator() {
  const user = useAuthStore(
    (store) => store.user
  );

  const isFamily =
    user?.role?.toLowerCase() === 'family';

  return (
    <Tab.Navigator
      key={
        isFamily
          ? 'family-tabs'
          : 'hospital-tabs'
      }
      initialRouteName={
        isFamily
          ? 'Scan'
          : 'DashboardTab'
      }
      screenOptions={{
        headerShown: false,
        lazy: true,
      }}
      tabBar={(props) => (
        <CustomTabBar {...props} />
      )}
    >
      {isFamily ? (
        <>
          <Tab.Screen
            name="Scan"
            component={ScanScreen}
            options={{
              title: 'Scan',
            }}
          />

          <Tab.Screen
            name="DashboardTab"
            component={DashboardScreen}
            options={{
              title: 'Home',
            }}
          />
        </>
      ) : (
        <>
          <Tab.Screen
            name="DashboardTab"
            component={DashboardScreen}
            options={{
              title: 'Home',
            }}
          />

          <Tab.Screen
            name="AllSurgeries"
            component={AllSurgeriesScreen}
            options={{
              title: 'Surgeries',
            }}
          />
        </>
      )}

      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: 'Calendar',
        }}
      />

      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Alerts',
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },

  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },

  tabItem: {
    flex: 1,
    minHeight: 64,
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
    alignItems: 'center',
    justifyContent: 'center',
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