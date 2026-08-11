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
  onBack: () => void;
  onNext: () => void;
};

export default function OnboardingScreen2({ onBack, onNext }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroCircle}>
          <LinearGradient
            colors={[COLORS.info, '#64B5F6']}
            style={styles.gradient}
          >
            <MaterialCommunityIcons
              name="bell-ring-outline"
              size={76}
              color={COLORS.surface}
            />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Stay Informed</Text>
        <Text style={styles.subtitle}>
          Receive important updates when a surgery moves from preparation to
          operation, recovery, or completion.
        </Text>

        <View style={styles.infoCard}>
          <MaterialCommunityIcons
            name="clock-check-outline"
            size={28}
            color={COLORS.primary}
          />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Real-time updates</Text>
            <Text style={styles.infoBody}>
              See the latest available surgery status without repeatedly
              calling the hospital.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={onNext}>
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    marginTop: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoText: { flex: 1 },
  infoTitle: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  infoBody: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
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