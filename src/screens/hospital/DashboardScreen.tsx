import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Pressable,
  Animated,
  RefreshControl,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS, STATUS_COLORS, STATUS_LABELS } from '@/constants';
import { SurgeryOperation } from '@/types';
import {
  subscribeToSurgeries,
  subscribeToSurgeriesByHospital,
  subscribeToSurgeriesByFamilyPhone,
} from '@/services/surgery';
import { useAuthStore } from '@/hooks/useAuthStore';

const HOSPITAL_ROLES = ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist'];
const DOCTOR_ROLES = ['doctor'];
const ACTIVE_STATUSES = ['in_surgery', 'pre_op', 'recovery'];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function toSafeDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function useAnimatedCount(target: number, duration: number = 800) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.setValue(0);
    const listener = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });
    Animated.timing(animatedValue, { toValue: target, duration, useNativeDriver: false }).start();
    return () => animatedValue.removeListener(listener);
  }, [target]);

  return displayValue;
}

function useSpin() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 900, useNativeDriver: true })).start();
  }, []);
  return spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
}

function SmartNumber({ value, style, zeroStyle }: { value: number; style: any; zeroStyle: any }) {
  if (value === 0) {
    return <Text style={[style, zeroStyle]}>0</Text>;
  }
  return <Text style={style}>{value}</Text>;
}

interface HeroStatProps {
  activeCount: number;
  totalCount: number;
}

function HeroOverviewCard({ activeCount, totalCount }: HeroStatProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const count = useAnimatedCount(activeCount);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const percentage = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.heroCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroGlowCircle} />

        <View style={styles.heroTopRow}>
          <View style={styles.heroLabelChip}>
            <View style={styles.heroLiveDot} />
            <Text style={styles.heroLabelText}>LIVE NOW</Text>
          </View>
          <View style={styles.heroIconChip}>
            <MaterialCommunityIcons name="pulse" size={16} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.heroMainRow}>
          <SmartNumber value={count} style={styles.heroBigNumber} zeroStyle={styles.heroBigNumberZero} />
          <View style={styles.heroSubInfo}>
            <Text style={styles.heroSubLabel}>Active Surgeries</Text>
            <Text style={styles.heroSubDetail}>of {totalCount} total today</Text>
          </View>
        </View>

        <View style={styles.heroProgressTrack}>
          <View style={[styles.heroProgressFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.heroPercentText}>{percentage}% of today's cases in progress</Text>
      </LinearGradient>
    </Animated.View>
  );
}

interface MiniStatProps {
  icon: string;
  label: string;
  value: number;
  color: string;
  trend?: string;
  delay: number;
}

function MiniStatCard({ icon, label, value, color, trend, delay }: MiniStatProps) {
  const count = useAnimatedCount(value);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.miniStatCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.miniStatIconCircle, { backgroundColor: color + '18' }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={color} />
      </View>
      <SmartNumber value={count} style={styles.miniStatValue} zeroStyle={styles.miniStatValueZero} />
      <Text style={styles.miniStatLabel}>{label}</Text>
      {trend && (
        <View style={styles.miniStatTrendRow}>
          <MaterialCommunityIcons name="trending-up" size={11} color={COLORS.success} />
          <Text style={styles.miniStatTrend}>{trend}</Text>
        </View>
      )}
    </Animated.View>
  );
}

