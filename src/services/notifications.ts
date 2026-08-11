import { db } from './firebase';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { Notification } from '@/types';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Notification[];
      callback(notifications);
    },
    (error) => {
      console.error('subscribeToNotifications error:', error.code, error.message);
      callback([]);
    }
  );
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
  await updateDoc(docRef, { read: true });
};

export const markAllNotificationsRead = async (
  notifications: Notification[]
): Promise<void> => {
  const unread = notifications.filter((n) => !n.read);
  if (unread.length === 0) return;

  const batch = writeBatch(db);
  unread.forEach((n) => {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, n.id);
    batch.update(docRef, { read: true });
  });
  await batch.commit();
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
  await deleteDoc(docRef);
};

export const createNotification = async (data: {
  userId: string;
  title: string;
  body: string;
  type: string;
  surgeryId?: string;
}): Promise<void> => {
  await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
};