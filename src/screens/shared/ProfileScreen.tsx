import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
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
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

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
      'Logout',
      'Are you sure you want to logout from SurgeryTrack?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
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

  const profileItems = [
    {
      icon: 'account-edit-outline',
      label: 'Edit Profile',
      subtitle: 'Update your name and account details',
      onPress: () => handleComingSoon('Edit Profile'),
    },
    {
      icon: 'bell-outline',
      label: 'Notifications',
      subtitle: 'Manage surgery and reminder alerts',
      onPress: () => navigation.navigate('Notifications'),
    },
  ];

  const supportItems = [
    {
      icon: 'shield-check-outline',
      label: 'Privacy Policy',
      subtitle: 'How your data is protected',
      onPress: () => handleComingSoon('Privacy Policy'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => handleComingSoon('Help & Support'),
    },
    {
      icon: 'information-outline',
      label: 'About SurgeryTrack',
      subtitle: 'App version and information',
      onPress: () => handleComingSoon('About SurgeryTrack'),
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
            size={22}
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
          size={22}
          color={COLORS.textMuted}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => handleComingSoon('Settings')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={22}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

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

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionCard}>
          {profileItems.map((item, index) =>
            renderMenuItem(item, index, profileItems.length)
          )}
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.sectionCard}>
          {renderMenuItem(
            {
              icon: 'theme-light-dark',
              label: 'Dark Mode',
              subtitle: 'Switch app appearance',
              rightNode: (
                <Switch
                  value={darkModeEnabled}
                  onValueChange={(value) => {
                    setDarkModeEnabled(value);
                    Haptics.selectionAsync();
                    Toast.show({
                      type: 'info',
                      text1: 'Dark Mode',
                      text2: 'Theme integration can be connected next',
                    });
                  }}
                  trackColor={{
                    false: COLORS.border,
                    true: COLORS.primaryLight,
                  }}
                  thumbColor={darkModeEnabled ? COLORS.primary : COLORS.surface}
                />
              ),
            },
            0,
            2
          )}

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
                  }}
                  trackColor={{
                    false: COLORS.border,
                    true: COLORS.primaryLight,
                  }}
                  thumbColor={notificationsEnabled ? COLORS.primary : COLORS.surface}
                />
              ),
            },
            1,
            2
          )}
        </View>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.sectionCard}>
          {supportItems.map((item, index) =>
            renderMenuItem(item, index, supportItems.length)
          )}
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.9}
          style={styles.logoutBtn}
        >
          <MaterialCommunityIcons
            name="logout"
            size={20}
            color={COLORS.error}
          />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>SurgeryTrack v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 22,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  name: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  email: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 14,
    backgroundColor: `${COLORS.primaryLight}`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    backgroundColor: COLORS.background,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  statValue: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: COLORS.border,
  },

  sectionTitle: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
    overflow: 'hidden',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  menuSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    backgroundColor: COLORS.errorLight,
    borderRadius: 18,
    paddingVertical: 17,
    borderWidth: 1,
    borderColor: `${COLORS.error}40`,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.error,
  },

  versionText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
});