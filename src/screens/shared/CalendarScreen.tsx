import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, STATUS_COLORS, STATUS_LABELS } from '../../constants';
import { SurgeryOperation } from '../../types';
import { subscribeToSurgeries } from '../../services/surgery';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function CalendarScreen() {
  const navigation = useNavigation<any>();
  const [surgeries, setSurgeries] = useState<SurgeryOperation[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthCursor, setMonthCursor] = useState(new Date());

  useEffect(() => {
    const unsubscribe = subscribeToSurgeries(setSurgeries);
    return () => unsubscribe();
  }, []);

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = new Date(year, month, 1).getDay();

  const surgeryDates = useMemo(() => {
    const map: Record<string, number> = {};
    surgeries.forEach((s) => {
      const d = new Date(s.scheduledDate as any);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [surgeries]);

  const daySurgeries = useMemo(() => {
    return surgeries.filter((s) => {
      const d = new Date(s.scheduledDate as any);
      return (
        d.getFullYear() === selectedDate.getFullYear() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getDate() === selectedDate.getDate()
      );
    });
  }, [surgeries, selectedDate]);

  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [firstDayIndex, daysInMonth]);

  const changeMonth = (delta: number) => {
    setMonthCursor(new Date(year, month + delta, 1));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <Text style={styles.headerSubtitle}>Scheduled surgeries overview</Text>
      </View>

      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {monthCursor.toLocaleDateString([], { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} style={styles.weekLabel}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {calendarCells.map((day, index) => {
          if (day === null) return <View key={index} style={styles.cell} />;
          const isSelected =
            day === selectedDate.getDate() &&
            month === selectedDate.getMonth() &&
            year === selectedDate.getFullYear();
          const key = `${year}-${month}-${day}`;
          const hasSurgery = surgeryDates[key];

          return (
            <TouchableOpacity
              key={index}
              style={[styles.cell, isSelected && styles.cellSelected]}
              onPress={() => setSelectedDate(new Date(year, month, day))}
            >
              <Text style={[styles.cellText, isSelected && styles.cellTextSelected]}>{day}</Text>
              {hasSurgery ? <View style={[styles.dot, isSelected && styles.dotSelected]} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.listTitle}>
        {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
      </Text>

      <FlatList
        data={daySurgeries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="calendar-check-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No surgeries on this date</Text>
          </View>
        }
        renderItem={({ item }) => {
          const colors = STATUS_COLORS[item.status];
          return (
            <TouchableOpacity
              style={styles.surgeryCard}
              onPress={() => navigation.navigate('SurgeryDetail', { surgeryId: item.id })}
            >
              <View style={[styles.statusDot, { backgroundColor: colors.text }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{item.patientName}</Text>
                <Text style={styles.department}>{item.department}</Text>
              </View>
              <Text style={[styles.statusLabel, { color: colors.text }]}>
                {STATUS_LABELS[item.status]}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 8 },
  headerTitle: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.text },
  headerSubtitle: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 16,
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: { fontSize: 16, fontFamily: FONTS.semiBold, color: COLORS.text },
  weekRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, marginTop: 6 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  cellSelected: { backgroundColor: COLORS.primary, borderRadius: 14 },
  cellText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.text },
  cellTextSelected: { color: COLORS.surface, fontFamily: FONTS.bold },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.primary, marginTop: 3 },
  dotSelected: { backgroundColor: COLORS.surface },
  listTitle: { fontSize: 15, fontFamily: FONTS.semiBold, color: COLORS.text, marginHorizontal: 20, marginTop: 20, marginBottom: 10 },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  surgeryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  patientName: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.text },
  department: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  statusLabel: { fontSize: 11, fontFamily: FONTS.semiBold },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textMuted },
});