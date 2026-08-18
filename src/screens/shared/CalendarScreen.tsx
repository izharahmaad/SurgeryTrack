import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, STATUS_COLORS, STATUS_LABELS } from '../../constants';
import type { SurgeryOperation } from '../../types';
import {
  subscribeToSurgeriesByHospital,
  subscribeToSurgeriesByFamilyPhone,
} from '../../services/surgery';
import { useAuthStore } from '../../hooks/useAuthStore';

const HOSPITAL_ROLES = [
  'super_admin',
  'admin',
  'doctor',
  'nurse',
  'receptionist',
] as const;

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);

  const [surgeries, setSurgeries] = useState<SurgeryOperation[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthCursor, setMonthCursor] = useState(new Date());

  const userRole = user?.role ?? '';
  const isHospitalStaff = HOSPITAL_ROLES.includes(userRole as any);
  const isFamily = userRole === 'family';

  // Subscribe to surgeries based on role
  useEffect(() => {
    setLoading(true);
    setSurgeries([]);

    if (!user) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const handleData = (data: SurgeryOperation[]) => {
      setSurgeries(data);
      setLoading(false);
    };

    const handleError = (error: Error) => {
      console.error('Calendar surgery subscription error:', error);
      setSurgeries([]);
      setLoading(false);
    };

    if (isHospitalStaff) {
      if (!user.hospitalId) {
        console.warn('Hospital staff user has no hospitalId');
        setLoading(false);
        return;
      }

      unsubscribe = subscribeToSurgeriesByHospital(
        user.hospitalId,
        handleData,
        handleError
      );
    } else if (isFamily) {
      const phoneNumber = user.phoneNumber?.trim();
      if (!phoneNumber) {
        console.warn('Family user has no phoneNumber');
        setLoading(false);
        return;
      }

      unsubscribe = subscribeToSurgeriesByFamilyPhone(
        phoneNumber,
        handleData,
        handleError
      );
    } else {
      console.warn('Unknown role; no surgery query started:', user.role);
      setLoading(false);
      return;
    }

    return () => {
      unsubscribe?.();
    };
  }, [isFamily, isHospitalStaff, user?.hospitalId, user?.phoneNumber, user?.role, user?.uid]);

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = new Date(year, month, 1).getDay();

  const surgeryDates = useMemo(() => {
    const map: Record<string, number> = {};
    surgeries.forEach((s) => {
      const d = new Date(s.scheduledDate as any);
      if (!d || Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [surgeries]);

  const daySurgeries = useMemo(() => {
    return surgeries.filter((s) => {
      const d = new Date(s.scheduledDate as any);
      if (!d || Number.isNaN(d.getTime())) return false;
      return sameDay(d, selectedDate);
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

  const goToToday = () => {
    const now = new Date();
    setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  const headerSubtitle = useMemo(() => {
    if (!user) return 'Sign in to view your calendar';
    if (isHospitalStaff) return 'All scheduled surgeries';
    if (isFamily) return 'Your scheduled surgeries';
    return 'Scheduled surgeries overview';
  }, [user, isHospitalStaff, isFamily]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
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
          const count = surgeryDates[key] || 0;
          const hasSurgery = count > 0;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.cell,
                isSelected && styles.cellSelected,
                hasSurgery && styles.cellHasSurgery,
              ]}
              onPress={() => setSelectedDate(new Date(year, month, day))}
            >
              <Text
                style={[
                  styles.cellText,
                  isSelected && styles.cellTextSelected,
                ]}
              >
                {day}
              </Text>
              {hasSurgery && (
                <View
                  style={[
                    styles.dotRow,
                  ]}
                >
                  <View
                    style={[
                      styles.dot,
                      isSelected ? styles.dotSelected : styles.dotNormal,
                    ]}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {selectedDate.toLocaleDateString([], {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.listCount}>
          {daySurgeries.length} {daySurgeries.length === 1 ? 'surgery' : 'surgeries'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading calendar…</Text>
        </View>
      ) : (
        <FlatList
          data={daySurgeries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name="calendar-check-outline"
                size={40}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyText}>No surgeries on this date</Text>
            </View>
          }
          renderItem={({ item }) => {
            const colors = STATUS_COLORS[item.status];
            return (
              <TouchableOpacity
                style={styles.surgeryCard}
                onPress={() =>
                  navigation.navigate('SurgeryDetail', { surgeryId: item.id })
                }
              >
                <View style={[styles.statusDot, { backgroundColor: colors.text }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{item.patientName}</Text>
                  <Text style={styles.department}>
                    {item.operationType} • {item.doctorName}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.statusLabel,
                    { color: colors.text, backgroundColor: colors.bg, borderColor: colors.border },
                  ]}
                >
                  {STATUS_LABELS[item.status]}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: { paddingHorizontal: 20, paddingTop: 8 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.text },
  headerSubtitle: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },

  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  todayButtonText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

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
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, marginTop: 6 },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    marginVertical: 3,
  },
  cellSelected: { backgroundColor: COLORS.primary },
  cellHasSurgery: { backgroundColor: `${COLORS.primary}08` },

  cellText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.text },
  cellTextSelected: { color: COLORS.surface, fontFamily: FONTS.bold },

  dotRow: { marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotNormal: { backgroundColor: COLORS.primary },
  dotSelected: { backgroundColor: COLORS.surface },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  listTitle: { fontSize: 15, fontFamily: FONTS.semiBold, color: COLORS.text },
  listCount: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textMuted },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textMuted },

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
  statusLabel: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },

  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textMuted },
});