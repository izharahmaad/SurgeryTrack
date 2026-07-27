import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';
import STText from '../atoms/STText';

interface StatCardProps {
  value: number | string;
  label: string;
  backgroundColor: string;
}

export default function StatCard({
  value,
  label,
  backgroundColor,
}: StatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      <STText variant="h2" style={styles.value}>
        {value}
      </STText>
      <STText variant="label">{label}</STText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 18,
    padding: 16,
    minHeight: 92,
  },
  value: {
    color: COLORS.text,
    fontSize: 28,
  },
});