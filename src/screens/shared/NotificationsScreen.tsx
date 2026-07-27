import React, { useState } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { Notification } from '../../types';

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Status Update', body: 'Patient Aisha Khan surgery moved to Recovery', type: 'status_update', surgeryId: 's1', read: false, createdAt: new Date() },
  { id: '2', title: 'Reminder', body: 'Surgery scheduled in 30 minutes - Room 3', type: 'reminder', surgeryId: 's2', read: false, createdAt: new Date() },
  { id: '3', title: 'System', body: 'Welcome to SurgeryTrack! Your hospital account is active.', type: 'system', read: true, createdAt: new Date() },
];

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const markRead = (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getIcon = (type: string) => {
    if (type === 'status_update') return 'heart-pulse';
    if (type === 'reminder') return 'clock-alert';
    return 'information';
  };

  const getIconColor = (type: string) => {
    if (type === 'status_update') return COLORS.success;
    if (type === 'reminder') return COLORS.warning;
    return COLORS.info;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={() => setItems(prev => prev.map(n => ({ ...n, read: true })))}>
          <Text style={styles.markAll}>Mark all</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => markRead(item.id)} style={[styles.card, !item.read && styles.unread]}>
            <View style={[styles.iconWrap, { backgroundColor: getIconColor(item.type) + '20' }]}>
              <MaterialCommunityIcons name={getIcon(item.type) as any} size={22} color={getIconColor(item.type)} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>{item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            {!item.read && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins-Bold', color: COLORS.text },
  markAll: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: COLORS.primary },
  list: { padding: 20, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  unread: { borderColor: COLORS.primaryLight, backgroundColor: COLORS.primaryLight + '10' },
  iconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  textWrap: { flex: 1 },
  title: { fontSize: 15, fontFamily: 'Poppins-SemiBold', color: COLORS.text },
  body: { fontSize: 13, fontFamily: 'Poppins-Regular', color: COLORS.textSecondary, marginTop: 2 },
  time: { fontSize: 11, fontFamily: 'Poppins-Regular', color: COLORS.textMuted, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: 8 },
});