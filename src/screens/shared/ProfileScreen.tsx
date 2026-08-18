import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS } from '../../constants';
import { useAuthStore } from '../../hooks/useAuthStore';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const initials = useMemo(() => {
    const name = user?.displayName?.trim() || 'User';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }, [user?.displayName]);

  const roleLabel = useMemo(() => {
    return (user?.role || 'user').replace(/_/g, ' ').toUpperCase();
  }, [user?.role]);

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out from SurgeryTrack?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await logout();
              Toast.show({ type: 'success', text1: 'Logged out successfully' });
              navigation.navigate('Login');
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Toast.show({ type: 'error', text1: 'Logout failed' });
            }
          },
        },
      ]
    );
  };

  const handleComingSoon = (label: string) => {
    Haptics.selectionAsync();
    Toast.show({
      type: 'info',
      text1: label,
      text2: 'This feature is coming soon',
    });
  };

  const openUrl = async (url: string, label: string) => {
    Haptics.selectionAsync();
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Toast.show({
        type: 'info',
        text1: label,
        text2: 'No content available yet',
      });
    }
  };

  const profileItems = [
    {
      icon: 'account-edit-outline',
      label: 'Edit Profile',
      subtitle: 'Update your name and account details',
      onPress: () => {
        Haptics.selectionAsync();
        // If you have an EditProfile screen:
        // navigation.navigate('EditProfile');
        handleComingSoon('Edit Profile');
      },
    },
    {
      icon: 'bell-outline',
      label: 'Notifications',
      subtitle: 'Manage surgery and reminder alerts',
      onPress: () => {
        Haptics.selectionAsync();
        navigation.navigate('Notifications');
      },
    },
  ];

  const supportItems = [
    {
      icon: 'shield-check-outline',
      label: 'Privacy Policy',
      subtitle: 'How your data is protected',
      onPress: () =>
        openUrl(
          'https://example.com/privacy',
          'Privacy Policy'
        ),
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () =>
        openUrl(
          'https://example.com/support',
          'Help & Support'
        ),
    },
    {
      icon: 'information-outline',
      label: 'About SurgeryTrack',
      subtitle: 'App version and information',
      onPress: () => {
        Haptics.selectionAsync();
        navigation.navigate('About');
      },
    },
  ];

  const renderMenuItem = (
    item: {
      icon: string;
      label: string;
      subtitle: string;
      onPress?: () => void;
      rightNode?: React.ReactNode;
    },
    index: number,
    total: number
  ) => (
    <TouchableOpacity
      key={index}
      onPress={item.onPress}
      activeOpacity={0.85}
      style={[
        styles.menuItem,
        index !== total - 1 && styles.menuItemBorder,
      ]}
      disabled={!item.onPress}
    >
      <View style={styles.menuLeft}>
        <View style={styles.menuIcon}>
          <MaterialCommunityIcons
            name={item.icon as any}
            size={20}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.menuTextWrap}>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
        </View>
      </View>

      {item.rightNode ?? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={COLORS.textMuted}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Scrollable content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={18}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Profile</Text>

          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => handleComingSoon('Settings')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={20}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.name}>{user?.displayName || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>

          <View style={styles.roleBadge}>
            <MaterialCommunityIcons
              name="shield-account-outline"
              size={14}
              color={COLORS.primary}
            />
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>

          <View style={styles.quickStats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Account</Text>
              <Text style={styles.statValue}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Access</Text>
              <Text style={styles.statValue}>{user?.role || 'user'}</Text>
            </View>
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionCard}>
          {profileItems.map((item, index) =>
            renderMenuItem(item, index, profileItems.length)
          )}
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.sectionCard}>
          {renderMenuItem(
            {
              icon: 'bell-badge-outline',
              label: 'Push Notifications',
              subtitle: 'Receive surgery alerts and reminders',
              rightNode: (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(value) => {
                    setNotificationsEnabled(value);
                    Haptics.selectionAsync();
                    Toast.show({
                      type: value ? 'success' : 'info',
                      text1: value ? 'Notifications enabled' : 'Notifications disabled',
                    });
                  }}
                  trackColor={{
                    false: COLORS.border,
                    true: COLORS.primaryLight,
                  }}
                  thumbColor={notificationsEnabled ? COLORS.primary : COLORS.surface}
                />
              ),
            },
            0,
            1
          )}
        </View>

        {/* Support */}
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.sectionCard}>
          {supportItems.map((item, index) =>
            renderMenuItem(item, index, supportItems.length)
          )}
        </View>

        {/* Bottom spacer so content doesn't overlap logout */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Fixed circular logout button at bottom */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.9}
          style={styles.logoutButton}
        >
          <MaterialCommunityIcons
            name="logout"
            size={22}
            color={COLORS.error}
          />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    padding: 16,
    // No paddingBottom here; we use a spacer + fixed logout bar
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  headerAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Profile card
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatarText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },

  name: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  email: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  roleBadge: {
    marginTop: 12,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  roleText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statBox: {
    flex: 1,
    alignItems: 'center',
  },

  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  statValue: {
    marginTop: 3,
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textTransform: 'capitalize',
  },

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },

  // Sections
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },

  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    overflow: 'hidden',
  },

  // Menu items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },

  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },

  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },

  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  menuTextWrap: {
    flex: 1,
  },

  menuLabel: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },

  menuSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  // Fixed logout bar at bottom
  logoutContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: `${COLORS.error}10`,
    borderRadius: 999,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: `${COLORS.error}30`,
  },

  logoutText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.error,
  },
});