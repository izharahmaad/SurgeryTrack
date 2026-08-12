import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QuerySnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from './firebase';
import type { Notification } from '../types';

type NotificationType = Notification['type'];

function getNotificationType(
  value: unknown
): NotificationType {
  if (
    value === 'status_update' ||
    value === 'reminder' ||
    value === 'system' ||
    value === 'emergency'
  ) {
    return value;
  }

  return 'system';
}

export function subscribeToNotifications(
  userId: string,
  onData: (data: Notification[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const data: Notification[] = snapshot.docs.map(
        (item): Notification => {
          const raw = item.data();

          return {
            id: item.id,
            userId: String(raw.userId ?? ''),
            title: String(raw.title ?? ''),
            body: String(raw.body ?? ''),
            read: Boolean(raw.read ?? false),
            createdAt: raw.createdAt ?? new Date(),
            type: getNotificationType(raw.type),
            surgeryId: raw.surgeryId
              ? String(raw.surgeryId)
              : undefined,
          };
        }
      );

      onData(data);
    },
    (error) => {
      console.error(
        'subscribeToNotifications error:',
        error
      );

      onError?.(error);
    }
  );
}

export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  const notificationRef = doc(
    db,
    'notifications',
    notificationId
  );

  await updateDoc(notificationRef, {
    read: true,
  });
}

export async function markAllNotificationsRead(
  notificationIds: string[]
): Promise<void> {
  if (notificationIds.length === 0) {
    return;
  }

  const batch = writeBatch(db);

  notificationIds.forEach((notificationId) => {
    const notificationRef = doc(
      db,
      'notifications',
      notificationId
    );

    batch.update(notificationRef, {
      read: true,
    });
  });

  await batch.commit();
}

export async function deleteNotification(
  notificationId: string
): Promise<void> {
  const notificationRef = doc(
    db,
    'notifications',
    notificationId
  );

  await deleteDoc(notificationRef);
}