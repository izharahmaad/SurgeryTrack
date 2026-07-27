import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, STATUS_COLORS, STATUS_LABELS } from '../../constants';
import { SurgeryStatus } from '../../types';
import { updateSurgeryStatus } from '../../services/surgery';
import Toast from 'react-native-toast-message';

const ALL_STATUSES: SurgeryStatus[] = ['scheduled', 'pre_op', 'in_surgery', 'recovery', 'completed', 'emergency', 'cancelled'];

export default function UpdateStatusScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { surgeryId } = route.params as { surgeryId: string };
  const [selected, setSelected] = useState<SurgeryStatus>('scheduled');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateSurgeryStatus(surgeryId, selected, notes);
      Toast.show({ type: 'success', text1: 'Status updated successfully!' });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message || 'Failed to update' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Status</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <Text style={styles.sectionTitle}>Select New Status</Text>
        <View style={styles.statusGrid}>
          {ALL_STATUSES.map((s) => {
            const color = STATUS_COLORS[s];
            const isActive = selected === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setSelected(s)}
                style={[
                  styles.statusBtn,
                  { backgroundColor: color.bg, borderColor: color.border },
                  isActive && styles.statusBtnActive,
                ]}
              >
                <MaterialCommunityIcons name="circle" size={10} color={color.text} />
                <Text style={[styles.statusBtnText, { color: color.text }, isActive && styles.statusBtnTextActive]}>
                  {STATUS_LABELS[s]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Notes (Optional)</Text>
        <View style={styles.notesRow}>
          <MaterialCommunityIcons name="note-text" size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.notesInput}
            placeholder="Add a note..."
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <TouchableOpacity style={[styles.updateBtn, loading && { opacity: 0.7 }]} onPress={handleUpdate} disabled={loading}>
          <Text style={styles.updateBtnText}>{loading ? 'Updating...' : 'Confirm Update'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins-Bold', color: COLORS.text },
  scroll: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: COLORS.primary, marginTop: 20, marginBottom: 12 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  statusBtnActive: { borderWidth: 2, shadowColor: COLORS.primary, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  statusBtnText: { fontSize: 13, fontFamily: 'Poppins-SemiBold' },
  statusBtnTextActive: { fontFamily: 'Poppins-Bold' },
  notesRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  notesInput: { flex: 1, fontSize: 14, fontFamily: 'Poppins-Regular', color: COLORS.text, textAlignVertical: 'top' },
  updateBtn: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 24 },
  updateBtnText: { color: COLORS.surface, fontSize: 16, fontFamily: 'Poppins-Bold' },
});