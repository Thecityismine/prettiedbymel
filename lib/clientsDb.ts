import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { db, auth, authReady } from "./firebase";
import type { Client } from "./types";

const col = collection(db, "clients");

export async function getClients(): Promise<Client[]> {
  if (!auth.currentUser) await authReady;
  const snap = await getDocs(query(col, orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Client));
}

export async function getClient(id: string): Promise<Client | null> {
  if (!auth.currentUser) await authReady;
  const snap = await getDoc(doc(db, "clients", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Client;
}

export async function addClient(data: Omit<Client, "id">): Promise<string> {
  if (!auth.currentUser) await authReady;
  const ref = await addDoc(col, data);
  return ref.id;
}

export async function updateClient(id: string, data: Partial<Client>): Promise<void> {
  if (!auth.currentUser) await authReady;
  await updateDoc(doc(db, "clients", id), data);
}

export async function deleteClient(id: string): Promise<void> {
  if (!auth.currentUser) await authReady;
  await deleteDoc(doc(db, "clients", id));
}

export function weeksAgo(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}
