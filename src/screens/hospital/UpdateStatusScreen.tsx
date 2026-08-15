import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS, STATUS_COLORS, STATUS_LABELS } from '../../constants';
import { SurgeryStatus } from '../../types';
import { updateSurgeryStatus, getSurgery } from '../../services/surgery';

const ALL_STATUSES: SurgeryStatus[] = [
  'scheduled',
  'pre_op',
  'in_surgery',
  'recovery',
  'completed',
  'emergency',
  'cancelled',
];

const STATUS_ICONS: Record<SurgeryStatus, string> = {
  scheduled: 'calendar-clock',
  pre_op: 'clipboard-pulse-outline',
  in_surgery: 'heart-pulse',
  recovery: 'bed',
  completed: 'check-decagram',
  emergency: 'alert-decagram',
  cancelled: 'close-circle-outline',
};

const CRITICAL_STATUSES: SurgeryStatus[] = ['cancelled', 'emergency'];

const QUICK_NOTES = [
  'Delayed by 15 minutes',
  'Patient stable',
  'Moved to next room',
  'Family notified',
];

export default function UpdateStatusScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { surgeryId } = route.params as { surgeryId: string };

  const [selected, setSelected] = useState<SurgeryStatus>('scheduled');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [patientName, setPatientName] = useState('');

  useEffect(() => {
    const loadCurrentStatus = async () => {
      try {
        const surgery = await getSurgery(surgeryId);
        if (surgery) {
          setSelected(surgery.status);
          setPatientName(surgery.patientName || '');
        }
      } catch (error) {
        console.error('Failed to load surgery:', error);
      } finally {
        setInitializing(false);
      }
    };
    loadCurrentStatus();
  }, [surgeryId]);

  const performUpdate = async () => {
    setLoading(true);
    try {
      await updateSurgeryStatus(
        surgeryId,
        selected,
        notes.trim() ? { statusNote: notes.trim() } as any : undefined
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Status updated successfully!' });
      navigation.goBack();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: error?.message || 'Failed to update' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    if (CRITICAL_STATUSES.includes(selected)) {
      Alert.alert(
        `Confirm ${STATUS_LABELS[selected]}`,
        `Are you sure you want to mark this surgery as "${STATUS_LABELS[selected]}"? This action affects the patient's record${patientName ? ` for ${patientName}` : ''}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', style: 'destructive', onPress: performUpdate },
        ]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    performUpdate();
  };

  const handleSelectStatus = (status: SurgeryStatus) => {
    Haptics.selectionAsync();
    setSelected(status);
  };

  if (initializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Update Status</Text>
          {patientName ? <Text style={styles.headerSubtitle}>{patientName}</Text> : null}
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.currentBanner}>
          <View style={[styles.currentIconCircle, { backgroundColor: STATUS_COLORS[selected].bg }]}>
            <MaterialCommunityIcons
              name={STATUS_ICONS[selected] as any}
              size={22}
              color={STATUS_COLORS[selected].text}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.currentLabel}>Selected Status</Text>
            <Text style={[styles.currentValue, { color: STATUS_COLORS[selected].text }]}>
              {STATUS_LABELS[selected]}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select New Status</Text>
        <View style={styles.statusGrid}>
          {ALL_STATUSES.map((s, idx) => {
            const color = STATUS_COLORS[s];
            const isActive = selected === s;
            const isCritical = CRITICAL_STATUSES.includes(s);
            return (
              <Animated.View key={s} entering={FadeInDown.delay(idx * 40).duration(300)}>
                <TouchableOpacity
                  onPress={() => handleSelectStatus(s)}
                  disabled={loading}
                  style={[
                    styles.statusBtn,
                    { backgroundColor: color.bg, borderColor: color.border },
                    isActive && styles.statusBtnActive,
                    isActive && { borderColor: color.text },
                  ]}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name={STATUS_ICONS[s] as any}
                    size={16}
                    color={color.text}
                  />
                  <Text
                    style={[
                      styles.statusBtnText,
                      { color: color.text },
                      isActive && styles.statusBtnTextActive,
                    ]}
                  >
                    {STATUS_LABELS[s]}
                  </Text>
                  {isCritical && (
                    <MaterialCommunityIcons
                      name="alert-outline"
                      size={13}
                      color={color.text}
                      style={{ marginLeft: 2 }}
                    />
                  )}
                  {isActive && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={16}
                      color={color.text}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Quick Notes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickNotesRow}>
          {QUICK_NOTES.map((note) => (
            <TouchableOpacity
              key={note}
              style={styles.quickNoteChip}
              onPress={() => {
                Haptics.selectionAsync();
                setNotes((prev) => (prev ? `${prev}, ${note}` : note));
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.quickNoteText}>{note}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Notes (Optional)</Text>
        <View style={styles.notesRow}>
          <MaterialCommunityIcons
            name="note-text-outline"
            size={18}
            color={COLORS.textMuted}
            style={{ marginRight: 10, marginTop: 2 }}
          />
          <TextInput
            style={styles.notesInput}
            placeholder="Add a note about this update..."
            placeholderTextColor={COLORS.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={300}
          />
        </View>
        <Text style={styles.charCount}>{notes.length}/300</Text>

        <Animated.View entering={FadeIn.delay(200)}>
          <TouchableOpacity
            style={[styles.updateBtn, loading && styles.updateBtnDisabled]}
            onPress={handleUpdate}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color={COLORS.surface} />
                <Text style={styles.updateBtnText}>Confirm Update</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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
  headerTextWrap: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text },
  headerSubtitle: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },

  scroll: { paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 20 },

  currentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
    marginTop: 6,
  },
  currentIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLabel: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted },
  currentValue: { fontSize: 16, fontFamily: FONTS.bold, marginTop: 2 },

  sectionTitle: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 12,
  },

  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  statusBtnActive: {
    borderWidth: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  statusBtnText: { fontSize: 13, fontFamily: FONTS.semiBold },
  statusBtnTextActive: { fontFamily: FONTS.bold },

  quickNotesRow: { gap: 8, paddingRight: 20 },
  quickNoteChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  quickNoteText: { fontSize: 12.5, fontFamily: FONTS.medium, color: COLORS.textSecondary },

  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 90,
  },
  notesInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 6,
  },

  updateBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  updateBtnDisabled: { backgroundColor: COLORS.textMuted },
  updateBtnText: { color: COLORS.surface, fontSize: 16, fontFamily: FONTS.bold },
});