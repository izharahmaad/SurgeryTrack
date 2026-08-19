import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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

export default function AllSurgeriesScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);

  const [surgeries, setSurgeries] = useState<SurgeryOperation[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const userRole = user?.role ?? '';
  const isHospitalStaff = HOSPITAL_ROLES.includes(userRole as any);
  const isFamily = userRole === 'family';

  // Subscribe based on role (same pattern as Dashboard/Calendar)
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
      console.error('AllSurgeries subscription error:', error);
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

    return () => unsubscribe?.();
  }, [isFamily, isHospitalStaff, user?.hospitalId, user?.phoneNumber, user?.role, user?.uid]);

  const filtered = useMemo(() => {
    return surgeries.filter((s) => {
      const matchesSearch =
        !search ||
        s.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        s.doctorName?.toLowerCase().includes(search.toLowerCase()) ||
        s.operationType?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = !statusFilter || s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [surgeries, search, statusFilter]);

  const statusOptions = useMemo(
    () => ['all', ...Object.keys(STATUS_LABELS)],
    []
  );

  const clearSearch = useCallback(() => {
    setSearch('');
    Haptics.selectionAsync();
  }, []);

  const handleStatusFilterPress = useCallback((status: string) => {
    Haptics.selectionAsync();
    setStatusFilter((prev) => (status === 'all' ? null : status));
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={20}
          color={COLORS.text}
        />
      </TouchableOpacity>

      <View style={styles.headerTitleWrap}>
        <Text style={styles.headerTitle}>All Surgeries</Text>
        <Text style={styles.headerSubtitle}>
          {loading ? 'Loading…' : `${filtered.length} records`}
        </Text>
      </View>

      <View style={styles.headerActionPlaceholder} />
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchBox}>
      <MaterialCommunityIcons
        name="magnify"
        size={18}
        color={COLORS.textMuted}
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Search patient, doctor, or procedure..."
        placeholderTextColor={COLORS.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      {search.length > 0 && (
        <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
          <MaterialCommunityIcons
            name="close-circle"
            size={18}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFilterChips = () => (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={statusOptions}
      keyExtractor={(item) => item}
      contentContainerStyle={styles.filterRow}
      renderItem={({ item }) => {
        const isActive = statusFilter === item || (item === 'all' && !statusFilter);
        const isAll = item === 'all';

        const colors = isAll
          ? {
              bg: COLORS.primary,
              text: COLORS.surface,
              border: COLORS.primary,
            }
          : STATUS_COLORS[item as keyof typeof STATUS_COLORS];

        return (
          <TouchableOpacity
            onPress={() => handleStatusFilterPress(item)}
            style={[
              styles.filterChip,
              { borderColor: colors.border },
              isActive && { backgroundColor: colors.bg },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: isActive ? COLORS.surface : colors.text },
              ]}
            >
              {isAll ? 'All' : STATUS_LABELS[item as keyof typeof STATUS_LABELS]}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <MaterialCommunityIcons
        name="clipboard-search-outline"
        size={48}
        color={COLORS.textMuted}
      />
      <Text style={styles.emptyTitle}>No surgeries found</Text>
      <Text style={styles.emptyText}>
        Try adjusting your search or filters
      </Text>
    </View>
  );

  const renderCard = ({ item }: { item: SurgeryOperation }) => {
    const colors = STATUS_COLORS[item.status];

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('SurgeryDetail', { surgeryId: item.id })
        }
      >
        <View style={styles.cardTop}>
          <View style={styles.patientWrap}>
            <Text style={styles.patientName}>{item.patientName}</Text>
            <Text style={styles.patientMeta}>
              {item.patientAge} yrs • {item.patientGender}
            </Text>
          </View>

          <View
            style={[
              styles.statusPill,
              { backgroundColor: colors.bg, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.statusPillText, { color: colors.text }]}>
              {STATUS_LABELS[item.status]}
            </Text>
          </View>
        </View>

        <View style={styles.cardMiddle}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="medical-bag"
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.operationType}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="doctor"
              size={16}
              color={COLORS.textMuted}
            />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.doctorName}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={14}
            color={COLORS.textMuted}
          />
          <Text style={styles.dateText}>
            {new Date(item.scheduledDate as any).toLocaleString([], {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </Text>

          {item.otRoom && (
            <>
              <MaterialCommunityIcons
                name="door-open"
                size={14}
                color={COLORS.textMuted}
              />
              <Text style={styles.dateText}>{item.otRoom}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderSearchBar()}
      {renderFilterChips()}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading surgeries…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={renderEmpty}
          renderItem={renderCard}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    paddingHorizontal: 10,
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

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },

  clearButton: {
    padding: 4,
  },

  // Filters
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },

  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: COLORS.surface,
  },

  filterChipText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },

  // List
  list: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  loadingText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  patientWrap: {
    flex: 1,
    marginRight: 10,
  },

  patientName: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },

  patientMeta: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },

  statusPillText: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
  },

  cardMiddle: {
    marginTop: 10,
    gap: 6,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },

  dateText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },

  emptyText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});