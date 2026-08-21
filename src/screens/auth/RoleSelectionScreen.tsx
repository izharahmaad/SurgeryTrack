import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { COLORS, FONTS } from '@/constants';

export default function RoleSelectionScreen() {
  const navigation = useNavigation<any>();

  const handleSelect = (destination: string, params?: object) => {
    Haptics.selectionAsync();
    navigation.navigate(destination, params);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        {/* Logo */}
        <View style={styles.logoRing}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons
              name="shield-plus"
              size={40}
              color={COLORS.surface}
            />
          </LinearGradient>
        </View>

        <Text style={styles.brand}>SurgeryTrack</Text>
        <Text style={styles.tagline}>How will you be using the app?</Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <Pressable
            onPress={() =>
              handleSelect('Login', { role: 'family', mode: 'signup' })
            }
            style={({ pressed }) => [
              styles.optionCard,
              pressed && styles.optionCardPressed,
            ]}
          >
            <View style={styles.iconCircle}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.iconCircleGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons
                  name="account-heart"
                  size={26}
                  color={COLORS.surface}
                />
              </LinearGradient>
            </View>

            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Family Member</Text>
              <Text style={styles.optionSubtitle}>
                Track a loved one's surgery in real time
              </Text>
            </View>

            <View style={styles.chevronCircle}>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={COLORS.textMuted}
              />
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleSelect('StaffRoleSelection')}
            style={({ pressed }) => [
              styles.optionCard,
              pressed && styles.optionCardPressed,
            ]}
          >
            <View style={styles.iconCircle}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.iconCircleGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons
                  name="hospital-building"
                  size={26}
                  color={COLORS.surface}
                />
              </LinearGradient>
            </View>

            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Hospital Staff</Text>
              <Text style={styles.optionSubtitle}>
                Manage surgeries and patient updates
              </Text>
            </View>

            <View style={styles.chevronCircle}>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={COLORS.textMuted}
              />
            </View>
          </Pressable>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => handleSelect('Login', { mode: 'signin' })}
          style={styles.signinButton}
        >
          <Text style={styles.signinText}>
            Already have an account?{' '}
            <Text style={styles.signinBold}>Sign In</Text>
          </Text>
        </Pressable>

        <View style={styles.legalRow}>
          <Text style={styles.legalText}>
            By continuing, you agree to our{' '}
            <Text style={styles.legalLink}>Terms</Text> &{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Logo
  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },

  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  brand: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },

  tagline: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: 40,
    textAlign: 'center',
    maxWidth: 280,
  },

  // Options
  optionsContainer: {
    width: '100%',
    gap: 14,
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  optionCardPressed: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },

  iconCircle: {
    marginRight: 16,
  },

  iconCircleGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  optionInfo: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 4,
  },

  optionSubtitle: {
    fontSize: 12.5,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    lineHeight: 17,
  },

  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Footer
  footer: {
    paddingBottom: 24,
    alignItems: 'center',
    gap: 12,
  },

  signinButton: {
    paddingVertical: 8,
  },

  signinText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },

  signinBold: {
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  legalRow: {
    paddingHorizontal: 20,
  },

  legalText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },

  legalLink: {
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
});