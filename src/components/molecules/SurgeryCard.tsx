import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SurgeryOperation } from '../../types';
import { COLORS, STATUS_COLORS, STATUS_LABELS } from '../../constants';
import STText from '../atoms/STText';

interface SurgeryCardProps {
  surgery: SurgeryOperation;
  onPress?: (item: SurgeryOperation) => void;
}

export default function SurgeryCard({ surgery, onPress }: SurgeryCardProps) {
  const statusColor = STATUS_COLORS[surgery.status];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(surgery)}
      style={styles.card}
    >
      <View style={styles.left}>
        <STText variant="h3">{surgery.patientName}</STText>
        <STText variant="caption">{surgery.operationType}</STText>
        <View style={styles.metaRow}>
          <STText variant="caption">Room {surgery.otRoom}</STText>
          <STText variant="caption"> • {surgery.doctorName}</STText>
        </View>
      </View>

      <View
        style={[
          styles.badge,
          {
            backgroundColor: statusColor.bg,
            borderColor: statusColor.border,
          },
        ]}
      >
        <STText
          variant="label"
          style={{ color: statusColor.text, fontFamily: 'Poppins-Bold' }}
        >
          {STATUS_LABELS[surgery.status]}
        </STText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  left: {
    flex: 1,
    paddingRight: 12,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
});