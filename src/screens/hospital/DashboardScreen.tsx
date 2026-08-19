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
import { useIsFocused, useNavigation } from '@react-navigation/native';
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
  'pre_op',
  'in_surgery',
  'recovery',
] as const;

type FilterType =
  | 'all'
  | 'active'
  | 'scheduled'
  | 'completed'
  | 'emergency';

type ConnectionState =
  | 'connecting'
  | 'live'
  | 'error'
  | 'offline';

type DateLike = Date | string | number | { toDate?: () => Date } | null | undefined;

function isHospitalRole(role: unknown): boolean {
  return HOSPITAL_ROLES.includes(String(role ?? '').trim().toLowerCase() as any);
}

function isActiveStatus(status: unknown): boolean {
  return ACTIVE_STATUSES.includes(String(status ?? '') as any);
}

function toSafeDate(value: DateLike): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (
    typeof value === 'object' &&
    typeof value.toDate === 'function'
  ) {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime())
      ? date
      : null;
  }

  const date = new Date(value as string | number);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTime(value: DateLike): string {
  const date = toSafeDate(value);

  if (!date) return 'Time not set';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTime(value: DateLike): string {
  const date = toSafeDate(value);

  if (!date) return 'Schedule not set';

  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

function getStatusLabel(status: string): string {
  return (
    STATUS_LABELS[status as keyof typeof STATUS_LABELS] ??
    status.replace(/_/g, ' ')
  );
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'pre_op':
      return 'clipboard-clock-outline';
    case 'in_surgery':
      return 'heart-pulse';
    case 'recovery':
      return 'bed-outline';
    case 'completed':
      return 'check-circle-outline';
    case 'cancelled':
      return 'close-circle-outline';
    case 'emergency':
      return 'alert-decagram-outline';
    default:
      return 'calendar-clock-outline';
  }
}

function useAnimatedNumber(target: number, duration = 600): number {
  const value = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    value.stopAnimation();
    value.setValue(0);

    const listenerId = value.addListener(({ value: current }) => {
      setDisplayValue(Math.round(current));
    });

    Animated.timing(value, {
      toValue: target,
      duration,
      useNativeDriver: false,
    }).start();

    return () => {
      value.removeListener(listenerId);
    };
  }, [duration, target, value]);

  return displayValue;
}

function useRotation(): Animated.AnimatedInterpolation<string> {
  const rotationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotationValue, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [rotationValue]);

  return rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
}

