import React from 'react';
import { View, StyleSheet, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '@/constants';
import { UserRole } from '@/types';

interface RoleOption {
  id: Exclude<UserRole, 'super_admin' | 'family'>;
  title: string;
  subtitle: string;
  icon: string;
}

const staffRoles: RoleOption[] = [
  { id: 'doctor', title: 'Doctor / Surgeon', subtitle: 'Manage surgeries and patient updates', icon: 'doctor' },
  { id: 'nurse', title: 'Nurse', subtitle: 'Assist in surgery monitoring', icon: 'needle' },
  { id: 'receptionist', title: 'Receptionist', subtitle: 'Schedule and manage appointments', icon: 'desk' },
  { id: 'admin', title: 'Hospital Admin', subtitle: 'Full hospital management access', icon: 'shield-account' },
];

export default function StaffRoleSelectionScreen() {
  const navigation = useNavigation<any>();

  const handleBack = () => {
    Haptics.selectionAsync();
    navigation.goBack();
  };

  const handleSelectRole = (roleId: RoleOption['id']) => {
    Haptics.selectionAsync();
    navigation.navigate('Login', { role: roleId, mode: 'signup' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backCircle, pressed && { opacity: 0.6 }]}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconRing}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="badge-account-horizontal" size={34} color={COLORS.surface} />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Select Your Role</Text>
          <Text style={styles.subtitle}>Choose your position at the hospital</Text>
        </View>

        <View style={styles.rolesContainer}>
          {staffRoles.map((role) => (
            <Pressable
              key={role.id}
              onPress={() => handleSelectRole(role.id)}
              style={({ pressed }) => [styles.roleCard, pressed && styles.roleCardPressed]}
            >
              <View style={styles.iconCircle}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.iconCircleGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialCommunityIcons name={role.icon as any} size={24} color={COLORS.surface} />
                </LinearGradient>
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
              </View>
              <View style={styles.chevronCircle}>
                <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.textMuted} />
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.legalRow}>
          <MaterialCommunityIcons name="shield-check-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.legalText}>
            Staff accounts are verified against hospital records for security
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 24 },
  topRow: { paddingTop: 8, marginBottom: 4 },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  header: { alignItems: 'center', marginTop: 16, marginBottom: 32 },
  iconRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  iconGradient: { width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textMuted, textAlign: 'center' },
  rolesContainer: { gap: 12 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleCardPressed: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  iconCircle: { marginRight: 14 },
  iconCircleGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 15.5, fontFamily: FONTS.semiBold, color: COLORS.text, marginBottom: 3 },
  roleSubtitle: { fontSize: 12.5, fontFamily: FONTS.regular, color: COLORS.textMuted },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 28,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  legalText: { fontSize: 11.5, fontFamily: FONTS.regular, color: COLORS.textMuted, flex: 1, lineHeight: 16 },
});