function QuickActions({ navigation, canCreate }: { navigation: any; canCreate: boolean }) {
  const handleComingSoon = (label: string) => {
    Haptics.selectionAsync();
    Toast.show({ type: 'info', text1: label, text2: 'This feature is coming soon' });
  };

  const actions = [
    { icon: 'plus-circle', label: 'New Case', color: COLORS.primary, onPress: () => navigation.navigate('CreateSurgery'), show: canCreate },
    { icon: 'account-group', label: 'Patients', color: COLORS.info, onPress: () => handleComingSoon('Patients'), show: true },
    { icon: 'calendar-month', label: 'Calendar', color: COLORS.success, onPress: () => navigation.navigate('Calendar'), show: true },
    { icon: 'file-chart', label: 'Reports', color: '#F59E0B', onPress: () => handleComingSoon('Reports'), show: canCreate },
  ].filter((a) => a.show);

  return (
    <View style={styles.quickActionsRow}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          style={({ pressed }) => [styles.quickActionItem, pressed && { opacity: 0.7 }]}
          onPress={() => {
            Haptics.selectionAsync();
            action.onPress();
          }}
        >
          <View style={[styles.quickActionCircle, { backgroundColor: action.color + '16' }]}>
            <MaterialCommunityIcons name={action.icon as any} size={22} color={action.color} />
          </View>
          <Text style={styles.quickActionLabel}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function OTRoomStatus({ surgeries }: { surgeries: SurgeryOperation[] }) {
  const occupiedRooms = new Set(
    surgeries.filter((s) => ACTIVE_STATUSES.includes(s.status)).map((s) => s.otRoom)
  );
  const allRooms = Array.from(new Set(surgeries.map((s) => s.otRoom))).slice(0, 6);

  if (allRooms.length === 0) return null;

  return (
    <View style={styles.otSection}>
      <Text style={styles.subSectionTitle}>OT Room Status</Text>
      <View style={styles.otGrid}>
        {allRooms.map((room) => {
          const isOccupied = occupiedRooms.has(room);
          return (
            <View key={room} style={[styles.otRoomChip, isOccupied ? styles.otRoomOccupied : styles.otRoomFree]}>
              <View style={[styles.otDot, { backgroundColor: isOccupied ? COLORS.error : COLORS.success }]} />
              <Text style={styles.otRoomName}>{room}</Text>
              <Text style={[styles.otRoomStatus, { color: isOccupied ? COLORS.error : COLORS.success }]}>
                {isOccupied ? 'In Use' : 'Free'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function RecentActivity({ surgeries }: { surgeries: SurgeryOperation[] }) {
  const recent = [...surgeries]
    .sort((a, b) => {
      const dateA = toSafeDate(a.scheduledDate)?.getTime() ?? 0;
      const dateB = toSafeDate(b.scheduledDate)?.getTime() ?? 0;
      return dateB - dateA;
    })
    .slice(0, 4);

  if (recent.length === 0) return null;

  const getActivityIcon = (status: string) => {
    if (status === 'completed') return 'check-circle';
    if (status === 'in_surgery') return 'pulse';
    if (status === 'emergency') return 'alert-circle';
    return 'calendar-clock';
  };

  return (
    <View style={styles.activitySection}>
      <Text style={styles.subSectionTitle}>Recent Activity</Text>
      <View style={styles.activityList}>
        {recent.map((surgery, i) => {
          const statusConfig = STATUS_COLORS[surgery.status];
          return (
            <View key={surgery.id} style={styles.activityRow}>
              <View style={[styles.activityIconCircle, { backgroundColor: statusConfig.bg }]}>
                <MaterialCommunityIcons name={getActivityIcon(surgery.status) as any} size={14} color={statusConfig.text} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityText} numberOfLines={1}>
                  <Text style={styles.activityBold}>{surgery.patientName}</Text> — {STATUS_LABELS[surgery.status]}
                </Text>
                <Text style={styles.activityTime}>{surgery.otRoom} • {surgery.doctorName}</Text>
              </View>
              {i < recent.length - 1 && <View style={styles.activityLine} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface SurgeryCardProps {
  surgery: SurgeryOperation;
  index: number;
  onPress: () => void;
}

function SurgeryCard({ surgery, index, onPress }: SurgeryCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const statusConfig = STATUS_COLORS[surgery.status];
  const statusLabel = STATUS_LABELS[surgery.status];
  const isEmergency = surgery.status === 'emergency';
  const isActive = ACTIVE_STATUSES.includes(surgery.status);

  const formatTime = (dateValue: any) => {
    const date = toSafeDate(dateValue);
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const progressWidth =
    surgery.status === 'in_surgery' ? '60%' : surgery.status === 'recovery' ? '85%' : '20%';
  const progressLabel =
    surgery.status === 'pre_op' ? 'Preparing...' : surgery.status === 'in_surgery' ? 'In Progress' : 'Recovering';

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        style={({ pressed }) => [
          styles.surgeryCard,
          isEmergency && styles.emergencyCard,
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
        ]}
      >
        <View style={[styles.accentBar, { backgroundColor: statusConfig.text }]} />
        <View style={styles.surgeryContent}>
          <View style={styles.surgeryTopRow}>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName} numberOfLines={1}>{surgery.patientName}</Text>
              <Text style={styles.patientMeta}>{surgery.patientAge} yrs • {surgery.patientGender}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
              {isActive && <View style={[styles.pulseDot, { backgroundColor: statusConfig.text }]} />}
              <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusLabel}</Text>
            </View>
          </View>

          <View style={styles.operationRow}>
            <View style={styles.smallIconCircle}>
              <MaterialCommunityIcons name="medical-bag" size={12} color={COLORS.primary} />
            </View>
            <Text style={styles.operationType} numberOfLines={1}>{surgery.operationType}</Text>
          </View>

          <View style={styles.surgeryBottomRow}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="doctor" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>{surgery.doctorName}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="door-open" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{surgery.otRoom}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{formatTime(surgery.scheduledDate)}</Text>
            </View>
          </View>

          {isActive && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { backgroundColor: statusConfig.text, width: progressWidth }]} />
              </View>
              <Text style={[styles.progressText, { color: statusConfig.text }]}>{progressLabel}</Text>
            </View>
          )}
        </View>
        <View style={styles.chevronCircle}>
          <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.textMuted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function EmptyState({ onCreate, canCreate }: { onCreate: () => void; canCreate: boolean }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.emptyIconGradient}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={36} color={COLORS.surface} />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>No Surgeries Yet</Text>
      <Text style={styles.emptySubtitle}>
        {canCreate ? 'Create your first surgery to get started' : 'Surgery updates will appear here'}
      </Text>
      {canCreate && (
        <Pressable onPress={onCreate} style={({ pressed }) => pressed && { opacity: 0.9 }}>
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.emptyButton}>
            <MaterialCommunityIcons name="plus" size={18} color={COLORS.surface} />
            <Text style={styles.emptyButtonText}>Create Surgery</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

function LoadingState() {
  const rotation = useSpin();
  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={{ transform: [{ rotate: rotation }] }}>
        <MaterialCommunityIcons name="loading" size={30} color={COLORS.primary} />
      </Animated.View>
      <Text style={styles.loadingText}>Loading surgeries...</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();
  const [surgeries, setSurgeries] = useState<SurgeryOperation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const userRole = user?.role || '';
  const isHospitalStaff = HOSPITAL_ROLES.includes(userRole);
  const isDoctor = DOCTOR_ROLES.includes(userRole);
  const isFamily = userRole === 'family';
  const canCreate = isHospitalStaff;
  const missingHospitalId = isHospitalStaff && !user?.hospitalId;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe: (() => void) | undefined;

    if (isHospitalStaff && user.hospitalId) {
      unsubscribe = subscribeToSurgeriesByHospital(user.hospitalId, (data) => {
        setSurgeries(data);
        setLoading(false);
      });
    } else if (isFamily && user.phoneNumber) {
      unsubscribe = subscribeToSurgeriesByFamilyPhone(user.phoneNumber, (data) => {
        setSurgeries(data);
        setLoading(false);
      });
    } else {
      unsubscribe = subscribeToSurgeries((data) => {
        setSurgeries(data);
        setLoading(false);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.role, user?.hospitalId, user?.phoneNumber]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.selectionAsync();
    setTimeout(() => {
      setRefreshing(false);
      Toast.show({ type: 'success', text1: 'Dashboard is up to date' });
    }, 800);
  }, []);

  const stats = {
    total: surgeries.length,
    active: surgeries.filter((s) => ACTIVE_STATUSES.includes(s.status)).length,
    completed: surgeries.filter((s) => s.status === 'completed').length,
    emergency: surgeries.filter((s) => s.status === 'emergency').length,
  };

  const filters = [
    { id: 'all', label: 'All', icon: 'view-grid-outline' },
    { id: 'active', label: 'Active', icon: 'pulse' },
    { id: 'scheduled', label: 'Scheduled', icon: 'calendar-clock-outline' },
    { id: 'emergency', label: 'Emergency', icon: 'alert-circle-outline' },
  ];

  let filteredSurgeries =
    selectedFilter === 'all'
      ? surgeries
      : selectedFilter === 'active'
      ? surgeries.filter((s) => ACTIVE_STATUSES.includes(s.status))
      : selectedFilter === 'emergency'
      ? surgeries.filter((s) => s.status === 'emergency')
      : surgeries.filter((s) => s.status === selectedFilter);

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filteredSurgeries = filteredSurgeries.filter(
      (s) =>
        s.patientName?.toLowerCase().includes(q) ||
        s.operationType?.toLowerCase().includes(q) ||
        s.doctorName?.toLowerCase().includes(q)
    );
  }

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    navigation.navigate('RoleSelection');
  };

  const firstName = user?.displayName?.split(' ')[0] || 'there';
  const avatarInitial = (user?.displayName?.charAt(0) || 'U').toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.avatarGradient}>
              <Text style={styles.avatarText}>{avatarInitial}</Text>
            </LinearGradient>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {isDoctor ? 'Dr. ' : ''}{firstName}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            onPress={() => {
              Haptics.selectionAsync();
              setSearchOpen((v) => !v);
            }}
          >
            <MaterialCommunityIcons name={searchOpen ? 'close' : 'magnify'} size={20} color={COLORS.text} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color={COLORS.text} />
            {stats.emergency > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.emergency}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout-variant" size={20} color={COLORS.text} />
          </Pressable>
        </View>
      </Animated.View>

      {searchOpen && (
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textMuted} />
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
          <MaterialCommunityIcons name="alert-outline" size={16} color={COLORS.warning} />
          <Text style={styles.warningText}>
            Your account has no hospital assigned. Contact your admin to see surgery data.
          </Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.statsContainer}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeaderTitle}>Overview</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>

          <HeroOverviewCard activeCount={stats.active} totalCount={stats.total} />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.miniStatsRow}
          >
            <MiniStatCard icon="calendar-check-outline" label="Total Cases" value={stats.total} color={COLORS.primary} delay={100} />
            <MiniStatCard icon="check-circle-outline" label="Completed" value={stats.completed} color={COLORS.success} trend="On track" delay={180} />
            <MiniStatCard icon="alert-circle-outline" label="Emergency" value={stats.emergency} color={COLORS.error} delay={260} />
            <MiniStatCard icon="clock-outline" label="Scheduled" value={surgeries.filter((s) => s.status === 'scheduled').length} color={COLORS.info} delay={340} />
          </ScrollView>
        </View>

        <QuickActions navigation={navigation} canCreate={canCreate} />
        <OTRoomStatus surgeries={surgeries} />

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {filters.map((filter) => (
              <Pressable
                key={filter.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedFilter(filter.id);
                }}
                style={({ pressed }) => [
                  styles.filterTab,
                  selectedFilter === filter.id && styles.filterTabActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <MaterialCommunityIcons
                  name={filter.icon as any}
                  size={15}
                  color={selectedFilter === filter.id ? COLORS.surface : COLORS.textSecondary}
                />
                <Text style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}>
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.surgeriesSection}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>
              {selectedFilter === 'all' ? 'Recent Surgeries' : `${filters.find((f) => f.id === selectedFilter)?.label} Surgeries`}
            </Text>
            <Text style={styles.sectionCount}>{filteredSurgeries.length} found</Text>
          </View>

          {loading ? (
            <LoadingState />
          ) : filteredSurgeries.length === 0 ? (
            <EmptyState canCreate={canCreate} onCreate={() => navigation.navigate('CreateSurgery')} />
          ) : (
            <View style={styles.surgeryList}>
              {filteredSurgeries.map((surgery, index) => (
                <SurgeryCard
                  key={surgery.id}
                  surgery={surgery}
                  index={index}
                  onPress={() => navigation.navigate('SurgeryDetail', { surgeryId: surgery.id })}
                />
              ))}
            </View>
          )}
        </View>

        <RecentActivity surgeries={surgeries} />

        <View style={{ height: 130 }} />
      </ScrollView>

      {canCreate && (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.94 }] }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('CreateSurgery');
          }}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.fabInner}>
            <MaterialCommunityIcons name="plus" size={26} color={COLORS.surface} />
          </LinearGradient>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24, marginRight: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 5,
  },
  avatarGradient: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.surface },
  headerText: { flex: 1 },
  greeting: { fontSize: 12.5, fontFamily: FONTS.regular, color: COLORS.textMuted, marginBottom: 1, letterSpacing: 0.2 },
  userName: { fontSize: 19, fontFamily: FONTS.bold, color: COLORS.text, letterSpacing: -0.3 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, position: 'relative',
  },
  badge: {
    position: 'absolute', top: -2, right: -2, backgroundColor: COLORS.error, borderRadius: 9,
    minWidth: 17, height: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.background,
  },
  badgeText: { fontSize: 9, fontFamily: FONTS.bold, color: COLORS.surface, paddingHorizontal: 3 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface,
    marginHorizontal: 24, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: FONTS.regular, color: COLORS.text },
  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 24, marginBottom: 8,
    padding: 12, borderRadius: 14, backgroundColor: COLORS.warningLight, borderWidth: 1, borderColor: COLORS.border,
  },
  warningText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  statsContainer: { paddingHorizontal: 24, marginTop: 8 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionHeaderTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.text, letterSpacing: -0.3 },
  dateText: { fontSize: 12.5, fontFamily: FONTS.medium, color: COLORS.textMuted },

  heroCard: {
    borderRadius: 28, padding: 24, marginBottom: 20, overflow: 'hidden', position: 'relative',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.24, shadowRadius: 22, elevation: 8,
  },
  heroGlowCircle: {
    position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heroLabelChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  heroLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  heroLabelText: { fontSize: 10.5, fontFamily: FONTS.bold, color: '#FFFFFF', letterSpacing: 0.6 },
  heroIconChip: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroMainRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginBottom: 20 },
  heroBigNumber: { fontSize: 58, fontFamily: FONTS.bold, color: '#FFFFFF', lineHeight: 58, letterSpacing: -1.5 },
  heroBigNumberZero: { fontSize: 40, color: 'rgba(255,255,255,0.55)' },
  heroSubInfo: { flex: 1, paddingBottom: 8 },
  heroSubLabel: { fontSize: 15, fontFamily: FONTS.semiBold, color: '#FFFFFF' },
  heroSubDetail: { fontSize: 12.5, fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  heroProgressTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  heroProgressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 3 },
  heroPercentText: { fontSize: 12, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.8)' },

  miniStatsRow: { gap: 12, paddingRight: 24, paddingBottom: 4 },
  miniStatCard: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, width: 118,
    shadowColor: COLORS.text, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 1,
  },
  miniStatIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  miniStatValue: { fontSize: 23, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 2, letterSpacing: -0.5 },
  miniStatValueZero: { fontSize: 18, color: COLORS.textMuted },
  miniStatLabel: { fontSize: 11.5, fontFamily: FONTS.medium, color: COLORS.textMuted },
  miniStatTrendRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8 },
  miniStatTrend: { fontSize: 10, fontFamily: FONTS.semiBold, color: COLORS.success },

  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 24, marginTop: 26 },
  quickActionItem: { alignItems: 'center', gap: 8 },
  quickActionCircle: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  quickActionLabel: { fontSize: 11.5, fontFamily: FONTS.medium, color: COLORS.textSecondary },

  subSectionTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 14, letterSpacing: -0.2 },
  otSection: { paddingHorizontal: 24, marginTop: 28 },
  otGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  otRoomChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1,
  },
  otRoomFree: { backgroundColor: COLORS.successLight, borderColor: COLORS.success + '30' },
  otRoomOccupied: { backgroundColor: COLORS.errorLight, borderColor: COLORS.error + '30' },
  otDot: { width: 6, height: 6, borderRadius: 3 },
  otRoomName: { fontSize: 12.5, fontFamily: FONTS.semiBold, color: COLORS.text },
  otRoomStatus: { fontSize: 11, fontFamily: FONTS.medium },

  filterContainer: { marginTop: 28, paddingHorizontal: 24 },
  filterScroll: { gap: 10, paddingRight: 24 },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.surface, fontFamily: FONTS.semiBold },

  surgeriesSection: { marginTop: 24, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.text, letterSpacing: -0.2 },
  sectionCount: { fontSize: 12.5, fontFamily: FONTS.medium, color: COLORS.textMuted },

  loadingContainer: { alignItems: 'center', paddingVertical: 60, gap: 14 },
  loadingText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textMuted },
  emptyContainer: { alignItems: 'center', paddingVertical: 50, gap: 14 },
  emptyIconCircle: { width: 84, height: 84, borderRadius: 42 },
  emptyIconGradient: { width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontFamily: FONTS.semiBold, color: COLORS.text },
  emptySubtitle: { fontSize: 13.5, fontFamily: FONTS.regular, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 30 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 26, paddingHorizontal: 22, paddingVertical: 13, marginTop: 6 },
  emptyButtonText: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.surface },

  surgeryList: { gap: 12 },
  surgeryCard: {
    backgroundColor: COLORS.surface, borderRadius: 22, flexDirection: 'row', overflow: 'hidden',
    shadowColor: COLORS.text, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 3,
  },
  emergencyCard: { shadowColor: COLORS.error, shadowOpacity: 0.14 },
  accentBar: { width: 4 },
  surgeryContent: { flex: 1, padding: 18, paddingRight: 8 },
  surgeryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  patientInfo: { flex: 1, marginRight: 10 },
  patientName: { fontSize: 16, fontFamily: FONTS.semiBold, color: COLORS.text, letterSpacing: -0.2 },
  patientMeta: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  pulseDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10.5, fontFamily: FONTS.bold },
  operationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  smallIconCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  operationType: { fontSize: 13.5, fontFamily: FONTS.medium, color: COLORS.textSecondary, flex: 1 },
  surgeryBottomRow: { flexDirection: 'row', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  metaText: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, flex: 1 },
  progressContainer: { marginTop: 14 },
  progressTrack: { height: 4, backgroundColor: COLORS.divider, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 11, fontFamily: FONTS.medium, marginTop: 6 },
  chevronCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginRight: 10,
  },

  activitySection: { paddingHorizontal: 24, marginTop: 28 },
  activityList: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 16 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8, position: 'relative' },
  activityIconCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  activityInfo: { flex: 1 },
  activityText: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary, lineHeight: 18 },
  activityBold: { fontFamily: FONTS.semiBold, color: COLORS.text },
  activityTime: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  activityLine: { position: 'absolute', left: 15, top: 38, bottom: -8, width: 1, backgroundColor: COLORS.divider },

  fab: {
    position: 'absolute', bottom: 110, right: 24,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 16, elevation: 8,
  },
  fabInner: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
});