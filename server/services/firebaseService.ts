import { firebaseDb } from '../database-config.js';

export async function getUserById(id: string) {
  const doc = await firebaseDb.collection('users').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function createUser(data: any) {
  const ref = await firebaseDb.collection('users').add(data);
  const doc = await ref.get();
  return { id: doc.id, ...doc.data() };
}

export async function createResetRequest(data: any) {
  const ref = await firebaseDb.collection('resetRequests').add({
    ...data,
    createdAt: new Date(),
    status: 'pending',
  });
  const doc = await ref.get();
  return { id: doc.id, ...doc.data() };
}

export function initFirebase() {
  // No-op, already initialized in database-config
  return {};
}

export async function getFirebaseUser(uid: string) {
  return getUserById(uid);
} 