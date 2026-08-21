import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { COLORS, FONTS } from '../../constants';

type Props = {
  onNext: () => void;
};

export default function OnboardingScreen1({ onNext }: Props) {
  const handleContinue = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onNext();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Hero Icon */}
        <View style={styles.heroWrapper}>
          <View style={styles.heroGlowOuter}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <MaterialCommunityIcons
                name="hospital-building"
                size={64}
                color={COLORS.surface}
              />
            </LinearGradient>
          </View>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.title}>Track Every Surgery</Text>

        <Text style={styles.subtitle}>
          SurgeryTrack helps hospitals and families
          follow surgery progress with clear,
          real-time updates.
        </Text>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureRow}>
            <View style={styles.featureIconCircle}>
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color={COLORS.success}
              />
            </View>
            <Text style={styles.featureText}>
              Live surgery status updates
            </Text>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIconCircle}>
              <MaterialCommunityIcons
                name="account-group"
                size={18}
                color={COLORS.info}
              />
            </View>
            <Text style={styles.featureText}>
              Simple communication for families
            </Text>
          </View>
        </View>
      </View>

      {/* Footer with Dots & Button */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleContinue}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Continue to the next onboarding screen"
        >
          <Text style={styles.buttonText}>Continue</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={COLORS.surface}
          />
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

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  // Hero
  heroWrapper: {
    marginBottom: 28,
  },

  heroGlowOuter: {
    width: 150,
    height: 150,
    borderRadius: 75,
    padding: 3,
    backgroundColor: `${COLORS.primary}22`,
  },

  heroGradient: {
    flex: 1,
    borderRadius: 73,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },

  // Text
  title: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  subtitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },

  // Features
  features: {
    width: '100%',
    marginTop: 26,
    gap: 12,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  featureIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },

  // Footer
  footer: {
    padding: 24,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },

  activeDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },

  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
  },

  buttonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});