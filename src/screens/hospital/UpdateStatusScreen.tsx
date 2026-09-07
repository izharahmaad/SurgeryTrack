import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FadeIn, FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS, STATUS_COLORS, STATUS_LABELS } from '../../constants';
import type { SurgeryStatus } from '../../types';
import { updateSurgeryStatus, getSurgery } from '../../services/surgery';
import { useAuthStore } from '../../hooks/useAuthStore';

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
  'OT cleaned',
  'Anesthesia adjusted',
];

const NORMAL_FLOW: SurgeryStatus[] = [
  'scheduled',
  'pre_op',
  'in_surgery',
  'recovery',
  'completed',
];

function getRecommendedStatus(current: SurgeryStatus): SurgeryStatus | null {
  const idx = NORMAL_FLOW.indexOf(current);
  if (idx === -1 || idx >= NORMAL_FLOW.length - 1) return null;
  return NORMAL_FLOW[idx + 1];
}

function getStatusLabel(status: string): string {
  return (
    STATUS_LABELS[status as keyof typeof STATUS_LABELS] ??
    status.replace(/_/g, ' ')
  );
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

export default function UpdateStatusScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();

  const { surgeryId } = route.params as { surgeryId: string };

  const user = useAuthStore((state) => state.user);

  const [selected, setSelected] = useState<SurgeryStatus>('scheduled');
  const [initialStatus, setInitialStatus] = useState<SurgeryStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [patientName, setPatientName] = useState('');
  const [department, setDepartment] = useState<string | undefined>();

  const hasChanged = selected !== initialStatus;
  const isCritical = CRITICAL_STATUSES.includes(selected);
  const recommended = initialStatus ? getRecommendedStatus(initialStatus) : null;

  const charLimit = 300;
  const charCount = notes.length;
  const nearLimit = charCount >= 250;

  useEffect(() => {
    if (!isFocused) return;

    let mounted = true;

    const loadCurrentStatus = async () => {
      try {
        const surgery = await getSurgery(surgeryId);
        if (!mounted) return;

        if (surgery) {
          setInitialStatus(surgery.status);
          setSelected(surgery.status);
          setPatientName(surgery.patientName || '');
          setDepartment(surgery.department);
        }
      } catch (error) {
        console.error('Failed to load surgery:', error);
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    loadCurrentStatus();

    return () => {
      mounted = false;
    };
  }, [isFocused, surgeryId]);

  const performUpdate = async () => {
    if (!hasChanged) {
      Toast.show({
        type: 'info',
        text1: 'No changes',
        text2: 'Select a different status to update.',
      });
      return;
    }

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
    if (!hasChanged) {
      Toast.show({
        type: 'info',
        text1: 'No changes',
        text2: 'Select a different status to update.',
      });
      return;
    }

    if (isCritical) {
      Alert.alert(
        `Confirm ${getStatusLabel(selected)}`,
        `Are you sure you want to mark this surgery as "${getStatusLabel(
          selected
        )}"? This action affects the patient's record${
          patientName ? ` for ${patientName}` : ''
        }.`,
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

  const handleAddQuickNote = (note: string) => {
    Haptics.selectionAsync();
    setNotes((prev) => {
      if (!prev) return note;
      if (prev.includes(note)) return prev;
      const next = `${prev}, ${note}`;
      return next.slice(0, charLimit);
    });
  };

  const clearNotes = () => {
    Haptics.selectionAsync();
    setNotes('');
  };

  if (initializing) {
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

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Update Status</Text>
            <Text style={styles.headerSubtitle}>Loading…</Text>
          </View>

          <View style={styles.headerActionPlaceholder} />
        </View>

        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading surgery details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentConfig = getStatusConfig(selected);
  const initialConfig = initialStatus ? getStatusConfig(initialStatus) : null;
  const recommendedConfig = recommended ? getStatusConfig(recommended) : null;

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

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Update Status</Text>
          <Text style={styles.headerSubtitle}>
            {patientName || 'Patient'} {department ? `• ${department}` : ''}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            if (!initialStatus) return;
            Haptics.selectionAsync();
            setSelected(initialStatus);
            setNotes('');
            Toast.show({
              type: 'info',
              text1: 'Reset to current status',
            });
          }}
          style={styles.headerActionButton}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={20}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current & Selected Status Banner */}
        <View style={styles.statusBanner}>
          <View
            style={[
              styles.statusIconCircle,
              { backgroundColor: currentConfig.bg },
            ]}
          >
            <MaterialCommunityIcons
              name={STATUS_ICONS[selected] as any}
              size={22}
              color={currentConfig.text}
            />
          </View>

          <View style={styles.statusBannerText}>
            <Text style={styles.statusBannerLabel}>Selected status</Text>
            <Text
              style={[
                styles.statusBannerValue,
                { color: currentConfig.text },
              ]}
            >
              {getStatusLabel(selected)}
            </Text>
          </View>

          {initialStatus && (
            <View style={styles.fromToChip}>
              <Text style={styles.fromToLabel}>From</Text>
              <Text style={styles.fromToValue}>
                {getStatusLabel(initialStatus)}
              </Text>
            </View>
          )}
        </View>

        {/* Recommended Status */}
        {recommended && (
          <View
            style={[
              styles.recommendedBanner,
              {
                backgroundColor: recommendedConfig!.bg,
                borderColor: recommendedConfig!.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={18}
              color={recommendedConfig!.text}
            />
            <Text style={styles.recommendedText}>
              Recommended:{' '}
              <Text
                style={{
                  color: recommendedConfig!.text,
                  fontFamily: FONTS.semiBold,
                }}
              >
                {getStatusLabel(recommended)}
              </Text>
            </Text>
          </View>
        )}

        {/* Critical Status Warning */}
        {isCritical && (
          <View
            style={[
              styles.criticalBanner,
              {
                backgroundColor: currentConfig.bg,
                borderColor: currentConfig.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={18}
              color={currentConfig.text}
            />
            <Text style={[styles.criticalText, { color: currentConfig.text }]}>
              This is a critical status. It will be recorded permanently.
            </Text>
          </View>
        )}

        {/* Status Grid */}
        <Text style={styles.sectionTitle}>Select New Status</Text>
        <View style={styles.statusGrid}>
          {ALL_STATUSES.map((s, idx) => {
            const color = getStatusConfig(s);
            const isActive = selected === s;
            const isCrit = CRITICAL_STATUSES.includes(s);

            return (
              <View
                key={s}
                style={{
                  width: '48%',
                }}
              >
                <TouchableOpacity
                  onPress={() => handleSelectStatus(s)}
                  disabled={loading}
                  style={[
                    styles.statusBtn,
                    {
                      backgroundColor: color.bg,
                      borderColor: color.border,
                    },
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
                    numberOfLines={2}
                  >
                    {getStatusLabel(s)}
                  </Text>
                  {isCrit && (
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
              </View>
            );
          })}
        </View>

        {/* Quick Notes */}
        <Text style={styles.sectionTitle}>Quick Notes</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickNotesRow}
        >
          {QUICK_NOTES.map((note) => {
            const active = notes.includes(note);
            return (
              <TouchableOpacity
                key={note}
                style={[
                  styles.quickNoteChip,
                  active && styles.quickNoteChipActive,
                ]}
                onPress={() => handleAddQuickNote(note)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.quickNoteText,
                    active && styles.quickNoteTextActive,
                  ]}
                >
                  {note}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Notes Input */}
        <Text style={styles.sectionTitle}>Notes (Optional)</Text>
        <View
          style={[
            styles.notesCard,
            nearLimit && { borderColor: COLORS.warning },
          ]}
        >
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
            maxLength={charLimit}
          />
        </View>

        <View style={styles.notesFooter}>
          <Text
            style={[
              styles.charCount,
              nearLimit && { color: COLORS.warning },
            ]}
          >
            {charCount}/{charLimit}
          </Text>

          {charCount > 0 && (
            <Pressable onPress={clearNotes} style={styles.clearNotesButton}>
              <Text style={styles.clearNotesText}>Clear notes</Text>
            </Pressable>
          )}
        </View>

        {/* Update Button */}
        <TouchableOpacity
          style={[
            styles.updateBtn,
            (!hasChanged || loading) && styles.updateBtnDisabled,
          ]}
          onPress={handleUpdate}
          disabled={!hasChanged || loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.surface} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={20}
                color={COLORS.surface}
              />
              <Text style={styles.updateBtnText}>
                {hasChanged ? 'Confirm Update' : 'No Changes'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  loadingText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
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

  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  headerSubtitle: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
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

  scrollContent: {
    paddingBottom: 20,
  },

  // Status Banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    marginTop: 6,
  },

  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusBannerText: {
    flex: 1,
  },

  statusBannerLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  statusBannerValue: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    marginTop: 2,
  },

  fromToChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  fromToLabel: {
    fontSize: 9,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  fromToValue: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginTop: 1,
    textAlign: 'center',
  },

  // Recommended Banner
  recommendedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },

  recommendedText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },

  // Critical Banner
  criticalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },

  criticalText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.medium,
  },

  // Section
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 10,
  },

  // Status Grid
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 44,
  },

  statusBtnActive: {
    borderWidth: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  statusBtnText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },

  statusBtnTextActive: {
    fontFamily: FONTS.bold,
  },

  // Quick Notes
  quickNotesRow: {
    gap: 8,
    paddingRight: 20,
  },

  quickNoteChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  quickNoteChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  quickNoteText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },

  quickNoteTextActive: {
    color: COLORS.surface,
  },

  // Notes
  notesCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
  },

  notesInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlignVertical: 'top',
  },

  notesFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  charCount: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  clearNotesButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  clearNotesText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  // Update Button
  updateBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  updateBtnDisabled: {
    backgroundColor: COLORS.textMuted,
  },

  updateBtnText: {
    color: COLORS.surface,
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
});