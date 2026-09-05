import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

const moneyKeys = [
  'amount',
  'balance',
  'overdraftLimit',
  'totalLimit',
  'usedLimit',
  'originalAmount',
  'offerAmount',
  'monthlyInstallment',
  'baseAllocated'
];

const parseLocalizedMoney = (value) => {
  if (value === null || value === undefined || value === '') return value;
  if (typeof value === 'number') return value;

  const stringValue = String(value).trim().replace(/\s+/g, '');
  if (!stringValue) return value;

  const normalized = stringValue.includes(',') && stringValue.includes('.')
    ? stringValue.replace(/\./g, '').replace(',', '.')
    : stringValue.replace(',', '.');

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : value;
};

const normalizeSnapshotRecord = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeSnapshotRecord);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => {
        if (moneyKeys.includes(key)) {
          return [key, parseLocalizedMoney(entryValue)];
        }
        return [key, normalizeSnapshotRecord(entryValue)];
      })
    );
  }

  return value;
};

// Real-time synchronization helper for Firestore DB collections
export const subscribeToCollection = (collectionName, callback) => {
  try {
    const colRef = collection(db, collectionName);
    return onSnapshot(colRef, (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        items.push(normalizeSnapshotRecord({ ...docSnap.data(), id: docSnap.id }));
      });
      callback(items);
    }, (error) => {
      console.warn(`Firestore listener error on "${collectionName}":`, error);
    });
  } catch (err) {
    console.warn(`Failed to subscribe to collection "${collectionName}":`, err);
    return () => {};
  }
};

// Save or update document in Firestore
export const saveDocument = async (collectionName, id, data) => {
  try {
    const docRef = doc(db, collectionName, String(id));
    await setDoc(docRef, data, { merge: true });
  } catch (err) {
    console.error(`Firestore save error on "${collectionName}/${id}":`, err);
  }
};

// Delete document from Firestore
export const removeDocument = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, String(id));
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Firestore delete error on "${collectionName}/${id}":`, err);
  }
};
