import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS, FONTS } from '../../constants';

export default function AboutScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={18}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>About SurgeryTrack</Text>

          <View style={styles.headerActionPlaceholder} />
        </View>

        {/* App info card */}
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons
                name="hospital-box"
                size={32}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.appName}>SurgeryTrack</Text>
            <Text style={styles.tagline}>Smart surgery management for hospitals</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>iOS & Android</Text>
          </View>

          <View style={styles.descriptionWrap}>
            <Text style={styles.description}>
              SurgeryTrack is a role-based surgery management app that connects hospital staff,
              doctors, nurses, receptionists, administrators, and family users around surgery
              scheduling, operating-room status, surgery details, notifications, QR-code access,
              and general medical information.
            </Text>
          </View>
        </View>

        {/* Features */}
        <Text style={styles.sectionTitle}>Key Features</Text>
        <View style={styles.card}>
          <FeatureRow
            icon="calendar-check"
            text="Schedule and track surgeries in real time"
          />
          <FeatureRow
            icon="view-grid-outline"
            text="Live dashboard with active, scheduled, and completed cases"
          />
          <FeatureRow
            icon="qrcode-scan"
            text="Secure QR-code access for family members"
          />
          <FeatureRow
            icon="bell-outline"
            text="Role-aware notifications and alerts"
          />
          <FeatureRow
            icon="shield-check"
            text="Firestore security rules for strict access control"
          />
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} SurgeryTrack. All rights reserved.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <MaterialCommunityIcons name={icon as any} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    padding: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  headerActionPlaceholder: {
    width: 34,
    height: 34,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 16,
  },

  logoWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },

  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  appName: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  tagline: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },

  infoLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },

  infoValue: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },

  descriptionWrap: {
    marginTop: 12,
  },

  description: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },

  sectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },

  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  featureText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },

  footerText: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 8,
  },
});