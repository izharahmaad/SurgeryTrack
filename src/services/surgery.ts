import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { SurgeryOperation } from '@/types';

const SURGERIES_COLLECTION = 'surgeries';

// ========== CRUD OPERATIONS ==========

export const createSurgery = async (
  surgeryData: Omit<SurgeryOperation, 'id' | 'qrCodeData' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const surgeryRef = doc(collection(db, SURGERIES_COLLECTION));
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

export const getSurgery = async (surgeryId: string): Promise<SurgeryOperation | null> => {
  const docRef = doc(db, SURGERIES_COLLECTION, surgeryId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as SurgeryOperation) : null;
};

// ✅ Resolve a scanned QR payload back to a surgery record
export const getSurgeryByQrData = async (qrData: string): Promise<SurgeryOperation | null> => {
  try {
    const parsed = JSON.parse(qrData);
    if (!parsed?.surgeryId) return null;
    return await getSurgery(parsed.surgeryId);
  } catch (error) {
    console.error('getSurgeryByQrData error:', error);
    return null;
  }
};

export const getSurgeriesByHospital = async (hospitalId: string): Promise<SurgeryOperation[]> => {
  const q = query(
    collection(db, SURGERIES_COLLECTION),
    where('hospitalId', '==', hospitalId),
    orderBy('scheduledDate', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as SurgeryOperation);
};

export const updateSurgeryStatus = async (
  surgeryId: string,
  status: SurgeryOperation['status'],
  extraUpdates?: Partial<SurgeryOperation>
): Promise<void> => {
  const docRef = doc(db, SURGERIES_COLLECTION, surgeryId);
  const updateData: Record<string, any> = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === 'in_surgery' && !extraUpdates?.startTime) {
    updateData.startTime = serverTimestamp();
  }
  if (status === 'completed' && !extraUpdates?.actualEndTime) {
    updateData.actualEndTime = serverTimestamp();
  }

  await updateDoc(docRef, { ...updateData, ...extraUpdates });
};

export const deleteSurgery = async (surgeryId: string): Promise<void> => {
  await deleteDoc(doc(db, SURGERIES_COLLECTION, surgeryId));
};

// ========== REAL-TIME SUBSCRIPTIONS ==========

// ✅ NEW: Subscribe to a SINGLE surgery by ID (for SurgeryDetailScreen)
export const subscribeToSurgery = (
  surgeryId: string,
  callback: (surgery: SurgeryOperation | null) => void
) => {
  const docRef = doc(db, SURGERIES_COLLECTION, surgeryId);
  return onSnapshot(
    docRef,
    (docSnap) => {
      callback(docSnap.exists() ? (docSnap.data() as SurgeryOperation) : null);
    },
    (error) => {
      console.error('subscribeToSurgery error:', error.code, error.message);
      callback(null);
    }
  );
};

export const subscribeToSurgeries = (
  callback: (surgeries: SurgeryOperation[]) => void
) => {
  const q = query(collection(db, SURGERIES_COLLECTION), orderBy('scheduledDate', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const surgeries = snapshot.docs.map(doc => doc.data() as SurgeryOperation);
    callback(surgeries);
  }, (error) => {
    console.error('subscribeToSurgeries error:', error.code, error.message);
    callback([]);
  });
};

export const subscribeToSurgeriesByHospital = (
  hospitalId: string,
  callback: (surgeries: SurgeryOperation[]) => void
) => {
  const q = query(
    collection(db, SURGERIES_COLLECTION),
    where('hospitalId', '==', hospitalId),
    orderBy('scheduledDate', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const surgeries = snapshot.docs.map(doc => doc.data() as SurgeryOperation);
    callback(surgeries);
  }, (error) => {
    console.error('subscribeToSurgeriesByHospital error:', error.code, error.message);
    callback([]);
  });
};

export const subscribeToSurgeriesByFamilyPhone = (
  phoneNumber: string,
  callback: (surgeries: SurgeryOperation[]) => void
) => {
  const q = query(
    collection(db, SURGERIES_COLLECTION),
    where('familyPhoneNumbers', 'array-contains', phoneNumber),
    orderBy('scheduledDate', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const surgeries = snapshot.docs.map(doc => doc.data() as SurgeryOperation);
    callback(surgeries);
  }, (error) => {
    console.error('subscribeToSurgeriesByFamilyPhone error:', error.code, error.message);
    callback([]);
  });
};

export const subscribeToSurgeriesByFamilyToken = (
  token: string,
  callback: (surgeries: SurgeryOperation[]) => void
) => {
  const q = query(
    collection(db, SURGERIES_COLLECTION),
    where('familyNotificationTokens', 'array-contains', token),
    orderBy('scheduledDate', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const surgeries = snapshot.docs.map(doc => doc.data() as SurgeryOperation);
    callback(surgeries);
  }, (error) => {
    console.error('subscribeToSurgeriesByFamilyToken error:', error.code, error.message);
    callback([]);
  });
};