function CircularIconButton({
  icon,
  onPress,
  disabled = false,
  badge,
  accessibilityLabel,
}: {
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  badge?: number;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.circularButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={19}
        color={COLORS.text}
      />

      {typeof badge === 'number' && badge > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>
            {badge > 9 ? '9+' : badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function LiveIndicator({
  state,
}: {
  state: ConnectionState;
}) {
  const config: Record<
    ConnectionState,
    { label: string; color: string; icon: string }
  > = {
    connecting: {
      label: 'Connecting',
      color: COLORS.warning,
      icon: 'sync',
    },
    live: {
      label: 'Live updates',
      color: COLORS.success,
      icon: 'access-point',
    },
    error: {
      label: 'Connection error',
      color: COLORS.error,
      icon: 'alert-circle-outline',
    },
    offline: {
      label: 'Offline',
      color: COLORS.textMuted,
      icon: 'cloud-off-outline',
    },
  };

  const item = config[state];

  return (
    <View
      style={[
        styles.liveIndicator,
        {
          backgroundColor: `${item.color}12`,
          borderColor: `${item.color}30`,
        },
      ]}
    >
      <View
        style={[
          styles.liveIndicatorDot,
          { backgroundColor: item.color },
        ]}
      />
      <Text
        style={[
          styles.liveIndicatorText,
          { color: item.color },
        ]}
      >
        {item.label}
      </Text>
    </View>
  );
}

function HeroCard({
  active,
  totalToday,
  connectionState,
}: {
  active: number;
  totalToday: number;
  connectionState: ConnectionState;
}) {
  const animatedActive = useAnimatedNumber(active);
  const progress =
    totalToday > 0
      ? Math.min(100, Math.round((active / totalToday) * 100))
      : 0;

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroCard}
    >
      <View style={styles.heroOrbOne} />
      <View style={styles.heroOrbTwo} />

      <View style={styles.heroHeader}>
        <View>
          <Text style={styles.heroEyebrow}>OPERATING ROOM OVERVIEW</Text>
          <Text style={styles.heroTitle}>Today in progress</Text>
        </View>

        <MaterialCommunityIcons
          name="heart-pulse"
          size={28}
          color={COLORS.surface}
        />
      </View>

      <View style={styles.heroMetricRow}>
        <Text style={styles.heroNumber}>{animatedActive}</Text>

        <View style={styles.heroMetricCopy}>
          <Text style={styles.heroMetricLabel}>
            Active surgeries
          </Text>
          <Text style={styles.heroMetricSubtext}>
            {totalToday} scheduled today
          </Text>
        </View>
      </View>

      <View style={styles.heroProgressTrack}>
        <View
          style={[
            styles.heroProgressFill,
            { width: `${progress}%` },
          ]}
        />
      </View>

      <View style={styles.heroFooter}>
        <Text style={styles.heroProgressText}>
          {progress}% of today’s schedule in progress
        </Text>
        <LiveIndicator state={connectionState} />
      </View>
    </LinearGradient>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  const animatedValue = useAnimatedNumber(value);

  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIconCircle,
          { backgroundColor: `${color}16` },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={18}
          color={color}
        />
      </View>

      <Text style={styles.statValue}>{animatedValue}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.quickActionCircle,
          { backgroundColor: `${color}16` },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={21}
          color={color}
        />
      </View>

      <Text style={styles.quickActionText}>{label}</Text>
    </Pressable>
  );
}

function UpcomingCard({
  surgery,
  onPress,
}: {
  surgery: SurgeryOperation;
  onPress: () => void;
}) {
  const status = getStatusConfig(surgery.status);
  const date = toSafeDate(surgery.scheduledDate);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.upcomingCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.upcomingHeader}>
        <View style={styles.upcomingIconCircle}>
          <MaterialCommunityIcons
            name="calendar-clock-outline"
            size={19}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.upcomingCopy}>
          <Text style={styles.upcomingEyebrow}>
            NEXT SCHEDULED CASE
          </Text>
          <Text style={styles.upcomingTitle} numberOfLines={1}>
            {surgery.operationType || 'Surgery'}
          </Text>
          <Text style={styles.upcomingPatient} numberOfLines={1}>
            {surgery.patientName || 'Patient'}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: status.bg,
              borderColor: status.border,
            },
          ]}
        >
          <Text style={[styles.statusBadgeText, { color: status.text }]}>
            {getStatusLabel(surgery.status)}
          </Text>
        </View>
      </View>

      <View style={styles.upcomingDivider} />

      <View style={styles.upcomingMetaRow}>
        <View style={styles.upcomingMeta}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={15}
            color={COLORS.textMuted}
          />
          <Text style={styles.upcomingMetaText}>
            {date ? formatTime(date) : 'Time not set'}
          </Text>
        </View>

        <View style={styles.upcomingMeta}>
          <MaterialCommunityIcons
            name="doctor"
            size={15}
            color={COLORS.textMuted}
          />
          <Text style={styles.upcomingMetaText} numberOfLines={1}>
            {surgery.doctorName || 'Doctor not assigned'}
          </Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={19}
          color={COLORS.textMuted}
        />
      </View>
    </Pressable>
  );
}

