import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useAuthStore } from '../../hooks/useAuthStore';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      Toast.show({ type: 'success', text1: 'Logged out successfully' });
      navigation.navigate('Login');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Logout failed' });
    }
  };

  const menuItems = [
    { icon: 'account', label: 'Edit Profile', onPress: () => Toast.show({ type: 'info', text1: 'Coming soon' }) },
    { icon: 'bell', label: 'Notifications', onPress: () => navigation.navigate('Notifications' as any) },
    { icon: 'shield-check', label: 'Privacy Policy', onPress: () => Toast.show({ type: 'info', text1: 'Coming soon' }) },
    { icon: 'help-circle', label: 'Help & Support', onPress: () => Toast.show({ type: 'info', text1: 'Coming soon' }) },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.name}>{user?.displayName || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{(user?.role || 'user').toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} onPress={item.onPress} style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <MaterialCommunityIcons name={item.icon as any} size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontFamily: 'Poppins-Bold', color: COLORS.primary },
  profileCard: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 28, margin: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 22, fontFamily: 'Poppins-Bold', color: COLORS.text },
  email: { fontSize: 14, fontFamily: 'Poppins-Regular', color: COLORS.textSecondary, marginTop: 4 },
  roleBadge: { marginTop: 12, backgroundColor: COLORS.primaryLight, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  roleText: { fontSize: 12, fontFamily: 'Poppins-Bold', color: COLORS.primary },
  menu: { marginHorizontal: 20, marginTop: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: 15, fontFamily: 'Poppins-SemiBold', color: COLORS.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 20, marginTop: 24, backgroundColor: COLORS.errorLight, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.error },
  logoutText: { fontSize: 16, fontFamily: 'Poppins-Bold', color: COLORS.error },
});