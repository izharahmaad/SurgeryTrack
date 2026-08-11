import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../../constants';

type Props = {
  onBack: () => void;
  onFinish: () => Promise<void>;
};

export default function OnboardingScreen3({ onBack, onFinish }: Props) {
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async () => {
    if (loading) return;

    setLoading(true);

    try {
      await onFinish();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroCircle}>
          <LinearGradient
            colors={[COLORS.success, '#66BB6A']}
            style={styles.gradient}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={76}
              color={COLORS.surface}
            />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Ready to Begin?</Text>
        <Text style={styles.subtitle}>
          Your surgery information is organized in one secure and simple
          experience.
        </Text>

        <View style={styles.securityCard}>
          <MaterialCommunityIcons
            name="lock-check-outline"
            size={24}
            color={COLORS.success}
          />
          <Text style={styles.securityText}>
            Use SurgeryTrack responsibly and always follow guidance from
            qualified healthcare professionals.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            disabled={loading}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleGetStarted}
            disabled={loading}
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
  container: { flex: 1, backgroundColor: COLORS.background },
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
    fontSize: 15,
    lineHeight: 23,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    backgroundColor: COLORS.successLight,
    borderRadius: 18,
    padding: 16,
    marginTop: 28,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  footer: { padding: 24 },
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    width: 56,
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
    backgroundColor: COLORS.primary,
    borderRadius: 18,
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});