function RoomStatus({
  surgeries,
}: {
  surgeries: SurgeryOperation[];
}) {
  const rooms = useMemo(() => {
    const roomMap = new Map<
      string,
      { room: string; surgery?: SurgeryOperation }
    >();

    surgeries.forEach((surgery) => {
      const room = surgery.otRoom?.trim();

      if (!room) return;

      const existing = roomMap.get(room);

      if (
        !existing ||
        (isActiveStatus(surgery.status) &&
          !isActiveStatus(existing.surgery?.status))
      ) {
        roomMap.set(room, { room, surgery });
      }
    });

    return Array.from(roomMap.values()).slice(0, 6);
  }, [surgeries]);

  if (rooms.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Operating rooms</Text>
          <Text style={styles.sectionSubtitle}>
            Current room availability
          </Text>
        </View>

        <MaterialCommunityIcons
          name="door-open"
          size={21}
          color={COLORS.primary}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.roomScroll}
      >
        {rooms.map(({ room, surgery }) => {
          const occupied = Boolean(
            surgery && isActiveStatus(surgery.status)
          );
          const color = occupied ? COLORS.error : COLORS.success;

          return (
            <View
              key={room}
              style={[
                styles.roomCard,
                {
                  borderColor: `${color}35`,
                  backgroundColor: `${color}0D`,
                },
              ]}
            >
              <View
                style={[
                  styles.roomStatusDot,
                  { backgroundColor: color },
                ]}
              />
              <Text style={styles.roomName}>{room}</Text>
              <Text style={[styles.roomAvailability, { color }]}>
                {occupied ? 'In use' : 'Available'}
              </Text>
            </View>
          );
        })}
      </ScrollView>
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
  const translateY = useRef(new Animated.Value(12)).current;

  const status = getStatusConfig(surgery.status);
  const active = isActiveStatus(surgery.status);
  const date = toSafeDate(surgery.scheduledDate);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay: Math.min(index * 45, 300),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        delay: Math.min(index * 45, 300),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  const progress =
    surgery.status === 'pre_op'
      ? 20
      : surgery.status === 'in_surgery'
        ? 60
        : surgery.status === 'recovery'
          ? 85
          : 0;

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.surgeryCard,
          surgery.status === 'emergency' && styles.emergencyCard,
          pressed && styles.pressed,
        ]}
      >
        <View
          style={[
            styles.surgeryAccent,
            { backgroundColor: status.text },
          ]}
        />

        <View style={styles.surgeryBody}>
          <View style={styles.surgeryHeader}>
            <View style={styles.patientCopy}>
              <Text style={styles.patientName} numberOfLines={1}>
                {surgery.patientName || 'Unnamed patient'}
              </Text>

              <Text style={styles.patientMeta} numberOfLines={1}>
                {surgery.patientAge
                  ? `${surgery.patientAge} yrs`
                  : 'Age not provided'}
                {surgery.patientGender
                  ? ` • ${surgery.patientGender}`
                  : ''}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: status.bg,
                  borderColor: status.border,
                },
              ]}
            >
              {active && (
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: status.text },
                  ]}
                />
              )}

              <Text style={[styles.statusBadgeText, { color: status.text }]}>
                {getStatusLabel(surgery.status)}
              </Text>
            </View>
          </View>

          <View style={styles.procedureRow}>
            <View style={styles.procedureIconCircle}>
              <MaterialCommunityIcons
                name={getStatusIcon(surgery.status) as any}
                size={16}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.procedureText} numberOfLines={1}>
              {surgery.operationType || 'Procedure not specified'}
            </Text>
          </View>

          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <MaterialCommunityIcons
                name="doctor"
                size={14}
                color={COLORS.textMuted}
              />
              <Text style={styles.metadataText} numberOfLines={1}>
                {surgery.doctorName || 'Doctor not assigned'}
              </Text>
            </View>

            <View style={styles.metadataItem}>
              <MaterialCommunityIcons
                name="door-open"
                size={14}
                color={COLORS.textMuted}
              />
              <Text style={styles.metadataText}>
                {surgery.otRoom || 'OT pending'}
              </Text>
            </View>
          </View>

          <View style={styles.scheduleRow}>
            <MaterialCommunityIcons
              name="calendar-clock-outline"
              size={14}
              color={COLORS.textMuted}
            />
            <Text style={styles.scheduleText}>
              {date ? formatDateTime(date) : 'Schedule not set'}
            </Text>
          </View>

          {active && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: status.text,
                    },
                  ]}
                />
              </View>

              <Text style={[styles.progressLabel, { color: status.text }]}>
                {surgery.status === 'pre_op'
                  ? 'Preparing for surgery'
                  : surgery.status === 'in_surgery'
                    ? 'Procedure in progress'
                    : 'Patient recovering'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardChevron}>
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
  const isFocused = useIsFocused();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [surgeries, setSurgeries] = useState<SurgeryOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('connecting');

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(-8)).current;
  const rotation = useRotation();

  const role = String(user?.role ?? '').trim().toLowerCase();
  const isHospitalStaff = isHospitalRole(role);
  const isFamily = role === 'family';
  const canCreate = isHospitalStaff;

  const firstName =
    user?.displayName?.trim().split(/\s+/)[0] || 'there';

  const avatarInitial =
    user?.displayName?.trim().charAt(0).toUpperCase() || 'U';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslate, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerOpacity, headerTranslate]);

  useEffect(() => {
    if (!isFocused) return;

    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    setLoading(true);
    setConnectionState('connecting');

    if (!user) {
      setSurgeries([]);
      setLoading(false);
      setConnectionState('offline');
      return;
    }

    const handleData = (data: SurgeryOperation[]) => {
      if (!mounted) return;

      setSurgeries(Array.isArray(data) ? data : []);
      setLoading(false);
      setConnectionState('live');
    };

    const handleError = (error: Error) => {
      if (!mounted) return;

      console.error('Dashboard surgery subscription error:', error);
      setLoading(false);
      setConnectionState('error');

      Toast.show({
        type: 'error',
        text1: 'Unable to load live surgery data',
        text2: 'Check your account access and connection.',
      });
    };

    if (isHospitalStaff) {
      const hospitalId = user.hospitalId?.trim();

      if (!hospitalId) {
        setSurgeries([]);
        setLoading(false);
        setConnectionState('error');

        Toast.show({
          type: 'error',
          text1: 'Hospital not assigned',
          text2: 'Ask an administrator to update your account.',
        });
      } else {
        unsubscribe = subscribeToSurgeriesByHospital(
          hospitalId,
          handleData,
          handleError
        );
      }
    } else if (isFamily) {
      const phoneNumber = user.phoneNumber?.trim();

      if (!phoneNumber) {
        setSurgeries([]);
        setLoading(false);
        setConnectionState('error');

        Toast.show({
          type: 'error',
          text1: 'Phone number not found',
          text2: 'Your family account has no linked phone number.',
        });
      } else {
        unsubscribe = subscribeToSurgeriesByFamilyPhone(
          phoneNumber,
          handleData,
          handleError
        );
      }
    } else {
      setSurgeries([]);
      setLoading(false);
      setConnectionState('error');
    }

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [
    isFocused,
    isFamily,
    isHospitalStaff,
    user?.hospitalId,
    user?.phoneNumber,
    user?.role,
    user?.uid,
  ]);

  const today = useMemo(() => new Date(), []);

  const stats = useMemo(() => {
    const todaySurgeries = surgeries.filter((surgery) => {
      const date = toSafeDate(surgery.scheduledDate);
      return date ? isSameDay(date, today) : false;
    });

    return {
      todayTotal: todaySurgeries.length,
      active: todaySurgeries.filter((surgery) =>
        isActiveStatus(surgery.status)
      ).length,
      scheduled: todaySurgeries.filter(
        (surgery) => surgery.status === 'scheduled'
      ).length,
      completed: todaySurgeries.filter(
        (surgery) => surgery.status === 'completed'
      ).length,
      emergency: todaySurgeries.filter(
        (surgery) => surgery.status === 'emergency'
      ).length,
    };
  }, [surgeries, today]);

  const upcomingSurgery = useMemo(() => {
    const now = Date.now();

    return surgeries
      .filter((surgery) => {
        const date = toSafeDate(surgery.scheduledDate);
        return (
          date &&
          date.getTime() >= now &&
          !['completed', 'cancelled'].includes(surgery.status)
        );
      })
      .sort((first, second) => {
        const firstDate =
          toSafeDate(first.scheduledDate)?.getTime() ?? Infinity;
        const secondDate =
          toSafeDate(second.scheduledDate)?.getTime() ?? Infinity;

        return firstDate - secondDate;
      })[0];
  }, [surgeries]);

  const filteredSurgeries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const result = surgeries.filter((surgery) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && isActiveStatus(surgery.status)) ||
        (filter === 'scheduled' && surgery.status === 'scheduled') ||
        (filter === 'completed' && surgery.status === 'completed') ||
        (filter === 'emergency' && surgery.status === 'emergency');

      if (!matchesFilter) return false;
      if (!query) return true;

      return [
        surgery.patientName,
        surgery.doctorName,
        surgery.operationType,
        surgery.department,
        surgery.otRoom,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );
    });

    return result.sort((first, second) => {
      const firstDate =
        toSafeDate(first.scheduledDate)?.getTime() ?? Infinity;
      const secondDate =
        toSafeDate(second.scheduledDate)?.getTime() ?? Infinity;

      return firstDate - secondDate;
    });
  }, [filter, searchQuery, surgeries]);

  const filters: {
    id: FilterType;
    label: string;
    icon: string;
    count?: number;
  }[] = [
    { id: 'all', label: 'All', icon: 'view-grid-outline', count: surgeries.length },
    { id: 'active', label: 'Active', icon: 'pulse', count: surgeries.filter((s) => isActiveStatus(s.status)).length },
    { id: 'scheduled', label: 'Scheduled', icon: 'calendar-clock-outline', count: stats.scheduled },
    { id: 'completed', label: 'Completed', icon: 'check-circle-outline', count: stats.completed },
    { id: 'emergency', label: 'Emergency', icon: 'alert-circle-outline', count: stats.emergency },
  ];

  const handleRefresh = useCallback(() => {
    if (refreshing) return;

    setRefreshing(true);
    setConnectionState('connecting');
    Haptics.selectionAsync();

    setTimeout(() => {
      setRefreshing(false);

      if (connectionState !== 'error') {
        setConnectionState('live');
        Toast.show({
          type: 'success',
          text1: 'Dashboard updated',
        });
      }
    }, 700);
  }, [connectionState, refreshing]);

  const handleLogout = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
  }, [logout]);

  const navigateToNotifications = useCallback(() => {
    navigation.navigate('Dashboard', {
      screen: 'Notifications',
    });
  }, [navigation]);

  const navigateToCalendar = useCallback(() => {
    navigation.navigate('Dashboard', {
      screen: 'Calendar',
    });
  }, [navigation]);

  const renderLoading = () => (
    <View style={styles.loadingState}>
      <Animated.View style={{ transform: [{ rotate: rotation }] }}>
        <MaterialCommunityIcons
          name="loading"
          size={30}
          color={COLORS.primary}
        />
      </Animated.View>
      <Text style={styles.loadingText}>
        Connecting to live surgery data…
      </Text>
    </View>
  );

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
          <View style={styles.headerIdentity}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{avatarInitial}</Text>
            </LinearGradient>

            <View style={styles.headerText}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {role === 'doctor' ? 'Dr. ' : ''}
                {firstName}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <CircularIconButton
              icon={searchOpen ? 'close' : 'magnify'}
              onPress={() => setSearchOpen((current) => !current)}
              accessibilityLabel={searchOpen ? 'Close search' : 'Open search'}
            />

            <CircularIconButton
              icon="bell-outline"
              onPress={navigateToNotifications}
              badge={stats.emergency}
              accessibilityLabel="Open notifications"
            />

            <CircularIconButton
              icon="logout-variant"
              onPress={handleLogout}
              accessibilityLabel="Log out"
            />
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
              placeholder="Search patient, doctor, procedure, OT…"
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />

            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                style={styles.searchClear}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={COLORS.textMuted}
                />
              </Pressable>
            )}
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          <View style={styles.pageIntro}>
            <View>
              <Text style={styles.pageTitle}>Surgery overview</Text>
              <Text style={styles.pageSubtitle}>
                {isFamily
                  ? 'Your assigned surgery updates'
                  : 'Live hospital operating-room activity'}
              </Text>
            </View>

            <Pressable
              onPress={navigateToCalendar}
              style={styles.todayPill}
            >
              <MaterialCommunityIcons
                name="calendar-today"
                size={14}
                color={COLORS.primary}
              />
              <Text style={styles.todayPillText}>Today</Text>
            </Pressable>
          </View>

          <HeroCard
            active={stats.active}
            totalToday={stats.todayTotal}
            connectionState={connectionState}
          />

          <View style={styles.statsGrid}>
            <StatCard
              icon="calendar-check-outline"
              label="Today"
              value={stats.todayTotal}
              color={COLORS.primary}
            />
            <StatCard
              icon="pulse"
              label="Active"
              value={stats.active}
              color={COLORS.warning}
            />
            <StatCard
              icon="check-circle-outline"
              label="Completed"
              value={stats.completed}
              color={COLORS.success}
            />
            <StatCard
              icon="alert-circle-outline"
              label="Emergency"
              value={stats.emergency}
              color={COLORS.error}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Quick actions</Text>
                <Text style={styles.sectionSubtitle}>
                  Frequently used tools
                </Text>
              </View>
            </View>

            <View style={styles.quickActionsRow}>
              {canCreate && (
                <QuickAction
                  icon="plus"
                  label="New case"
                  color={COLORS.primary}
                  onPress={() => navigation.navigate('CreateSurgery')}
                />
              )}

              <QuickAction
                icon="calendar-month"
                label="Calendar"
                color={COLORS.success}
                onPress={navigateToCalendar}
              />

              <QuickAction
                icon="bell-outline"
                label="Alerts"
                color={COLORS.info}
                onPress={navigateToNotifications}
              />

              <QuickAction
                icon="view-list-outline"
                label="All cases"
                color={COLORS.warning}
                onPress={() =>
                  navigation.navigate('Dashboard', {
                    screen: 'AllSurgeries',
                  })
                }
              />
            </View>
          </View>

          {upcomingSurgery && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Coming up</Text>
                  <Text style={styles.sectionSubtitle}>
                    Your next scheduled case
                  </Text>
                </View>
              </View>

              <UpcomingCard
                surgery={upcomingSurgery}
                onPress={() =>
                  navigation.navigate('SurgeryDetail', {
                    surgeryId: upcomingSurgery.id,
                  })
                }
              />
            </View>
          )}

          {!isFamily && <RoomStatus surgeries={surgeries} />}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {filter === 'all'
                    ? 'Surgery queue'
                    : `${filters.find((item) => item.id === filter)?.label} cases`}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {filteredSurgeries.length} result
                  {filteredSurgeries.length === 1 ? '' : 's'}
                </Text>
              </View>

              <LiveIndicator state={connectionState} />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {filters.map((item) => {
                const active = filter === item.id;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFilter(item.id);
                    }}
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={14}
                      color={
                        active
                          ? COLORS.surface
                          : COLORS.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.filterChipCount,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {item.count ?? 0}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {loading ? (
              renderLoading()
            ) : filteredSurgeries.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <MaterialCommunityIcons
                    name="clipboard-text-clock-outline"
                    size={30}
                    color={COLORS.primary}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  No surgeries found
                </Text>

                <Text style={styles.emptySubtitle}>
                  {searchQuery.trim()
                    ? 'Try a different search term.'
                    : filter === 'all'
                      ? 'Surgery updates will appear here.'
                      : 'There are no cases in this category.'}
                </Text>

                {searchQuery.trim() && (
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    style={styles.clearSearchButton}
                  >
                    <Text style={styles.clearSearchButtonText}>
                      Clear search
                    </Text>
                  </Pressable>
                )}

                {canCreate && filter === 'all' && !searchQuery && (
                  <Pressable
                    onPress={() => navigation.navigate('CreateSurgery')}
                    style={styles.createEmptyButton}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={17}
                      color={COLORS.surface}
                    />
                    <Text style={styles.createEmptyButtonText}>
                      Create surgery
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={styles.surgeryList}>
                {filteredSurgeries.slice(0, 12).map((surgery, index) => (
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

                {filteredSurgeries.length > 12 && (
                  <Pressable
                    onPress={() =>
                      navigation.navigate('Dashboard', {
                        screen: 'AllSurgeries',
                      })
                    }
                    style={styles.viewAllButton}
                  >
                    <Text style={styles.viewAllText}>
                      View all {filteredSurgeries.length} surgeries
                    </Text>
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={16}
                      color={COLORS.primary}
                    />
                  </Pressable>
                )}
              </View>
            )}
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>

        {canCreate && (
          <Pressable
            onPress={() => navigation.navigate('CreateSurgery')}
            style={({ pressed }) => [
              styles.fab,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create surgery"
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.fabInner}
            >
              <MaterialCommunityIcons
                name="plus"
                size={25}
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
    paddingBottom: 120,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },

  headerIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  avatarText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  greeting: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  userName: {
    marginTop: 1,
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },

  circularButton: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.background,
  },

  notificationBadgeText: {
    fontSize: 8,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 11,
    marginLeft: 8,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },

  searchClear: {
    padding: 4,
  },

  pageIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 14,
  },

  pageTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  pageSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  todayPillText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 24,
    elevation: 5,
  },

  heroOrbOne: {
    position: 'absolute',
    top: -40,
    right: -24,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  heroOrbTwo: {
    position: 'absolute',
    bottom: -55,
    left: 80,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  heroEyebrow: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.72)',
  },

  heroTitle: {
    marginTop: 3,
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.surface,
  },

  heroMetricRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 20,
  },

  heroNumber: {
    fontSize: 54,
    lineHeight: 56,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },

  heroMetricCopy: {
    marginLeft: 12,
    paddingBottom: 7,
  },

  heroMetricLabel: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.surface,
  },

  heroMetricSubtext: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.72)',
  },

  heroProgressTrack: {
    height: 5,
    marginTop: 18,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  heroProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.surface,
  },

  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  heroProgressText: {
    flex: 1,
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.8)',
  },

  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },

  liveIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  liveIndicatorText: {
    fontSize: 8,
    fontFamily: FONTS.bold,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },

  statCard: {
    flex: 1,
    minHeight: 105,
    padding: 11,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    marginTop: 8,
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  statLabel: {
    marginTop: 1,
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },

  section: {
    marginTop: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 10.5,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 14,
  },

  quickAction: {
    alignItems: 'center',
    width: 74,
  },

  quickActionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickActionText: {
    marginTop: 6,
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  upcomingCard: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  upcomingIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },

  upcomingCopy: {
    flex: 1,
    marginHorizontal: 10,
  },

  upcomingEyebrow: {
    fontSize: 8,
    fontFamily: FONTS.bold,
    letterSpacing: 0.6,
    color: COLORS.textMuted,
  },

  upcomingTitle: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },

  upcomingPatient: {
    marginTop: 1,
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  upcomingDivider: {
    height: 1,
    marginVertical: 12,
    backgroundColor: COLORS.divider,
  },

  upcomingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  upcomingMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  upcomingMetaText: {
    flex: 1,
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },

  roomScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },

  roomCard: {
    minWidth: 108,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
  },

  roomStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginBottom: 8,
  },

  roomName: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },

  roomAvailability: {
    marginTop: 2,
    fontSize: 10,
    fontFamily: FONTS.medium,
  },

  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 7,
  },

  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  filterChipText: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },

  filterChipTextActive: {
    color: COLORS.surface,
  },

  filterChipCount: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
  },

  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 55,
    gap: 10,
  },

  loadingText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },

  surgeryList: {
    paddingHorizontal: 16,
    gap: 10,
  },

  surgeryCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
  },

  emergencyCard: {
    borderColor: `${COLORS.error}45`,
  },

  surgeryAccent: {
    width: 4,
  },

  surgeryBody: {
    flex: 1,
    padding: 14,
    paddingRight: 6,
  },

  surgeryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  patientCopy: {
    flex: 1,
    marginRight: 8,
  },

  patientName: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },

  patientMeta: {
    marginTop: 2,
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
  },

  statusBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  procedureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 7,
  },

  procedureIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },

  procedureText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },

  metadataRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 9,
  },

  metadataItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metadataText: {
    flex: 1,
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },

  scheduleText: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },

  progressContainer: {
    marginTop: 10,
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

  progressLabel: {
    marginTop: 5,
    fontSize: 9,
    fontFamily: FONTS.medium,
  },

  cardChevron: {
    width: 26,
    height: 26,
    alignSelf: 'center',
    marginRight: 9,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 50,
  },

  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  emptySubtitle: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  clearSearchButton: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
  },

  clearSearchButtonText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  createEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },

  createEmptyButtonText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.surface,
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
  },

  viewAllText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  bottomSpace: {
    height: 60,
  },

  fab: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    elevation: 8,
  },

  fabInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressed: {
    opacity: 0.78,
  },

  disabled: {
    opacity: 0.5,
  },
});