import React, {
  useCallback,
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
import Toast from 'react-native-toast-message';

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

function toSafeDate(value: unknown): Date {
  if (!value) return new Date();

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date() : value;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  const date = new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatRelativeTime(value: unknown): string {
  const created = toSafeDate(value).getTime();
  const diff = Math.max(0, Date.now() - created);

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return toSafeDate(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function isToday(value: unknown): boolean {
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
      return 'clock-alert-outline';
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
      return 'Status update';
    case 'reminder':
      return 'Reminder';
    case 'emergency':
      return 'Emergency';
    default:
      return 'System';
  }
}

function isImportant(item: Notification): boolean {
  return item.type === 'emergency' || item.type === 'reminder';
}

function sortNotifications(data: Notification[]): Notification[] {
  return [...data].sort((first, second) => {
    return (
      toSafeDate(second.createdAt).getTime() -
      toSafeDate(first.createdAt).getTime()
    );
  });
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);

  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const previousIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);
  const retryKey = useRef(0);
  const [subscriptionVersion, setSubscriptionVersion] = useState(0);

  useEffect(() => {
    firstLoad.current = true;
    previousIds.current = new Set();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      setLoading(false);
      setErrorMessage('');
      return;
    }

    let mounted = true;

    setLoading(true);
    setErrorMessage('');

    const unsubscribe = subscribeToNotifications(
      user.uid,
      (data: Notification[]) => {
        if (!mounted) return;

        const sortedData = sortNotifications(Array.isArray(data) ? data : []);

        if (!firstLoad.current) {
          const newNotifications = sortedData.filter(
            (item) => !previousIds.current.has(item.id)
          );

          if (newNotifications.length > 0) {
            const hasEmergency = newNotifications.some(
              (item) => item.type === 'emergency'
            );

            Haptics.notificationAsync(
              hasEmergency
                ? Haptics.NotificationFeedbackType.Warning
                : Haptics.NotificationFeedbackType.Success
            );
          }
        }

        previousIds.current = new Set(sortedData.map((item) => item.id));
        firstLoad.current = false;

        setItems(sortedData);
        setLoading(false);
        setRefreshing(false);
      },
      (error: Error) => {
        if (!mounted) return;

        console.error('Notification subscription error:', error);

        setLoading(false);
        setRefreshing(false);
        setErrorMessage(
          'Unable to load notifications. Check your connection and try again.'
        );
      }
    );

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [subscriptionVersion, user?.uid]);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items]
  );

  const importantCount = useMemo(
    () => items.filter(isImportant).length,
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
  }, [filter, items]);

  const sections = useMemo<NotificationSection[]>(() => {
    const today = filteredItems.filter((item) => isToday(item.createdAt));
    const earlier = filteredItems.filter((item) => !isToday(item.createdAt));

    const result: NotificationSection[] = [];

    if (today.length > 0) {
      result.push({
        title: 'Today',
        data: today,
      });
    }

    if (earlier.length > 0) {
      result.push({
        title: 'Earlier',
        data: earlier,
      });
    }

    return result;
  }, [filteredItems]);

  const retrySubscription = useCallback(() => {
    Haptics.selectionAsync();
    firstLoad.current = true;
    previousIds.current = new Set();
    retryKey.current += 1;
    setSubscriptionVersion(retryKey.current);
  }, []);

  const handleMarkRead = async (id: string) => {
    const previousItems = items;

    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, read: true }
          : item
      )
    );

    try {
      await markNotificationRead(id);
    } catch (error) {
      console.error('Failed to mark notification read:', error);
      setItems(previousItems);

      Toast.show({
        type: 'error',
        text1: 'Could not mark notification as read',
      });
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = items
      .filter((item) => !item.read)
      .map((item) => item.id);

    if (unreadIds.length === 0) return;

    const previousItems = items;

    Haptics.selectionAsync();

    setItems((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      }))
    );

    try {
      await markAllNotificationsRead(unreadIds);

      Toast.show({
        type: 'success',
        text1: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Failed to mark all notifications read:', error);
      setItems(previousItems);

      Toast.show({
        type: 'error',
        text1: 'Could not update notifications',
      });
    }
  };

  const handleDelete = (item: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Notification',
      'Remove this notification permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const previousItems = items;

            setItems((current) =>
              current.filter((notification) => notification.id !== item.id)
            );

            try {
              await deleteNotification(item.id);

              Toast.show({
                type: 'success',
                text1: 'Notification deleted',
              });
            } catch (error) {
              console.error('Failed to delete notification:', error);
              setItems(previousItems);

              Toast.show({
                type: 'error',
                text1: 'Could not delete notification',
              });
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = async (item: Notification) => {
    Haptics.selectionAsync();

    if (!item.read) {
      await handleMarkRead(item.id);
    }

    if (item.surgeryId) {
      navigation.navigate('SurgeryDetail', {
        surgeryId: item.surgeryId,
      });
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    retrySubscription();
  };

  const getFilterCount = (filterId: FilterType) => {
    if (filterId === 'unread') return unreadCount;
    if (filterId === 'important') return importantCount;
    return items.length;
  };

  const renderHeader = () => {
    const filterOptions: {
      id: FilterType;
      label: string;
      icon: string;
    }[] = [
      { id: 'all', label: 'All', icon: 'view-grid-outline' },
      { id: 'unread', label: 'Unread', icon: 'email-outline' },
      { id: 'important', label: 'Important', icon: 'alert-circle-outline' },
    ];

    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.goBack();
            }}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={19}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              Live surgery updates and alerts
            </Text>
          </View>

          <View style={styles.notificationCountCircle}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={18}
              color={COLORS.primary}
            />

            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionRow}>
          <View style={styles.filterRow}>
            {filterOptions.map((option) => {
              const active = filter === option.id;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.filterButton,
                    active && styles.activeFilterButton,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFilter(option.id);
                  }}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name={option.icon as any}
                    size={13}
                    color={
                      active
                        ? COLORS.surface
                        : COLORS.textSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.filterText,
                      active && styles.activeFilterText,
                    ]}
                  >
                    {option.label}
                  </Text>

                  <Text
                    style={[
                      styles.filterCount,
                      active && styles.activeFilterText,
                    ]}
                  >
                    {getFilterCount(option.id)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              activeOpacity={0.85}
            >
              <Text style={styles.markAllText}>Read all</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.longPressHint}>
          <MaterialCommunityIcons
            name="gesture-tap-hold"
            size={13}
            color={COLORS.textMuted}
          />
          <Text style={styles.longPressText}>
            Hold a notification to delete it
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    const message =
      filter === 'unread'
        ? 'No unread notifications at the moment.'
        : filter === 'important'
        ? 'No important notifications right now.'
        : 'You have no notifications right now.';

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <MaterialCommunityIcons
            name="bell-check-outline"
            size={34}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>All caught up</Text>
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    );
  };

  const renderError = () => {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconCircle}>
          <MaterialCommunityIcons
            name="cloud-alert-outline"
            size={32}
            color={COLORS.error}
          />
        </View>

        <Text style={styles.errorTitle}>Notifications unavailable</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={retrySubscription}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={16}
            color={COLORS.surface}
          />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
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
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 35, 300)).duration(260)}
      >
        <TouchableOpacity
          style={[
            styles.card,
            !item.read && styles.unreadCard,
            item.type === 'emergency' && styles.emergencyCard,
          ]}
          activeOpacity={0.88}
          onPress={() => handleNotificationPress(item)}
          onLongPress={() => handleDelete(item)}
          delayLongPress={450}
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
            <View style={styles.cardTopRow}>
              <View style={styles.typeRow}>
                <Text style={[styles.typeText, { color: iconColor }]}>
                  {getTypeLabel(item.type)}
                </Text>

                {important && (
                  <View
                    style={[
                      styles.importantChip,
                      {
                        backgroundColor: `${iconColor}12`,
                        borderColor: `${iconColor}30`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.importantChipText,
                        { color: iconColor },
                      ]}
                    >
                      Important
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.timeText}>
                {formatRelativeTime(item.createdAt)}
              </Text>
            </View>

            <Text style={styles.notificationTitle}>
              {item.title}
            </Text>

            <Text style={styles.notificationBody}>
              {item.body}
            </Text>

            {item.surgeryId && (
              <View style={styles.surgeryLinkRow}>
                <Text style={styles.surgeryLink}>
                  Open surgery details
                </Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={13}
                  color={COLORS.primary}
                />
              </View>
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
        <View style={styles.loadingHeader}>{renderHeader()}</View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            Loading notifications…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage && items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingHeader}>{renderHeader()}</View>
        {renderError()}
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

  loadingHeader: {
    paddingHorizontal: 16,
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
    paddingBottom: 28,
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
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 1,
    fontSize: 10.5,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  notificationCountCircle: {
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

  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.background,
  },

  badgeText: {
    color: COLORS.surface,
    fontSize: 8,
    fontFamily: FONTS.bold,
  },

  actionRow: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
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
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },

  activeFilterText: {
    color: COLORS.surface,
  },

  filterCount: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
  },

  markAllText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  longPressHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
  },

  longPressText: {
    fontSize: 9.5,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  sectionTitle: {
    marginTop: 10,
    marginBottom: 7,
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
    backgroundColor: `${COLORS.primary}08`,
    borderColor: `${COLORS.primary}2A`,
  },

  emergencyCard: {
    borderColor: `${COLORS.error}45`,
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

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
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

  surgeryLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 7,
  },

  surgeryLink: {
    fontSize: 10.5,
    fontFamily: FONTS.semiBold,
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
    borderWidth: 1,
  },

  importantChipText: {
    fontSize: 8,
    fontFamily: FONTS.bold,
  },

  separator: {
    height: 8,
  },

  emptyContainer: {
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
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

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  errorIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.error}12`,
  },

  errorTitle: {
    marginTop: 14,
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  errorText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },

  retryButtonText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.surface,
  },
});