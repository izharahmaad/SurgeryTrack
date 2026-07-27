import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, STATUS_COLORS, STATUS_LABELS } from '../../constants';
import { SurgeryOperation } from '../../types';
import { subscribeToSurgery } from '../../services/surgery';
import Toast from 'react-native-toast-message';

export default function SurgeryDetailScreen() {
  // FIX: useNavigation<any>() removes all red lines on navigate()
  const navigation = useNavigation<any>();
  
  // FIX: route params typed safely
  const route = useRoute<any>();
  const surgeryId = route.params?.surgeryId;
  
  const [surgery, setSurgery] = useState<SurgeryOperation | null>(null);

  useEffect(() => {
    if (!surgeryId) return;
    const unsubscribe = subscribeToSurgery(surgeryId, (data) => {
      setSurgery(data);
    });
    return unsubscribe;
  }, [surgeryId]);

  const shareQr = async () => {
    if (!surgery) return;
    try {
      await Share.share({
        message: `SurgeryTrack - Track ${surgery.patientName} surgery. QR: ${surgery.qrCodeData}`,
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Could not share' });
    }
  };

  if (!surgery) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading surgery details...</Text>
      </SafeAreaView>
    );
  }

  const status = STATUS_COLORS[surgery.status];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Surgery Details</Text>
        <TouchableOpacity onPress={shareQr} style={styles.backBtn}>
          <MaterialCommunityIcons name="share-variant" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={[styles.statusBanner, { backgroundColor: status.bg, borderColor: status.border }]}>
          <MaterialCommunityIcons name="heart-pulse" size={24} color={status.text} />
          <Text style={[styles.statusText, { color: status.text }]}>{STATUS_LABELS[surgery.status]}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <DetailRow icon="account" label="Name" value={surgery.patientName} />
          <DetailRow icon="calendar" label="Age" value={`${surgery.patientAge} years`} />
          <DetailRow icon="gender-male-female" label="Gender" value={surgery.patientGender} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Surgery Information</Text>
          <DetailRow icon="doctor" label="Doctor" value={surgery.doctorName} />
          <DetailRow icon="hospital-building" label="Department" value={surgery.department} />
          <DetailRow icon="medical-bag" label="Type" value={surgery.operationType} />
          <DetailRow icon="door-open" label="OT Room" value={surgery.otRoom} />
          <DetailRow icon="needle" label="Anesthesia" value={surgery.anesthesiaType || 'Not specified'} />
          {surgery.operationDescription ? (
            <DetailRow icon="text" label="Description" value={surgery.operationDescription} />
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <DetailRow icon="clock-start" label="Scheduled" value={new Date(surgery.scheduledDate).toLocaleString()} />
          {surgery.startTime && <DetailRow icon="play-circle" label="Started" value={new Date(surgery.startTime).toLocaleString()} />}
          {surgery.actualEndTime && <DetailRow icon="check-circle" label="Completed" value={new Date(surgery.actualEndTime).toLocaleString()} />}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Family Contact</Text>
          <DetailRow icon="phone" label="Phone" value={surgery.familyPhoneNumbers[0] || 'Not provided'} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>QR Code</Text>
          <View style={styles.qrWrap}>
            <Text style={styles.qrText}>{surgery.qrCodeData}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.updateBtn}
          onPress={() => navigation.navigate('UpdateStatus', { surgeryId: surgery.id })}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={COLORS.surface} />
          <Text style={styles.updateBtnText}>Update Status</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins-Bold', color: COLORS.text },
  scroll: { paddingHorizontal: 20 },
  loading: { fontSize: 16, fontFamily: 'Poppins-Regular', color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 16 },
  statusText: { fontSize: 16, fontFamily: 'Poppins-Bold' },
  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: COLORS.primary, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailIcon: { marginRight: 12, width: 24 },
  detailText: { flex: 1 },
  detailLabel: { fontSize: 12, fontFamily: 'Poppins-Regular', color: COLORS.textMuted },
  detailValue: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: COLORS.text },
  qrWrap: { backgroundColor: COLORS.background, borderRadius: 14, padding: 14, alignItems: 'center' },
  qrText: { fontSize: 13, fontFamily: 'Poppins-Regular', color: COLORS.textSecondary },
  updateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, marginTop: 8 },
  updateBtnText: { color: COLORS.surface, fontSize: 16, fontFamily: 'Poppins-Bold' },
});