import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import {
  COLORS,
  FONTS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '@/constants';

import type { SurgeryOperation } from '@/types';

import {
  subscribeToSurgeriesByFamilyPhone,
  subscribeToSurgeriesByHospital,
} from '@/services/surgery';

import { useAuthStore } from '@/hooks/useAuthStore';

const HOSPITAL_ROLES = [
  'super_admin',
  'admin',
  'doctor',
  'nurse',
  'receptionist',
] as const;

const ACTIVE_STATUSES = [
  'in_surgery',
  'pre_op',
  'recovery',
] as const;

type FilterType =
  | 'all'
  | 'active'
  | 'scheduled'
  | 'emergency';

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';

  return 'Good Evening';
}

function toSafeDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate ===
      'function'
  ) {
    return (
      value as { toDate: () => Date }
    ).toDate();
  }

  const date = new Date(value as string | number);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function useAnimatedCount(
  target: number,
  duration = 700
): number {
  const animatedValue = useRef(
    new Animated.Value(0)
  ).current;

  const [displayValue, setDisplayValue] =
    useState(0);

  useEffect(() => {
    animatedValue.stopAnimation();
    animatedValue.setValue(0);

    const listener = animatedValue.addListener(
      ({ value }) => {
        setDisplayValue(Math.round(value));
      }
    );

    Animated.timing(animatedValue, {
      toValue: target,
      duration,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [animatedValue, duration, target]);

  return displayValue;
}

function useSpin() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [spin]);

  return spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
}

function HeroOverviewCard({
  activeCount,
  totalCount,
}: {
  activeCount: number;
  totalCount: number;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(
    new Animated.Value(0.96)
  ).current;

  const count = useAnimatedCount(activeCount);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, scale]);

  const percentage =
    totalCount > 0
      ? Math.round((activeCount / totalCount) * 100)
      : 0;

  return (
    <Animated.View
      style={{
        opacity: fade,
        transform: [{ scale }],
      }}
    >
      <LinearGradient
        colors={[
          COLORS.primary,
          COLORS.secondary,
        ]}
        style={styles.heroCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroGlow} />

        <View style={styles.heroTopRow}>
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE NOW</Text>
          </View>

          <MaterialCommunityIcons
            name="pulse"
            size={22}
            color={COLORS.surface}
          />
        </View>

        <View style={styles.heroMainRow}>
          <Text
            style={[
              styles.heroNumber,
              count === 0 && styles.heroNumberZero,
            ]}
          >
            {count}
          </Text>

          <View style={styles.heroInfo}>
            <Text style={styles.heroLabel}>
              Active Surgeries
            </Text>
            <Text style={styles.heroDetail}>
              of {totalCount} total today
            </Text>
          </View>
        </View>

        <View style={styles.heroTrack}>
          <View
            style={[
              styles.heroFill,
              { width: `${percentage}%` },
            ]}
          />
        </View>

        <Text style={styles.heroPercent}>
          {percentage}% of today's cases in progress
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

function MiniStatCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
  delay: number;
}) {
  const count = useAnimatedCount(value);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.miniCard,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.miniIcon,
          { backgroundColor: `${color}18` },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={18}
          color={color}
        />
      </View>

      <Text
        style={[
          styles.miniValue,
          count === 0 && styles.miniValueZero,
        ]}
      >
        {count}
      </Text>

      <Text style={styles.miniLabel}>{label}</Text>
    </Animated.View>
  );
}

function QuickActions({
  navigation,
  canCreate,
}: {
  navigation: any;
  canCreate: boolean;
}) {
  const comingSoon = (label: string) => {
    Haptics.selectionAsync();

    Toast.show({
      type: 'info',
      text1: label,
      text2: 'This feature is coming soon',
    });
  };

  const actions = [
    {
      icon: 'plus-circle',
      label: 'New Case',
      color: COLORS.primary,
      show: canCreate,
      onPress: () => navigation.navigate('CreateSurgery'),
    },
    {
      icon: 'account-group',
      label: 'Patients',
      color: COLORS.info,
      show: true,
      onPress: () => comingSoon('Patients'),
    },
    {
      icon: 'calendar-month',
      label: 'Calendar',
      color: COLORS.success,
      show: true,
      onPress: () =>
        navigation.navigate('Dashboard', {
          screen: 'Calendar',
        }),
    },
    {
      icon: 'file-chart',
      label: 'Reports',
      color: '#F59E0B',
      show: canCreate,
      onPress: () => comingSoon('Reports'),
    },
  ];

  return (
    <View style={styles.quickActions}>
      {actions
        .filter((action) => action.show)
        .map((action) => (
          <Pressable
            key={action.label}
            style={({ pressed }) => [
              styles.quickAction,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              action.onPress();
            }}
          >
            <View
              style={[
                styles.quickCircle,
                { backgroundColor: `${action.color}16` },
              ]}
            >
              <MaterialCommunityIcons
                name={action.icon as any}
                size={22}
                color={action.color}
              />
            </View>

            <Text style={styles.quickLabel}>{action.label}</Text>
          </Pressable>
        ))}
    </View>
  );
}

