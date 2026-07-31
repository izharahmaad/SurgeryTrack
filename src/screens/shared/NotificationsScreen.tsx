import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '../../constants';
import { Notification } from '../../types';

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Status Update',
    body: 'Patient Aisha Khan surgery moved to Recovery',
    type: 'status_update',
    surgeryId: 's1',
    read: false,
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Reminder',
    body: 'Surgery scheduled in 30 minutes - Room 3',
    type: 'reminder',
    surgeryId: 's2',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 20),
  },
  {
    id: '3',
    title: 'System',
    body: 'Welcome to SurgeryTrack! Your hospital account is active.',
    type: 'system',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
];

type FilterType = 'all' | 'unread';

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items]
  );

  const filteredItems = useMemo(() => {
    if (filter === 'unread') {
      return items.filter((item) => !item.read);
    }
    return items;
  }, [items, filter]);

  const markRead = (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    Haptics.selectionAsync();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setTimeout(() => {
      setRefreshing(false);
    }, 900);
  };

  const handlePressNotification = (item: Notification) => {
    Haptics.selectionAsync();
    markRead(item.id);

    if (item.surgeryId) {
      navigation.navigate('SurgeryDetail', { surgeryId: item.surgeryId });
    }
  };

  const getIcon = (type: string) => {
    if (type === 'status_update') return 'heart-pulse';
    if (type === 'reminder') return 'clock-alert';
    return 'information-outline';
  };

  const getIconColor = (type: string) => {
    if (type === 'status_update') return COLORS.success;
    if (type === 'reminder') return COLORS.warning;
    return COLORS.info;
  };

  const getTypeLabel = (type: string) => {
    if (type === 'status_update') return 'Status';
    if (type === 'reminder') return 'Reminder';
    return 'System';
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date().getTime();
    const created = new Date(date).getTime();
    const diffMs = now - created;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return new Date(date).toLocaleDateString();
  };

  const renderHeader = () => (
    <View style={styles.topSection}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            Stay updated with surgeries and reminders
          </Text>
        </View>

        <View style={styles.badgeWrap}>
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <View style={styles.filters}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              filter === 'all' && styles.filterChipActive,
            ]}
            onPress={() => setFilter('all')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'all' && styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              filter === 'unread' && styles.filterChipActive,
            ]}
            onPress={() => setFilter('unread')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'unread' && styles.filterTextActive,
              ]}
            >
              Unread
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.85}>
          <Text style={styles.markAll}>Mark all read</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <MaterialCommunityIcons
          name="bell-check-outline"
          size={34}
          color={COLORS.primary}
        />
      </View>
      <Text style={styles.emptyTitle}>All caught up</Text>
      <Text style={styles.emptyBody}>
        You have no {filter === 'unread' ? 'unread ' : ''}notifications right now.
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: Notification }) => {
    const iconColor = getIconColor(item.type);

    return (
      <TouchableOpacity
        onPress={() => handlePressNotification(item)}
        activeOpacity={0.9}
        style={[styles.card, !item.read && styles.unreadCard]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
          <MaterialCommunityIcons
            name={getIcon(item.type) as any}
            size={22}
            color={iconColor}
          />
        </View>

        <View style={styles.textWrap}>
          <View style={styles.rowTop}>
            <View style={[styles.typePill, { backgroundColor: `${iconColor}15` }]}>
              <Text style={[styles.typePillText, { color: iconColor }]}>
                {getTypeLabel(item.type)}
              </Text>
            </View>
            <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
          </View>

          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>

          {item.surgeryId ? (
            <View style={styles.linkRow}>
              <MaterialCommunityIcons
                name="arrow-right"
                size={14}
                color={COLORS.primary}
              />
              <Text style={styles.linkText}>Open surgery details</Text>
            </View>
          ) : null}
        </View>

        {!item.read && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.list,
          filteredItems.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  list: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
  },

  topSection: {
    paddingTop: 6,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
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
  titleWrap: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  badgeWrap: {
    marginLeft: 10,
  },
  unreadBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: COLORS.surface,
    fontSize: 12,
    fontFamily: FONTS.bold,
  },

  actionRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.surface,
  },
  markAll: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
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
  unreadCard: {
    backgroundColor: `${COLORS.primaryLight}10`,
    borderColor: `${COLORS.primary}25`,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textWrap: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  typePillText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  title: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  time: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: 10,
    marginTop: 8,
  },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  linkText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },

  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 80,
  },
  emptyIconWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  emptyBody: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
});