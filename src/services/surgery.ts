import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from './firebase';
import type { SurgeryOperation } from '@/types';

const SURGERIES_COLLECTION = 'surgeries';

const surgeriesCollection = collection(
  db,
  SURGERIES_COLLECTION
);

function normalizePhone(phoneNumber: string): string {
  return phoneNumber.trim();
}

function mapSurgery(
  document: {
    id: string;
    data: () => Record<string, unknown>;
  }
): SurgeryOperation {
  return {
    id: document.id,
    ...(document.data() as Omit<
      SurgeryOperation,
      'id'
    >),
  };
}

// ======================================================
// CRUD
// ======================================================

export const createSurgery = async (
  surgeryData: Omit<
    SurgeryOperation,
    'id' | 'qrCodeData' | 'createdAt' | 'updatedAt'
  >
): Promise<string> => {
  const surgeryRef = doc(surgeriesCollection);

  const qrCodeData = JSON.stringify({
    surgeryId: surgeryRef.id,
    hospitalId: surgeryData.hospitalId,
    timestamp: Date.now(),
  });

  await setDoc(surgeryRef, {
    ...surgeryData,
    id: surgeryRef.id,
    qrCodeData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return surgeryRef.id;
};

export const getSurgery = async (
  surgeryId: string
): Promise<SurgeryOperation | null> => {
  const surgeryRef = doc(
    db,
    SURGERIES_COLLECTION,
    surgeryId
  );

  const snapshot = await getDoc(surgeryRef);

  if (!snapshot.exists()) {
    return null;
  }

  return mapSurgery(snapshot);
};

export const getSurgeryByQrData = async (
  qrData: string
): Promise<SurgeryOperation | null> => {
  try {
    const parsed = JSON.parse(qrData);

    if (!parsed?.surgeryId) {
      return null;
    }

    return getSurgery(String(parsed.surgeryId));
  } catch (error) {
    console.error(
      'getSurgeryByQrData error:',
      error
    );

    return null;
  }
};

export const getSurgeriesByHospital = async (
  hospitalId: string
): Promise<SurgeryOperation[]> => {
  const surgeriesQuery = query(
    surgeriesCollection,
    where('hospitalId', '==', hospitalId),
    orderBy('scheduledDate', 'desc')
  );

  const snapshot = await getDocs(surgeriesQuery);

  return snapshot.docs.map((document) =>
    mapSurgery(document)
  );
};

export const updateSurgeryStatus = async (
  surgeryId: string,
  status: SurgeryOperation['status'],
  extraUpdates?: Partial<SurgeryOperation>
): Promise<void> => {
  const surgeryRef = doc(
    db,
    SURGERIES_COLLECTION,
    surgeryId
  );

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (
    status === 'in_surgery' &&
    !extraUpdates?.startTime
  ) {
    updateData.startTime = serverTimestamp();
  }

  if (
    status === 'completed' &&
    !extraUpdates?.actualEndTime
  ) {
    updateData.actualEndTime = serverTimestamp();
  }

  await updateDoc(surgeryRef, {
    ...updateData,
    ...extraUpdates,
  });
};

export const deleteSurgery = async (
  surgeryId: string
): Promise<void> => {
  await deleteDoc(
    doc(db, SURGERIES_COLLECTION, surgeryId)
  );
};

// ======================================================
// REAL-TIME SUBSCRIPTIONS
// ======================================================

export const subscribeToSurgery = (
  surgeryId: string,
  callback: (
    surgery: SurgeryOperation | null
  ) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const surgeryRef = doc(
    db,
    SURGERIES_COLLECTION,
    surgeryId
  );

  return onSnapshot(
    surgeryRef,
    (snapshot) => {
      callback(
        snapshot.exists()
          ? mapSurgery(snapshot)
          : null
      );
    },
    (error) => {
      console.error(
        'subscribeToSurgery error:',
        error.code,
        error.message
      );

      callback(null);
      onError?.(error);
    }
  );
};

// STAFF ONLY: never call this from a family screen.
export const subscribeToSurgeries = (
  callback: (surgeries: SurgeryOperation[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const surgeriesQuery = query(
    surgeriesCollection,
    orderBy('scheduledDate', 'desc')
  );

  return onSnapshot(
    surgeriesQuery,
    (snapshot) => {
      callback(
        snapshot.docs.map((document) =>
          mapSurgery(document)
        )
      );
    },
    (error) => {
      console.error(
        'subscribeToSurgeries error:',
        error.code,
        error.message
      );

      callback([]);
      onError?.(error);
    }
  );
};

// STAFF ONLY
export const subscribeToSurgeriesByHospital = (
  hospitalId: string,
  callback: (surgeries: SurgeryOperation[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const surgeriesQuery = query(
    surgeriesCollection,
    where('hospitalId', '==', hospitalId),
    orderBy('scheduledDate', 'desc')
  );

  return onSnapshot(
    surgeriesQuery,
    (snapshot) => {
      callback(
        snapshot.docs.map((document) =>
          mapSurgery(document)
        )
      );
    },
    (error) => {
      console.error(
        'subscribeToSurgeriesByHospital error:',
        error.code,
        error.message
      );

      callback([]);
      onError?.(error);
    }
  );
};

// FAMILY ONLY
export const subscribeToSurgeriesByFamilyPhone = (
  phoneNumber: string,
  callback: (surgeries: SurgeryOperation[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const cleanPhoneNumber =
    normalizePhone(phoneNumber);

  if (!cleanPhoneNumber) {
    callback([]);

    return () => undefined;
  }

  const surgeriesQuery = query(
    surgeriesCollection,
    where(
      'familyPhoneNumbers',
      'array-contains',
      cleanPhoneNumber
    ),
    orderBy('scheduledDate', 'desc')
  );

  return onSnapshot(
    surgeriesQuery,
    (snapshot) => {
      callback(
        snapshot.docs.map((document) =>
          mapSurgery(document)
        )
      );
    },
    (error) => {
      console.error(
        'subscribeToSurgeriesByFamilyPhone error:',
        error.code,
        error.message
      );

      callback([]);
      onError?.(error);
    }
  );
};

// FAMILY TOKEN ONLY
export const subscribeToSurgeriesByFamilyToken = (
  token: string,
  callback: (surgeries: SurgeryOperation[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const cleanToken = token.trim();

  if (!cleanToken) {
    callback([]);

    return () => undefined;
  }

  const surgeriesQuery = query(
    surgeriesCollection,
    where(
      'familyNotificationTokens',
      'array-contains',
      cleanToken
    ),
    orderBy('scheduledDate', 'desc')
  );

  return onSnapshot(
    surgeriesQuery,
    (snapshot) => {
      callback(
        snapshot.docs.map((document) =>
          mapSurgery(document)
        )
      );
    },
    (error) => {
      console.error(
        'subscribeToSurgeriesByFamilyToken error:',
        error.code,
        error.message
      );

      callback([]);
      onError?.(error);
    }
  );
};