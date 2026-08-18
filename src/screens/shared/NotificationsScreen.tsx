import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { COLORS, FONTS } from '../../constants';
import type { Notification } from '../../types';

import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from '../../services/notifications';

import { useAuthStore } from '../../hooks/useAuthStore';

type FilterType = 'all' | 'unread' | 'important';

type NotificationSection = {
  title: string;
  data: Notification[];
};

function toSafeDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatRelativeTime(value: any): string {
  const created = toSafeDate(value).getTime();
  const diff = Date.now() - created;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return toSafeDate(value).toLocaleDateString();
}

function isToday(value: any): boolean {
  const date = toSafeDate(value);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getIcon(type?: string): string {
  switch (type) {
    case 'status_update':
      return 'heart-pulse';
    case 'reminder':
      return 'clock-alert';
    case 'emergency':
      return 'alert-decagram';
    default:
      return 'information-outline';
  }
}

function getIconColor(type?: string): string {
  switch (type) {
    case 'status_update':
      return COLORS.success;
    case 'reminder':
      return COLORS.warning;
    case 'emergency':
      return COLORS.error;
    default:
      return COLORS.info;
  }
}

function getTypeLabel(type?: string): string {
  switch (type) {
    case 'status_update':
      return 'Status';
    case 'reminder':
      return 'Reminder';
    case 'emergency':
      return 'Emergency';
    default:
      return 'System';
  }
}

function isImportant(item: Notification): boolean {
  return item.type === 'emergency' || item.type === 'status_update';
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const previousIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToNotifications(
      user.uid,
      (data: Notification[]) => {
        if (!firstLoad.current) {
          const newNotifications = data.filter(
            (item) => !previousIds.current.has(item.id)
          );

          if (newNotifications.length > 0) {
            const important = newNotifications.some(
              (item) =>
                item.type === 'emergency' ||
                item.type === 'status_update'
            );

            Haptics.notificationAsync(
              important
                ? Haptics.NotificationFeedbackType.Warning
                : Haptics.NotificationFeedbackType.Success
            );
          }
        }

        previousIds.current = new Set(data.map((item) => item.id));
        firstLoad.current = false;

        setItems(data);
        setLoading(false);
      },
      (error: Error) => {
        console.error('Notification subscription error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items]
  );

  const filteredItems = useMemo(() => {
    if (filter === 'unread') {
      return items.filter((item) => !item.read);
    }
    if (filter === 'important') {
      return items.filter(isImportant);
    }
    return items;
  }, [items, filter]);

  const sections = useMemo<NotificationSection[]>(() => {
    const today = filteredItems.filter((item) => isToday(item.createdAt));
    const earlier = filteredItems.filter((item) => !isToday(item.createdAt));

    const result: NotificationSection[] = [];
    if (today.length > 0) result.push({ title: 'Today', data: today });
    if (earlier.length > 0) result.push({ title: 'Earlier', data: earlier });
    return result;
  }, [filteredItems]);

  const handleMarkRead = async (id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
    try {
      await markNotificationRead(id);
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = items
      .filter((item) => !item.read)
      .map((item) => item.id);

    if (unreadIds.length === 0) return;

    Haptics.selectionAsync();
    setItems((current) => current.map((item) => ({ ...item, read: true })));

    try {
      await markAllNotificationsRead(unreadIds);
    } catch (error) {
      console.error('Failed to mark all notifications read:', error);
    }
  };

  const handleDelete = (item: Notification) => {
    Alert.alert(
      'Delete Notification',
      'Remove this notification permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setItems((current) => current.filter((n) => n.id !== item.id));
            try {
              await deleteNotification(item.id);
            } catch (error) {
              console.error('Failed to delete notification:', error);
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = async (item: Notification) => {
    Haptics.selectionAsync();
    if (!item.read) await handleMarkRead(item.id);
    if (item.surgeryId) {
      navigation.navigate('SurgeryDetail', { surgeryId: item.surgeryId });
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
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

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              Real-time updates from your hospital
            </Text>
          </View>

          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <View style={styles.filterRow}>
            {(['all', 'unread', 'important'] as FilterType[]).map((f) => {
              const active = filter === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterButton,
                    active && styles.activeFilterButton,
                  ]}
                  onPress={() => setFilter(f)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.activeFilterText,
                    ]}
                  >
                    {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Important'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="bell-check-outline"
          size={44}
          color={COLORS.primary}
        />
        <Text style={styles.emptyTitle}>All caught up</Text>
        <Text style={styles.emptyText}>
          {filter === 'unread'
            ? 'No unread notifications at the moment.'
            : filter === 'important'
            ? 'No important notifications right now.'
            : 'You have no notifications right now.'}
        </Text>
      </View>
    );
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: Notification;
    index: number;
  }) => {
    const iconColor = getIconColor(item.type);
    const important = isImportant(item);

    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
        <TouchableOpacity
          style={[
            styles.card,
            !item.read && styles.unreadCard,
            important && styles.importantCard,
          ]}
          activeOpacity={0.9}
          onPress={() => handleNotificationPress(item)}
          onLongPress={() => handleDelete(item)}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${iconColor}18` },
            ]}
          >
            <MaterialCommunityIcons
              name={getIcon(item.type) as any}
              size={20}
              color={iconColor}
            />
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.topRow}>
              <View style={styles.typeRow}>
                <Text style={[styles.typeText, { color: iconColor }]}>
                  {getTypeLabel(item.type)}
                </Text>
                {important && (
                  <View style={styles.importantChip}>
                    <Text style={styles.importantChipText}>Important</Text>
                  </View>
                )}
              </View>

              <Text style={styles.timeText}>
                {formatRelativeTime(item.createdAt)}
              </Text>
            </View>

            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationBody}>{item.body}</Text>

            {item.surgeryId && (
              <Text style={styles.surgeryLink}>Open surgery details →</Text>
            )}
          </View>

          {!item.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notifications…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SectionList<Notification, NotificationSection>
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={sections.length === 0 ? renderEmpty : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  loadingText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  headerContainer: {
    paddingTop: 8,
    paddingBottom: 12,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  titleContainer: {
    flex: 1,
    marginLeft: 10,
  },

  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 6,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  badgeText: {
    color: COLORS.surface,
    fontSize: 11,
    fontFamily: FONTS.bold,
  },

  actionRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },

  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  activeFilterButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  filterText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },

  activeFilterText: {
    color: COLORS.surface,
  },

  markAllText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  sectionTitle: {
    marginTop: 10,
    marginBottom: 6,
    marginLeft: 4,
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  unreadCard: {
    backgroundColor: `${COLORS.primaryLight}10`,
    borderColor: `${COLORS.primary}25`,
  },

  importantCard: {
    borderColor: `${COLORS.warning}40`,
  },

  iconContainer: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  contentContainer: {
    flex: 1,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  typeText: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
  },

  timeText: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },

  notificationTitle: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    lineHeight: 18,
  },

  notificationBody: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },

  surgeryLink: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },

  unreadDot: {
    width: 7,
    height: 7,
    marginLeft: 6,
    marginTop: 4,
    borderRadius: 3.5,
    backgroundColor: COLORS.primary,
  },

  importantChip: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: `${COLORS.warning}18`,
    borderWidth: 1,
    borderColor: `${COLORS.warning}35`,
  },

  importantChipText: {
    fontSize: 8,
    fontFamily: FONTS.bold,
    color: COLORS.warning,
  },

  separator: {
    height: 8,
  },

  emptyContainer: {
    flex: 1,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
});