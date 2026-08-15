import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS, STATUS_COLORS, STATUS_LABELS } from '../../constants';
import { SurgeryOperation, SurgeryStatus } from '../../types';
import { subscribeToSurgery } from '../../services/surgery';

const TIMELINE_ORDER: SurgeryStatus[] = [
  'scheduled',
  'pre_op',
  'in_surgery',
  'recovery',
  'completed',
];

function toSafeDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value: any): string {
  const date = toSafeDate(value);
  return date ? date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not set';
}

export default function SurgeryDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const surgeryId = route.params?.surgeryId;

  const [surgery, setSurgery] = useState<SurgeryOperation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!surgeryId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const unsubscribe = subscribeToSurgery(surgeryId, (data) => {
      setSurgery(data);
      setLoading(false);
      setNotFound(!data);
    });

    return unsubscribe;
  }, [surgeryId]);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loading}>Loading surgery details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (notFound || !surgery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Surgery Details</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.centerWrap}>
          <MaterialCommunityIcons name="file-search-outline" size={56} color={COLORS.textMuted} />
          <Text style={styles.notFoundTitle}>Surgery Not Found</Text>
          <Text style={styles.notFoundBody}>
            This surgery record may have been removed or the link is invalid.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = STATUS_COLORS[surgery.status];
  const currentStepIndex = TIMELINE_ORDER.indexOf(surgery.status);
  const isTerminalOther = surgery.status === 'cancelled' || surgery.status === 'emergency';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Surgery Details</Text>
        <TouchableOpacity onPress={shareQr} style={styles.backBtn} activeOpacity={0.85}>
          <MaterialCommunityIcons name="share-variant" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={{ paddingBottom: 20 }}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.statusBanner, { backgroundColor: status.bg, borderColor: status.border }]}
        >
          <MaterialCommunityIcons name="heart-pulse" size={24} color={status.text} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusText, { color: status.text }]}>{STATUS_LABELS[surgery.status]}</Text>
            <Text style={styles.statusSub}>Last updated live via Firestore</Text>
          </View>
        </Animated.View>

        {!isTerminalOther && (
          <Animated.View entering={FadeInDown.delay(80)} style={styles.card}>
            <Text style={styles.sectionTitle}>Progress Timeline</Text>
            <View style={styles.timelineRow}>
              {TIMELINE_ORDER.map((step, idx) => {
                const isDone = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <View key={step} style={styles.timelineStep}>
                    <View
                      style={[
                        styles.timelineDot,
                        isDone && { backgroundColor: STATUS_COLORS[step].text },
                        isCurrent && styles.timelineDotCurrent,
                      ]}
                    >
                      {isDone && (
                        <MaterialCommunityIcons name="check" size={12} color={COLORS.surface} />
                      )}
                    </View>
                    {idx < TIMELINE_ORDER.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          idx < currentStepIndex && { backgroundColor: STATUS_COLORS[step].text },
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
                  {STATUS_LABELS[step]}
                </Text>
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(120)} style={styles.card}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <DetailRow icon="account" label="Name" value={surgery.patientName} />
          <DetailRow icon="calendar" label="Age" value={`${surgery.patientAge} years`} />
          <DetailRow icon="gender-male-female" label="Gender" value={surgery.patientGender} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160)} style={styles.card}>
          <Text style={styles.sectionTitle}>Surgery Information</Text>
          <DetailRow icon="doctor" label="Doctor" value={surgery.doctorName} />
          <DetailRow icon="hospital-building" label="Department" value={surgery.department} />
          <DetailRow icon="medical-bag" label="Type" value={surgery.operationType} />
          <DetailRow icon="door-open" label="OT Room" value={surgery.otRoom} />
          <DetailRow icon="needle" label="Anesthesia" value={surgery.anesthesiaType || 'Not specified'} />
          {surgery.operationDescription ? (
            <DetailRow icon="text" label="Description" value={surgery.operationDescription} />
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <DetailRow icon="clock-start" label="Scheduled" value={formatDateTime(surgery.scheduledDate)} />
          {surgery.startTime && (
            <DetailRow icon="play-circle" label="Started" value={formatDateTime(surgery.startTime)} />
          )}
          {surgery.actualEndTime && (
            <DetailRow icon="check-circle" label="Completed" value={formatDateTime(surgery.actualEndTime)} />
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240)} style={styles.card}>
          <Text style={styles.sectionTitle}>Family Contact</Text>
          <DetailRow
            icon="phone"
            label="Phone"
            value={surgery.familyPhoneNumbers?.[0] || 'Not provided'}
          />
          {surgery.familyPhoneNumbers?.[0] && (
            <View style={styles.contactActions}>
              <TouchableOpacity style={styles.contactBtn} onPress={callFamily} activeOpacity={0.85}>
                <MaterialCommunityIcons name="phone" size={18} color={COLORS.primary} />
                <Text style={styles.contactBtnText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactBtn} onPress={whatsappFamily} activeOpacity={0.85}>
                <MaterialCommunityIcons name="whatsapp" size={18} color={COLORS.success} />
                <Text style={[styles.contactBtnText, { color: COLORS.success }]}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280)} style={styles.card}>
          <Text style={styles.sectionTitle}>QR Code</Text>
          <View style={styles.qrWrap}>
            <View style={styles.qrImageWrap}>
              <QRCode value={surgery.qrCodeData} size={160} color={COLORS.text} backgroundColor={COLORS.surface} />
            </View>
            <TouchableOpacity onPress={copyQrData} style={styles.copyBtn} activeOpacity={0.85}>
              <MaterialCommunityIcons name="content-copy" size={16} color={COLORS.primary} />
              <Text style={styles.copyBtnText}>Copy QR Data</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <TouchableOpacity
          style={styles.updateBtn}
          onPress={() => {
            Haptics.selectionAsync();
            navigation.navigate('UpdateStatus', { surgeryId: surgery.id });
          }}
          activeOpacity={0.9}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={COLORS.surface} />
          <Text style={styles.updateBtnText}>Update Status</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons name={icon as any} size={18} color={COLORS.primary} style={styles.detailIcon} />
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 32 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text },

  scroll: { paddingHorizontal: 20 },
  loading: { fontSize: 15, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 8 },
  notFoundTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text, marginTop: 8 },
  notFoundBody: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusText: { fontSize: 16, fontFamily: FONTS.bold },
  statusSub: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: { fontSize: 15, fontFamily: FONTS.semiBold, color: COLORS.primary, marginBottom: 14 },

  timelineRow: { flexDirection: 'row', alignItems: 'center' },
  timelineStep: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotCurrent: {
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  timelineLine: { flex: 1, height: 3, backgroundColor: COLORS.border },
  timelineLabels: { flexDirection: 'row', marginTop: 8 },
  timelineLabel: {
    flex: 1,
    fontSize: 9,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailIcon: { marginRight: 12, width: 24 },
  detailText: { flex: 1 },
  detailLabel: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted },
  detailValue: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.text },

  contactActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  contactBtnText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.primary },

  qrWrap: { alignItems: 'center', gap: 14 },
  qrImageWrap: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  copyBtnText: { fontSize: 12.5, fontFamily: FONTS.medium, color: COLORS.primary },

  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
  },
  updateBtnText: { color: COLORS.surface, fontSize: 16, fontFamily: FONTS.bold },
});