function OTRoomStatus({
  surgeries,
}: {
  surgeries: SurgeryOperation[];
}) {
  const occupiedRooms = new Set(
    surgeries
      .filter((surgery) =>
        ACTIVE_STATUSES.includes(surgery.status as any)
      )
      .map((surgery) => surgery.otRoom)
  );

  const rooms = Array.from(
    new Set(surgeries.map((surgery) => surgery.otRoom))
  ).slice(0, 6);

  if (rooms.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.subSectionTitle}>OT Room Status</Text>

      <View style={styles.roomGrid}>
        {rooms.map((room) => {
          const isOccupied = occupiedRooms.has(room);
          const color = isOccupied ? COLORS.error : COLORS.success;

          return (
            <View
              key={room}
              style={[
                styles.roomChip,
                {
                  backgroundColor: `${color}12`,
                  borderColor: `${color}35`,
                },
              ]}
            >
              <View
                style={[
                  styles.roomDot,
                  { backgroundColor: color },
                ]}
              />
              <Text style={styles.roomName}>{room}</Text>
              <Text
                style={[
                  styles.roomStatus,
                  { color },
                ]}
              >
                {isOccupied ? 'In Use' : 'Free'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function LoadingState() {
  const rotation = useSpin();

  return (
    <View style={styles.loadingState}>
      <Animated.View
        style={{
          transform: [{ rotate: rotation }],
        }}
      >
        <MaterialCommunityIcons
          name="loading"
          size={30}
          color={COLORS.primary}
        />
      </Animated.View>

      <Text style={styles.loadingText}>Loading surgeries...</Text>
    </View>
  );
}

function EmptyState({
  canCreate,
  onCreate,
}: {
  canCreate: boolean;
  onCreate: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.emptyIcon}
      >
        <MaterialCommunityIcons
          name="calendar-blank-outline"
          size={34}
          color={COLORS.surface}
        />
      </LinearGradient>

      <Text style={styles.emptyTitle}>No Surgeries Yet</Text>

      <Text style={styles.emptySubtitle}>
        {canCreate
          ? 'Create your first surgery to get started'
          : 'Surgery updates will appear here'}
      </Text>

      {canCreate && (
        <Pressable onPress={onCreate}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.emptyButton}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={COLORS.surface}
            />
            <Text style={styles.emptyButtonText}>Create Surgery</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

function SurgeryCard({
  surgery,
  index,
  onPress,
}: {
  surgery: SurgeryOperation;
  index: number;
  onPress: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  const statusConfig = STATUS_COLORS[surgery.status];
  const isActive = ACTIVE_STATUSES.includes(surgery.status as any);
  const isEmergency = surgery.status === 'emergency';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  const date = toSafeDate(surgery.scheduledDate);

  const time = date
    ? date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--';

  const progressWidth =
    surgery.status === 'in_surgery'
      ? '60%'
      : surgery.status === 'recovery'
      ? '85%'
      : '20%';

  const progressLabel =
    surgery.status === 'pre_op'
      ? 'Preparing...'
      : surgery.status === 'in_surgery'
      ? 'In Progress'
      : 'Recovering';

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        style={({ pressed }) => [
          styles.surgeryCard,
          isEmergency && styles.emergencyCard,
          pressed && styles.pressed,
        ]}
      >
        <View
          style={[
            styles.accentBar,
            { backgroundColor: statusConfig.text },
          ]}
        />

        <View style={styles.surgeryContent}>
          <View style={styles.surgeryTopRow}>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName} numberOfLines={1}>
                {surgery.patientName}
              </Text>

              <Text style={styles.patientMeta}>
                {surgery.patientAge} yrs • {surgery.patientGender}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusConfig.bg,
                  borderColor: statusConfig.border,
                },
              ]}
            >
              {isActive && (
                <View
                  style={[
                    styles.pulseDot,
                    { backgroundColor: statusConfig.text },
                  ]}
                />
              )}

              <Text
                style={[
                  styles.statusText,
                  { color: statusConfig.text },
                ]}
              >
                {STATUS_LABELS[surgery.status]}
              </Text>
            </View>
          </View>

          <View style={styles.operationRow}>
            <MaterialCommunityIcons
              name="medical-bag"
              size={15}
              color={COLORS.primary}
            />
            <Text style={styles.operationType} numberOfLines={1}>
              {surgery.operationType}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="doctor"
                size={13}
                color={COLORS.textMuted}
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {surgery.doctorName}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="door-open"
                size={13}
                color={COLORS.textMuted}
              />
              <Text style={styles.metaText}>{surgery.otRoom}</Text>
            </View>

            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={13}
                color={COLORS.textMuted}
              />
              <Text style={styles.metaText}>{time}</Text>
            </View>
          </View>

          {isActive && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: progressWidth,
                      backgroundColor: statusConfig.text,
                    },
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.progressText,
                  { color: statusConfig.text },
                ]}
              >
                {progressLabel}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chevron}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={COLORS.textMuted}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [surgeries, setSurgeries] = useState<SurgeryOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(-14)).current;

  const userRole = user?.role ?? '';
  const isHospitalStaff = HOSPITAL_ROLES.includes(userRole as any);
  const isFamily = userRole === 'family';
  const canCreate = isHospitalStaff;
  const missingHospitalId = isHospitalStaff && !user?.hospitalId;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslate, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerOpacity, headerTranslate]);

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
      console.error(
        'Dashboard surgery subscription error:',
        error
      );

      setSurgeries([]);
      setLoading(false);
    };

    if (isHospitalStaff) {
      if (!user.hospitalId) {
        console.warn(
          'Hospital staff user has no hospitalId'
        );
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
        console.warn(
          'Family user has no phoneNumber'
        );
        setLoading(false);
        return;
      }

      unsubscribe = subscribeToSurgeriesByFamilyPhone(
        phoneNumber,
        handleData,
        handleError
      );
    } else {
      console.warn(
        'Unknown role; no surgery query started:',
        user.role
      );
      setLoading(false);
      return;
    }

    return () => {
      unsubscribe?.();
    };
  }, [
    isFamily,
    isHospitalStaff,
    user?.hospitalId,
    user?.phoneNumber,
    user?.role,
    user?.uid,
  ]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.selectionAsync();

    setTimeout(() => {
      setRefreshing(false);

      Toast.show({
        type: 'success',
        text1: 'Dashboard is up to date',
      });
    }, 700);
  }, []);

  const stats = useMemo(() => {
    return {
      total: surgeries.length,
      active: surgeries.filter((surgery) =>
        ACTIVE_STATUSES.includes(surgery.status as any)
      ).length,
      completed: surgeries.filter(
        (surgery) => surgery.status === 'completed'
      ).length,
      emergency: surgeries.filter(
        (surgery) => surgery.status === 'emergency'
      ).length,
      scheduled: surgeries.filter(
        (surgery) => surgery.status === 'scheduled'
      ).length,
    };
  }, [surgeries]);

  const filters: {
    id: FilterType;
    label: string;
    icon: string;
  }[] = [
    { id: 'all', label: 'All', icon: 'view-grid-outline' },
    { id: 'active', label: 'Active', icon: 'pulse' },
    { id: 'scheduled', label: 'Scheduled', icon: 'calendar-clock-outline' },
    { id: 'emergency', label: 'Emergency', icon: 'alert-circle-outline' },
  ];

  const filteredSurgeries = useMemo(() => {
    let result = surgeries;

    if (selectedFilter === 'active') {
      result = result.filter((surgery) =>
        ACTIVE_STATUSES.includes(surgery.status as any)
      );
    }

    if (selectedFilter === 'scheduled') {
      result = result.filter(
        (surgery) => surgery.status === 'scheduled'
      );
    }

    if (selectedFilter === 'emergency') {
      result = result.filter(
        (surgery) => surgery.status === 'emergency'
      );
    }

    const search = searchQuery.trim().toLowerCase();

    if (!search) {
      return result;
    }

    return result.filter(
      (surgery) =>
        surgery.patientName?.toLowerCase().includes(search) ||
        surgery.operationType?.toLowerCase().includes(search) ||
        surgery.doctorName?.toLowerCase().includes(search)
    );
  }, [searchQuery, selectedFilter, surgeries]);

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
  };

  const firstName = user?.displayName?.split(' ')[0] ?? 'there';
  const avatarInitial = (user?.displayName?.charAt(0) ?? 'U').toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslate }],
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{avatarInitial}</Text>
            </LinearGradient>

            <View style={styles.headerText}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {userRole === 'doctor' ? 'Dr. ' : ''}
                {firstName}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.iconButton}
              onPress={() => setSearchOpen((value) => !value)}
            >
              <MaterialCommunityIcons
                name={searchOpen ? 'close' : 'magnify'}
                size={20}
                color={COLORS.text}
              />
            </Pressable>

            <Pressable
              style={styles.iconButton}
              onPress={() =>
                navigation.navigate('Dashboard', {
                  screen: 'Notifications',
                })
              }
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={20}
                color={COLORS.text}
              />
              {stats.emergency > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats.emergency}</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={styles.iconButton}
              onPress={handleLogout}
            >
              <MaterialCommunityIcons
                name="logout-variant"
                size={20}
                color={COLORS.text}
              />
            </Pressable>
          </View>
        </Animated.View>

        {searchOpen && (
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
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        )}

        {missingHospitalId && (
          <View style={styles.warningBanner}>
            <MaterialCommunityIcons
              name="alert-outline"
              size={17}
              color={COLORS.warning}
            />
            <Text style={styles.warningText}>
              Your account has no hospital assigned. Contact your admin to see surgery data.
            </Text>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          <View style={styles.statsSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.overviewTitle}>Overview</Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>

            <HeroOverviewCard
              activeCount={stats.active}
              totalCount={stats.total}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.miniStatsRow}
            >
              <MiniStatCard
                icon="calendar-check-outline"
                label="Total Cases"
                value={stats.total}
                color={COLORS.primary}
                delay={100}
              />
              <MiniStatCard
                icon="check-circle-outline"
                label="Completed"
                value={stats.completed}
                color={COLORS.success}
                delay={160}
              />
              <MiniStatCard
                icon="alert-circle-outline"
                label="Emergency"
                value={stats.emergency}
                color={COLORS.error}
                delay={220}
              />
              <MiniStatCard
                icon="clock-outline"
                label="Scheduled"
                value={stats.scheduled}
                color={COLORS.info}
                delay={280}
              />
            </ScrollView>
          </View>

          <QuickActions navigation={navigation} canCreate={canCreate} />
          <OTRoomStatus surgeries={surgeries} />

          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {filters.map((filter) => {
                const active = selectedFilter === filter.id;

                return (
                  <Pressable
                    key={filter.id}
                    onPress={() => setSelectedFilter(filter.id)}
                    style={[
                      styles.filterTab,
                      active && styles.filterTabActive,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={filter.icon as any}
                      size={15}
                      color={
                        active ? COLORS.surface : COLORS.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.surgeriesSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>
                {selectedFilter === 'all'
                  ? 'Recent Surgeries'
                  : `${filters.find(
                      (filter) => filter.id === selectedFilter
                    )?.label} Surgeries`}
              </Text>
              <Text style={styles.sectionCount}>
                {filteredSurgeries.length} found
              </Text>
            </View>

            {loading ? (
              <LoadingState />
            ) : filteredSurgeries.length === 0 ? (
              <EmptyState
                canCreate={canCreate}
                onCreate={() => navigation.navigate('CreateSurgery')}
              />
            ) : (
              <View style={styles.surgeryList}>
                {filteredSurgeries.map((surgery, index) => (
                  <SurgeryCard
                    key={surgery.id}
                    surgery={surgery}
                    index={index}
                    onPress={() =>
                      navigation.navigate('SurgeryDetail', {
                        surgeryId: surgery.id,
                      })
                    }
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>

        {canCreate && (
          <Pressable
            style={styles.fab}
            onPress={() => navigation.navigate('CreateSurgery')}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.fabInner}
            >
              <MaterialCommunityIcons
                name="plus"
                size={26}
                color={COLORS.surface}
              />
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },

  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 48,
    height: 48,
    marginRight: 12,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },

  headerText: {
    flex: 1,
  },

  greeting: {
    fontSize: 12.5,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  userName: {
    marginTop: 1,
    fontSize: 19,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.background,
  },

  badgeText: {
    paddingHorizontal: 3,
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 24,
    marginBottom: 8,
    padding: 12,
    gap: 8,
    borderRadius: 14,
    backgroundColor: `${COLORS.warning}12`,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },

  statsSection: {
    paddingHorizontal: 24,
    marginTop: 8,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  overviewTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  dateText: {
    fontSize: 12.5,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },

  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20,
    padding: 24,
    borderRadius: 28,
    elevation: 8,
  },

  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surface,
  },

  liveText: {
    fontSize: 10.5,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
    letterSpacing: 0.6,
  },

  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
    gap: 14,
  },

  heroNumber: {
    fontSize: 58,
    lineHeight: 58,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },

  heroNumberZero: {
    fontSize: 40,
    color: 'rgba(255,255,255,0.55)',
  },

  heroInfo: {
    flex: 1,
    paddingBottom: 8,
  },

  heroLabel: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.surface,
  },

  heroDetail: {
    marginTop: 2,
    fontSize: 12.5,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.7)',
  },

  heroTrack: {
    height: 5,
    marginBottom: 10,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  heroFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.surface,
  },

  heroPercent: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.8)',
  },

  miniStatsRow: {
    paddingRight: 24,
    paddingBottom: 4,
    gap: 12,
  },

  miniCard: {
    width: 118,
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    elevation: 1,
  },

  miniIcon: {
    width: 36,
    height: 36,
    marginBottom: 10,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  miniValue: {
    marginBottom: 2,
    fontSize: 23,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  miniValueZero: {
    fontSize: 18,
    color: COLORS.textMuted,
  },

  miniLabel: {
    fontSize: 11.5,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginTop: 26,
  },

  quickAction: {
    alignItems: 'center',
    gap: 8,
  },

  quickCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },

  quickLabel: {
    fontSize: 11.5,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },

  sectionBlock: {
    paddingHorizontal: 24,
    marginTop: 28,
  },

  subSectionTitle: {
    marginBottom: 14,
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  roomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
  },

  roomDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  roomName: {
    fontSize: 12.5,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },

  roomStatus: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },

  filterSection: {
    marginTop: 28,
    paddingHorizontal: 24,
  },

  filterRow: {
    paddingRight: 24,
    gap: 10,
  },

  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  filterText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },

  filterTextActive: {
    fontFamily: FONTS.semiBold,
    color: COLORS.surface,
  },

  surgeriesSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },

  sectionTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  sectionCount: {
    fontSize: 12.5,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },

  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 14,
  },

  loadingText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 14,
  },

  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },

  emptySubtitle: {
    paddingHorizontal: 30,
    fontSize: 13.5,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 22,
    paddingVertical: 13,
    gap: 8,
    borderRadius: 26,
  },

  emptyButtonText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.surface,
  },

  surgeryList: {
    gap: 12,
  },

  surgeryCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    elevation: 3,
  },

  emergencyCard: {
    shadowColor: COLORS.error,
    shadowOpacity: 0.14,
  },

  accentBar: {
    width: 4,
  },

  surgeryContent: {
    flex: 1,
    padding: 18,
    paddingRight: 8,
  },

  surgeryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  patientInfo: {
    flex: 1,
    marginRight: 10,
  },

  patientName: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },

  patientMeta: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
  },

  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 10.5,
    fontFamily: FONTS.bold,
  },

  operationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },

  operationType: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },

  metaRow: {
    flexDirection: 'row',
    gap: 14,
  },

  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  progressContainer: {
    marginTop: 14,
  },

  progressTrack: {
    height: 4,
    overflow: 'hidden',
    borderRadius: 2,
    backgroundColor: COLORS.divider,
  },

  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  progressText: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: FONTS.medium,
  },

  chevron: {
    width: 28,
    height: 28,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 14,
    backgroundColor: COLORS.background,
  },

  bottomSpace: {
    height: 120,
  },

  fab: {
    position: 'absolute',
    right: 24,
    bottom: 28,
    elevation: 8,
  },

  fabInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pressed: {
    opacity: 0.8,
  },
});