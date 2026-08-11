import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONTS } from '../../constants';
import { Notification } from '../../types';
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../services/notifications';
import { useAuthStore } from '../../hooks/useAuthStore';

type FilterType = 'all' | 'unread';

function toSafeDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatRelativeTime(value: any) {
  const created = toSafeDate(value).getTime();
  const now = Date.now();
  const diffMs = now - created;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return toSafeDate(value).toLocaleDateString();
}

function isToday(value: any) {
  const date = toSafeDate(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const previousIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToNotifications(user.uid, (data) => {
      if (!isFirstLoad.current) {
        const newOnes = data.filter((n) => !previousIds.current.has(n.id));
        if (newOnes.length > 0) {
          const hasEmergency = newOnes.some(
            (n) => n.type === 'emergency' || n.type === 'status_update'
          );
          Haptics.notificationAsync(
            hasEmergency
              ? Haptics.NotificationFeedbackType.Warning
              : Haptics.NotificationFeedbackType.Success
          );
        }
      }
      previousIds.current = new Set(data.map((n) => n.id));
      isFirstLoad.current = false;
      setItems(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  const filteredItems = useMemo(() => {
    return filter === 'unread' ? items.filter((item) => !item.read) : items;
  }, [items, filter]);

  const sections = useMemo(() => {
    const todayItems = filteredItems.filter((item) => isToday(item.createdAt));
    const earlierItems = filteredItems.filter((item) => !isToday(item.createdAt));
    const result = [];
    if (todayItems.length > 0) result.push({ title: 'Today', data: todayItems });
    if (earlierItems.length > 0) result.push({ title: 'Earlier', data: earlierItems });
    return result;
  }, [filteredItems]);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await markNotificationRead(id);
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  const markAllAsRead = async () => {
    Haptics.selectionAsync();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead(items);
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  };

  const handleDelete = (item: Notification) => {
    Alert.alert('Delete Notification', 'Remove this notification permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setItems((prev) => prev.filter((n) => n.id !== item.id));
          try {
            await deleteNotification(item.id);
          } catch (error) {
            console.error('Failed to delete:', error);
          }
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 700);
  };

  const handlePressNotification = (item: Notification) => {
    Haptics.selectionAsync();
    if (!item.read) markRead(item.id);
    if (item.surgeryId) {
      navigation.navigate('SurgeryDetail', { surgeryId: item.surgeryId });
    }
  };

  const getIcon = (type: string) => {
    if (type === 'status_update') return 'heart-pulse';
    if (type === 'reminder') return 'clock-alert';
    if (type === 'emergency') return 'alert-decagram';
    return 'information-outline';
  };

  const getIconColor = (type: string) => {
    if (type === 'status_update') return COLORS.success;
    if (type === 'reminder') return COLORS.warning;
    if (type === 'emergency') return COLORS.error;
    return COLORS.info;
  };

  const getTypeLabel = (type: string) => {
    if (type === 'status_update') return 'Status';
    if (type === 'reminder') return 'Reminder';
    if (type === 'emergency') return 'Emergency';
    return 'System';
  };

  const renderHeader = () => (
    <View style={styles.topSection}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>Live updates from Firestore</Text>
        </View>

        {unreadCount > 0 && (
          <View style={styles.badgeWrap}>
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
            activeOpacity={0.85}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'unread' && styles.filterChipActive]}
            onPress={() => setFilter('unread')}
            activeOpacity={0.85}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>Unread</Text>
          </TouchableOpacity>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.85}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <MaterialCommunityIcons name="bell-check-outline" size={34} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>All caught up</Text>
      <Text style={styles.emptyBody}>
        You have no {filter === 'unread' ? 'unread ' : ''}notifications right now.
      </Text>
    </View>
  );

  const renderItem = ({ item, index }: { item: Notification; index: number }) => {
    const iconColor = getIconColor(item.type);

    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
        <TouchableOpacity
          onPress={() => handlePressNotification(item)}
          onLongPress={() => handleDelete(item)}
          activeOpacity={0.9}
          style={[styles.card, !item.read && styles.unreadCard]}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
            <MaterialCommunityIcons name={getIcon(item.type) as any} size={22} color={iconColor} />
          </View>

          <View style={styles.textWrap}>
            <View style={styles.rowTop}>
              <View style={[styles.typePill, { backgroundColor: `${iconColor}15` }]}>
                <Text style={[styles.typePillText, { color: iconColor }]}>{getTypeLabel(item.type)}</Text>
              </View>
              <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>

            {item.surgeryId ? (
              <View style={styles.linkRow}>
                <MaterialCommunityIcons name="arrow-right" size={14} color={COLORS.primary} />
                <Text style={styles.linkText}>Open surgery details</Text>
              </View>
            ) : null}
          </View>

          {!item.read && <View style={styles.dot} />}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={sections.length === 0 ? renderEmpty : null}
        contentContainerStyle={[styles.list, sections.length === 0 && styles.emptyListContent]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  list: { paddingHorizontal: 18, paddingBottom: 24 },
  emptyListContent: { flexGrow: 1 },

  topSection: { paddingTop: 6, paddingBottom: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleWrap: { flex: 1, marginLeft: 14 },
  headerTitle: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.text },
  headerSubtitle: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  badgeWrap: { marginLeft: 10 },
  unreadBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: { color: COLORS.surface, fontSize: 12, fontFamily: FONTS.bold },

  actionRow: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filters: { flexDirection: 'row', gap: 10 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.surface },
  markAll: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.primary },

  sectionHeader: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
    marginBottom: 10,
    marginTop: 4,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unreadCard: { backgroundColor: `${COLORS.primaryLight}10`, borderColor: `${COLORS.primary}25` },
  iconWrap: { width: 46, height: 46, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  textWrap: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  typePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  typePillText: { fontSize: 11, fontFamily: FONTS.semiBold },
  title: { fontSize: 15, fontFamily: FONTS.semiBold, color: COLORS.text },
  body: { fontSize: 13, lineHeight: 20, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 4 },
  time: { fontSize: 11, fontFamily: FONTS.medium, color: COLORS.textMuted },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginLeft: 10, marginTop: 8 },

  linkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 },
  linkText: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.primary },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingTop: 80 },
  emptyIconWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.text },
  emptyBody: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
});