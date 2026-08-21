import React, { useState } from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { COLORS, FONTS } from '../../constants';

type Props = {
  onBack: () => void;
  onFinish: () => void | Promise<void>;
};

export default function OnboardingScreen3({ onBack, onFinish }: Props) {
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (loading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onBack();
  };

  const handleGetStarted = async () => {
    if (loading) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    try {
      await onFinish();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Hero Icon */}
        <View style={styles.heroWrapper}>
          <View style={styles.heroGlowOuter}>
            <LinearGradient
              colors={[COLORS.success, '#66BB6A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={64}
                color={COLORS.surface}
              />
            </LinearGradient>
          </View>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.title}>Ready to Begin?</Text>

        <Text style={styles.subtitle}>
          Your surgery information is organized in
          one secure and simple experience.
        </Text>

        {/* Security Card */}
        <View style={styles.securityCard}>
          <View style={styles.securityIconCircle}>
            <MaterialCommunityIcons
              name="lock-check-outline"
              size={20}
              color={COLORS.success}
            />
          </View>

          <Text style={styles.securityText}>
            Use SurgeryTrack responsibly and always
            follow guidance from qualified healthcare
            professionals.
          </Text>
        </View>
      </View>

      {/* Footer with Dots & Buttons */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color={loading ? COLORS.textMuted : COLORS.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.disabledButton,
            ]}
            onPress={handleGetStarted}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Finish onboarding"
          >
            {loading ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <>
                <Text style={styles.buttonText}>Get Started</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color={COLORS.surface}
                />
              </>
            )}
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
    backgroundColor: `${COLORS.success}22`,
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

  // Security Card
  securityCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
    padding: 14,
    borderRadius: 16,
    backgroundColor: `${COLORS.success}14`,
    borderWidth: 1,
    borderColor: `${COLORS.success}22`,
  },

  securityIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.success}18`,
    justifyContent: 'center',
    alignItems: 'center',
  },

  securityText: {
    flex: 1,
    marginLeft: 12,
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
    minHeight: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },

  disabledButton: {
    opacity: 0.7,
  },

  buttonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});