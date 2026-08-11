import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, STATUS_COLORS, STATUS_LABELS } from '../../constants';
import { SurgeryOperation } from '../../types';
import { subscribeToSurgeries } from '../../services/surgery';

export default function AllSurgeriesScreen() {
  const navigation = useNavigation<any>();
  const [surgeries, setSurgeries] = useState<SurgeryOperation[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToSurgeries(setSurgeries);
    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    return surgeries.filter((s) => {
      const matchesSearch =
        !search || s.patientName?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [surgeries, search, statusFilter]);

  const statusOptions = Object.keys(STATUS_LABELS);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Surgeries</Text>
        <Text style={styles.headerSubtitle}>{filtered.length} records</Text>
      </View>

      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patient name..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={statusOptions}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const active = statusFilter === item;
          const colors = STATUS_COLORS[item as keyof typeof STATUS_COLORS];
          return (
            <TouchableOpacity
              onPress={() => setStatusFilter(active ? null : item)}
              style={[
                styles.filterChip,
                { borderColor: colors.border },
                active && { backgroundColor: colors.bg },
              ]}
            >
              <Text style={[styles.filterChipText, { color: colors.text }]}>
                {STATUS_LABELS[item as keyof typeof STATUS_LABELS]}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="clipboard-search-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No surgeries found</Text>
          </View>
        }
        renderItem={({ item }) => {
          const colors = STATUS_COLORS[item.status];
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('SurgeryDetail', { surgeryId: item.id })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.patientName}>{item.patientName}</Text>
                <View style={[styles.statusPill, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.statusPillText, { color: colors.text }]}>
                    {STATUS_LABELS[item.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.department}>{item.department}</Text>
              <View style={styles.cardFooter}>
                <MaterialCommunityIcons name="calendar-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.dateText}>
                  {new Date(item.scheduledDate as any).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.text },
  headerSubtitle: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, fontFamily: FONTS.regular, color: COLORS.text },
  filterRow: { paddingHorizontal: 20, paddingVertical: 14, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: COLORS.surface,
  },
  filterChipText: { fontSize: 12, fontFamily: FONTS.semiBold },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patientName: { fontSize: 16, fontFamily: FONTS.semiBold, color: COLORS.text },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusPillText: { fontSize: 11, fontFamily: FONTS.semiBold },
  department: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  dateText: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textMuted },
});