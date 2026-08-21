import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { COLORS, FONTS } from '../../constants';

type Props = {
  onBack: () => void;
  onNext: () => void;
};

export default function OnboardingScreen2({ onBack, onNext }: Props) {
  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onBack();
  };

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
              colors={[COLORS.info, '#64B5F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <MaterialCommunityIcons
                name="bell-ring-outline"
                size={64}
                color={COLORS.surface}
              />
            </LinearGradient>
          </View>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.title}>Stay Informed</Text>

        <Text style={styles.subtitle}>
          Receive important updates when a surgery
          moves from preparation to operation,
          recovery, or completion.
        </Text>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconCircle}>
            <MaterialCommunityIcons
              name="clock-check-outline"
              size={22}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Real-time updates</Text>
            <Text style={styles.infoBody}>
              See the latest available surgery status
              without repeatedly calling the hospital.
            </Text>
          </View>
        </View>
      </View>

      {/* Footer with Dots & Buttons */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>

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
    backgroundColor: `${COLORS.info}22`,
  },

  heroGradient: {
    flex: 1,
    borderRadius: 73,
    justifyContent: 'center',
    alignItems: 'center',
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

  // Info Card
  infoCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoText: {
    flex: 1,
    marginLeft: 12,
  },

  infoTitle: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },

  infoBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
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

  buttonRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  backButton: {
    width: 56,
    marginRight: 12,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },

  buttonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});