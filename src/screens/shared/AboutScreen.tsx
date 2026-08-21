import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { COLORS, FONTS } from '../../constants';

const WEBSITE_URL = 'https://surgerytrack.app';
const SUPPORT_EMAIL = 'support@surgerytrack.app';
const TERMS_URL = 'https://surgerytrack.app/terms';
const PRIVACY_URL = 'https://surgerytrack.app/privacy';

export default function AboutScreen() {
  const navigation = useNavigation<any>();

  const openLink = async (url: string) => {
    Haptics.selectionAsync();
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      // ignore
    }
  };

  const openEmail = async () => {
    Haptics.selectionAsync();
    const url = `mailto:${SUPPORT_EMAIL}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      // ignore
    }
  };

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
            onPress={() => {
              Haptics.selectionAsync();
              navigation.goBack();
            }}
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

        {/* App Info Card */}
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            <View style={styles.logoRing}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons
                  name="heart-pulse"
                  size={36}
                  color={COLORS.surface}
                />
              </LinearGradient>
            </View>

            <Text style={styles.appName}>SurgeryTrack</Text>
            <Text style={styles.tagline}>
              Smart surgery management for hospitals
            </Text>
          </View>

          <View style={styles.divider} />

          <InfoRow label="Version" value="1.0.0" />
          <InfoRow label="Platform" value="iOS & Android" />
          <InfoRow label="Build" value="Production" />

          <View style={styles.descriptionWrap}>
            <Text style={styles.description}>
              SurgeryTrack is a role-based surgery management app that connects
              hospital staff, doctors, nurses, receptionists, administrators,
              and family users around surgery scheduling, operating-room status,
              surgery details, notifications, QR-code access, and general
              medical information.
            </Text>
          </View>
        </View>

        {/* Key Features */}
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

        {/* Tech Stack */}
        <Text style={styles.sectionTitle}>Built With</Text>
        <View style={styles.card}>
          <TechRow
            icon="code-tags"
            text="React Native + TypeScript"
          />
          <TechRow
            icon="database"
            text="Firebase Firestore"
          />
          <TechRow
            icon="shield-account"
            text="Firebase Authentication"
          />
          <TechRow
            icon="cellphone-link"
            text="Expo & React Navigation"
          />
        </View>

        {/* Contact */}
        <Text style={styles.sectionTitle}>Contact & Support</Text>
        <View style={styles.card}>
          <ActionRow
            icon="web"
            text="Visit website"
            onPress={() => openLink(WEBSITE_URL)}
          />
          <ActionRow
            icon="email-outline"
            text="Email support"
            onPress={openEmail}
          />
        </View>

        {/* Legal */}
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.card}>
          <ActionRow
            icon="file-document-outline"
            text="Terms of Service"
            onPress={() => openLink(TERMS_URL)}
          />
          <ActionRow
            icon="shield-check-outline"
            text="Privacy Policy"
            onPress={() => openLink(PRIVACY_URL)}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconCircle}>
        <MaterialCommunityIcons
          name={icon as any}
          size={18}
          color={COLORS.primary}
        />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function TechRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.techRow}>
      <View style={styles.techIconCircle}>
        <MaterialCommunityIcons
          name={icon as any}
          size={18}
          color={COLORS.info}
        />
      </View>
      <Text style={styles.techText}>{text}</Text>
    </View>
  );
}

function ActionRow({
  icon,
  text,
  onPress,
}: {
  icon: string;
  text: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionRow}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.actionIconCircle}>
        <MaterialCommunityIcons
          name={icon as any}
          size={18}
          color={COLORS.success}
        />
      </View>
      <Text style={styles.actionText}>{text}</Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={COLORS.textMuted}
      />
    </TouchableOpacity>
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

  // Header
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

  // Card
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

  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    backgroundColor: `${COLORS.primary}22`,
    marginBottom: 12,
  },

  logoGradient: {
    width: 82,
    height: 82,
    borderRadius: 41,
    justifyContent: 'center',
    alignItems: 'center',
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

  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 12,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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

  // Sections
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 4,
    marginLeft: 4,
  },

  // Features
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  featureIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${COLORS.primary}14`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  featureText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },

  // Tech
  techRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  techIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${COLORS.info}14`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  techText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  actionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${COLORS.success}14`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  actionText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },

  // Footer
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 8,
  },
});