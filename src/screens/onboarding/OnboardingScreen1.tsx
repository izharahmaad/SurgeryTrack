import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, FONTS } from '../../constants';

type Props = {
  onNext: () => void;
};

export default function OnboardingScreen1({
  onNext,
}: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroCircle}>
          <LinearGradient
            colors={[
              COLORS.primary,
              COLORS.secondary,
            ]}
            style={styles.gradient}
          >
            <MaterialCommunityIcons
              name="hospital-building"
              size={76}
              color={COLORS.surface}
            />
          </LinearGradient>
        </View>

        <Text style={styles.title}>
          Track Every Surgery
        </Text>

        <Text style={styles.subtitle}>
          SurgeryTrack helps hospitals and families
          follow surgery progress with clear,
          real-time updates.
        </Text>

        <View style={styles.featureRow}>
          <MaterialCommunityIcons
            name="check-circle"
            size={22}
            color={COLORS.success}
          />

          <Text style={styles.featureText}>
            Live surgery status updates
          </Text>
        </View>

        <View style={styles.featureRow}>
          <MaterialCommunityIcons
            name="check-circle"
            size={22}
            color={COLORS.success}
          />

          <Text style={styles.featureText}>
            Simple communication for families
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          <View
            style={[
              styles.dot,
              styles.activeDot,
            ]}
          />

          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={onNext}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Continue to the next onboarding screen"
        >
          <Text style={styles.buttonText}>
            Continue
          </Text>

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

  featureRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 10,
  },

  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },

  footer: {
    padding: 24,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
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
    borderRadius: 18,
    paddingVertical: 17,
  },

  buttonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});