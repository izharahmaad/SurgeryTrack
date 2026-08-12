import React, { useState } from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, FONTS } from '../../constants';

type Props = {
  onBack: () => void;
  onFinish: () => void | Promise<void>;
};

export default function OnboardingScreen3({
  onBack,
  onFinish,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await onFinish();
    } catch (error) {
      console.error(
        'Failed to complete onboarding:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroCircle}>
          <LinearGradient
            colors={[
              COLORS.success,
              '#66BB6A',
            ]}
            style={styles.gradient}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={76}
              color={COLORS.surface}
            />
          </LinearGradient>
        </View>

        <Text style={styles.title}>
          Ready to Begin?
        </Text>

        <Text style={styles.subtitle}>
          Your surgery information is organized in
          one secure and simple experience.
        </Text>

        <View style={styles.securityCard}>
          <MaterialCommunityIcons
            name="lock-check-outline"
            size={24}
            color={COLORS.success}
          />

          <Text style={styles.securityText}>
            Use SurgeryTrack responsibly and always
            follow guidance from qualified healthcare
            professionals.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />

          <View
            style={[
              styles.dot,
              styles.activeDot,
            ]}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color={
                loading
                  ? COLORS.textMuted
                  : COLORS.primary
              }
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
              <ActivityIndicator
                color={COLORS.surface}
              />
            ) : (
              <>
                <Text style={styles.buttonText}>
                  Get Started
                </Text>

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

  heroCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    padding: 6,
    marginBottom: 34,
  },

  gradient: {
    flex: 1,
    borderRadius: 82,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 23,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  securityCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    padding: 16,
    borderRadius: 18,
    backgroundColor: `${COLORS.success}18`,
  },

  securityText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },

  footer: {
    padding: 24,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  dot: {
    width: 8,
    height: 8,
    marginHorizontal: 4,
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
    borderRadius: 18,
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
    borderRadius: 18,
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