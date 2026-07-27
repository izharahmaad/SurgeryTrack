import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '@/constants';

export default function OnboardingScreen2() {
  const navigation = useNavigation<any>();

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Onboarding3');
  };

  const handleSkip = () => {
    Haptics.selectionAsync();
    navigation.navigate('RoleSelection');
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backCircle, pressed && { opacity: 0.6 }]}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={handleSkip} style={({ pressed }) => [styles.skipPill, pressed && { opacity: 0.6 }]}>
          <Text style={styles.skipText}>Skip</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.iconRing}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.iconGradientBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={60} color={COLORS.surface} />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Scan & Track</Text>
        <Text style={styles.subtitle}>QR Code Access</Text>
        <Text style={styles.description}>
          Family members can scan a QR code to get real-time updates about surgery progress without needing an account.
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonLabel}>Next</Text>
            <View style={styles.arrowCircle}>
              <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.primary} />
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 },
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
  skipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skipText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  iconRing: {
    width: 152,
    height: 152,
    borderRadius: 76,
    marginBottom: 40,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  iconGradientBg: {
    width: 152,
    height: 152,
    borderRadius: 76,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 40, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { fontSize: 17, fontFamily: FONTS.semiBold, color: COLORS.primary, marginBottom: 20 },
  description: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 8,
  },
  bottomSection: { paddingHorizontal: 32, paddingBottom: 32 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { width: 24, backgroundColor: COLORS.primary },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonLabel: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.surface, marginRight: 12 },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});