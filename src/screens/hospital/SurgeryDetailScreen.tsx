import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS, STATUS_COLORS, STATUS_LABELS } from '../../constants';
import type { SurgeryOperation, SurgeryStatus } from '../../types';
import { subscribeToSurgery } from '../../services/surgery';
import { useAuthStore } from '../../hooks/useAuthStore';

const TIMELINE_ORDER: SurgeryStatus[] = [
  'scheduled',
  'pre_op',
  'in_surgery',
  'recovery',
  'completed',
];

const HOSPITAL_ROLES = [
  'super_admin',
  'admin',
  'doctor',
  'nurse',
  'receptionist',
] as const;

function isHospitalRole(role: unknown): boolean {
  return HOSPITAL_ROLES.includes(String(role ?? '').trim().toLowerCase() as any);
}

function toSafeDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof (value as any)?.toDate === 'function') {
    const date = (value as any).toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value: unknown): string {
  const date = toSafeDate(value);
  if (!date) return 'Not set';
  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatTimeOnly(value: unknown): string {
  const date = toSafeDate(value);
  if (!date) return 'Not set';
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusConfig(status: string) {
  return (
    STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? {
      text: COLORS.info,
      bg: `${COLORS.info}14`,
      border: `${COLORS.info}35`,
    }
  );
}

function getStatusLabel(status: string): string {
  return (
    STATUS_LABELS[status as keyof typeof STATUS_LABELS] ??
    status.replace(/_/g, ' ')
  );
}

function usePulseAnimation() {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.25,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [scale]);

  return scale;
}

export default function SurgeryDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();

  const user = useAuthStore((state) => state.user);

  const surgeryId = route.params?.surgeryId as string | undefined;

  const [surgery, setSurgery] = useState<SurgeryOperation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const role = String(user?.role ?? '').trim().toLowerCase();
  const isHospitalStaff = isHospitalRole(role);
  const canUpdateStatus = isHospitalStaff;

  const pulseScale = usePulseAnimation();

  useEffect(() => {
    if (!isFocused) return;

    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    if (!surgeryId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);

    const handleData = (data: SurgeryOperation | null) => {
      if (!mounted) return;
      setSurgery(data);
      setLoading(false);
      setNotFound(!data);
    };

    const handleError = (error: Error) => {
      if (!mounted) return;
      console.error('SurgeryDetail subscription error:', error);
      setLoading(false);
      setNotFound(true);

      Toast.show({
        type: 'error',
        text1: 'Unable to load surgery',
        text2: 'Please try again.',
      });
    };

    unsubscribe = subscribeToSurgery(surgeryId, handleData, handleError);

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [isFocused, surgeryId]);

  const statusConfig = useMemo(
    () => (surgery ? getStatusConfig(surgery.status) : null),
    [surgery]
  );

  const currentStepIndex = useMemo(() => {
    if (!surgery) return -1;
    return TIMELINE_ORDER.indexOf(surgery.status);
  }, [surgery]);

  const isTerminalOther =
    surgery?.status === 'cancelled' || surgery?.status === 'emergency';

  const shareQr = async () => {
    if (!surgery) return;
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: `SurgeryTrack - Track ${surgery.patientName}'s surgery.\nQR Data: ${surgery.qrCodeData}`,
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Could not share' });
    }
  };

  const copyQrData = async () => {
    if (!surgery) return;
    Haptics.selectionAsync();
    await Clipboard.setStringAsync(surgery.qrCodeData);
    Toast.show({ type: 'success', text1: 'QR data copied to clipboard' });
  };

  const copyPhone = async () => {
    const phone = surgery?.familyPhoneNumbers?.[0];
    if (!phone) {
      Toast.show({ type: 'info', text1: 'No phone number available' });
      return;
    }
    Haptics.selectionAsync();
    await Clipboard.setStringAsync(phone);
    Toast.show({ type: 'success', text1: 'Phone number copied' });
  };

  const callFamily = () => {
    const phone = surgery?.familyPhoneNumbers?.[0];
    if (!phone) {
      Toast.show({ type: 'info', text1: 'No phone number available' });
      return;
    }
    Haptics.selectionAsync();
    Linking.openURL(`tel:${phone}`);
  };

  const whatsappFamily = () => {
    const phone = surgery?.familyPhoneNumbers?.[0];
    if (!phone) {
      Toast.show({ type: 'info', text1: 'No phone number available' });
      return;
    }
    Haptics.selectionAsync();
    Linking.openURL(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`);
  };

  const navigateToUpdateStatus = () => {
    if (!surgery) return;
    Haptics.selectionAsync();
    navigation.navigate('UpdateStatus', { surgeryId: surgery.id });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading surgery details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (notFound || !surgery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Surgery Details</Text>

          <View style={styles.headerActionPlaceholder} />
        </View>

        <View style={styles.centerWrap}>
          <MaterialCommunityIcons
            name="file-search-outline"
            size={56}
            color={COLORS.textMuted}
          />
          <Text style={styles.notFoundTitle}>Surgery Not Found</Text>
          <Text style={styles.notFoundBody}>
            This surgery record may have been removed or the link is invalid.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusLabel = getStatusLabel(surgery.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Surgery Details</Text>

        <TouchableOpacity
          onPress={shareQr}
          style={styles.headerActionButton}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="share-variant"
            size={20}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Live Status Banner */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[
            styles.statusBanner,
            {
              backgroundColor: statusConfig!.bg,
              borderColor: statusConfig!.border,
            },
          ]}
        >
          <Animated.View
            style={{
              transform: [{ scale: pulseScale }],
            }}
          >
            <MaterialCommunityIcons
              name="heart-pulse"
              size={24}
              color={statusConfig!.text}
            />
          </Animated.View>

          <View style={styles.statusBannerText}>
            <Text style={[styles.statusText, { color: statusConfig!.text }]}>
              {statusLabel}
            </Text>
            <Text style={styles.statusSubtext}>
              Live updates via Firestore
            </Text>
          </View>

          <View
            style={[
              styles.liveDot,
              { backgroundColor: statusConfig!.text },
            ]}
          />
        </Animated.View>

        {/* Progress Timeline */}
        {!isTerminalOther && (
          <Animated.View
            entering={FadeInDown.delay(80)}
            style={styles.card}
          >
            <Text style={styles.sectionTitle}>Progress Timeline</Text>

            <View style={styles.timelineRow}>
              {TIMELINE_ORDER.map((step, idx) => {
                const isDone = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const stepConfig = getStatusConfig(step);

                return (
                  <View key={step} style={styles.timelineStep}>
                    <View
                      style={[
                        styles.timelineDot,
                        {
                          backgroundColor: isDone
                            ? stepConfig.text
                            : COLORS.border,
                        },
                        isCurrent && styles.timelineDotCurrent,
                      ]}
                    >
                      {isDone && (
                        <MaterialCommunityIcons
                          name="check"
                          size={12}
                          color={COLORS.surface}
                        />
                      )}
                    </View>

                    {idx < TIMELINE_ORDER.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          {
                            backgroundColor:
                              idx < currentStepIndex
                                ? stepConfig.text
                                : COLORS.border,
                          },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.timelineLabels}>
              {TIMELINE_ORDER.map((step) => (
                <Text key={step} style={styles.timelineLabel}>
                  {getStatusLabel(step)}
                </Text>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Patient Information */}
        <Animated.View entering={FadeInDown.delay(120)} style={styles.card}>
          <Text style={styles.sectionTitle}>Patient Information</Text>

          <DetailRow
            icon="account"
            label="Name"
            value={surgery.patientName || 'Not provided'}
          />
          <DetailRow
            icon="calendar"
            label="Age"
            value={
              surgery.patientAge ? `${surgery.patientAge} years` : 'Not provided'
            }
          />
          <DetailRow
            icon="gender-male-female"
            label="Gender"
            value={surgery.patientGender || 'Not provided'}
          />
        </Animated.View>

        {/* Surgery Information */}
        <Animated.View entering={FadeInDown.delay(160)} style={styles.card}>
          <Text style={styles.sectionTitle}>Surgery Information</Text>

          <DetailRow
            icon="doctor"
            label="Doctor"
            value={surgery.doctorName || 'Not assigned'}
          />
          <DetailRow
            icon="hospital-building"
            label="Department"
            value={surgery.department || 'Not specified'}
          />
          <DetailRow
            icon="medical-bag"
            label="Type"
            value={surgery.operationType || 'Not specified'}
          />
          <DetailRow
            icon="door-open"
            label="OT Room"
            value={surgery.otRoom || 'Not assigned'}
          />
          <DetailRow
            icon="needle"
            label="Anesthesia"
            value={surgery.anesthesiaType || 'Not specified'}
          />

          {surgery.operationDescription ? (
            <View style={styles.descriptionRow}>
              <MaterialCommunityIcons
                name="text"
                size={18}
                color={COLORS.primary}
                style={styles.detailIcon}
              />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{surgery.operationDescription}</Text>
              </View>
            </View>
          ) : null}
        </Animated.View>

        {/* Timeline */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
          <Text style={styles.sectionTitle}>Timeline</Text>

          <DetailRow
            icon="clock-start"
            label="Scheduled"
            value={formatDateTime(surgery.scheduledDate)}
          />

          {surgery.startTime && (
            <DetailRow
              icon="play-circle"
              label="Started"
              value={formatTimeOnly(surgery.startTime)}
            />
          )}

          {surgery.actualEndTime && (
            <DetailRow
              icon="check-circle"
              label="Completed"
              value={formatTimeOnly(surgery.actualEndTime)}
            />
          )}
        </Animated.View>

        {/* Family Contact */}
        <Animated.View entering={FadeInDown.delay(240)} style={styles.card}>
          <Text style={styles.sectionTitle}>Family Contact</Text>

          <DetailRow
            icon="phone"
            label="Phone"
            value={surgery.familyPhoneNumbers?.[0] || 'Not provided'}
          />

          {surgery.familyPhoneNumbers?.[0] && (
            <View style={styles.contactActions}>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={callFamily}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="phone"
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.contactButtonText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={whatsappFamily}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="whatsapp"
                  size={16}
                  color={COLORS.success}
                />
                <Text
                  style={[
                    styles.contactButtonText,
                    { color: COLORS.success },
                  ]}
                >
                  WhatsApp
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={copyPhone}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="content-copy"
                  size={16}
                  color={COLORS.info}
                />
                <Text
                  style={[
                    styles.contactButtonText,
                    { color: COLORS.info },
                  ]}
                >
                  Copy
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* QR Code */}
        <Animated.View entering={FadeInDown.delay(280)} style={styles.card}>
          <Text style={styles.sectionTitle}>QR Code</Text>

          <View style={styles.qrWrap}>
            <View style={styles.qrImageWrap}>
              <QRCode
                value={surgery.qrCodeData}
                size={160}
                color={COLORS.text}
                backgroundColor={COLORS.surface}
              />
            </View>

            <TouchableOpacity
              onPress={copyQrData}
              style={styles.copyButton}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="content-copy"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.copyButtonText}>Copy QR Data</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Update Status (Hospital Only) */}
        {canUpdateStatus && (
          <Animated.View entering={FadeInDown.delay(320)}>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={navigateToUpdateStatus}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={20}
                color={COLORS.surface}
              />
              <Text style={styles.updateButtonText}>Update Status</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons
        name={icon as any}
        size={18}
        color={COLORS.primary}
        style={styles.detailIcon}
      />
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },

  loadingText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 8,
  },

  notFoundTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: 8,
  },

  notFoundBody: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
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

  headerActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  scroll: {
    paddingHorizontal: 16,
  },

  // Status Banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },

  statusBannerText: {
    flex: 1,
  },

  statusText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },

  statusSubtext: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Cards
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
    marginBottom: 12,
  },

  // Timeline
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  timelineStep: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  timelineDotCurrent: {
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },

  timelineLine: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.border,
  },

  timelineLabels: {
    flexDirection: 'row',
    marginTop: 10,
  },

  timelineLabel: {
    flex: 1,
    fontSize: 9,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  detailIcon: {
    marginRight: 10,
    width: 24,
  },

  detailText: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  detailValue: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginTop: 2,
  },

  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },

  // Contact actions
  contactActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },

  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  contactButtonText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },

  // QR
  qrWrap: {
    alignItems: 'center',
    gap: 12,
  },

  qrImageWrap: {
    padding: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  copyButtonText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },

  // Update button
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    marginTop: 6,
  },

  updateButtonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
});