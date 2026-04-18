import { doc, getDoc } from "firebase/firestore";
import { db, auth, authReady } from "./firebase";
import { restList, restPost, restUpdate, restDelete } from "./firestoreRest";
import { cacheGet, cacheSet, cacheInvalidate } from "./cache";
import type { Client } from "./types";

const KEY = "clients";

async function fetchClients(): Promise<Client[]> {
  const docs = await restList("clients");
  return (docs as unknown as Client[]).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getClients(): Promise<Client[]> {
  const hit = cacheGet<Client[]>(KEY);
  if (hit) {
    if (hit.stale) fetchClients().then((d) => cacheSet(KEY, d)).catch(() => {});
    return hit.data;
  }
  const data = await fetchClients();
  cacheSet(KEY, data);
  return data;
}

export async function getClient(id: string): Promise<Client | null> {
  if (!auth.currentUser) await authReady;
  const snap = await getDoc(doc(db, "clients", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Client;
}

export async function addClient(data: Omit<Client, "id">): Promise<string> {
  const id = await restPost("clients", data as unknown as Record<string, unknown>);
  cacheInvalidate(KEY);
  return id;
}

export async function updateClient(id: string, data: Partial<Client>): Promise<void> {
  await restUpdate("clients", id, data as Record<string, unknown>);
  cacheInvalidate(KEY);
}

export async function deleteClient(id: string): Promise<void> {
  await restDelete("clients", id);
  cacheInvalidate(KEY);
}

export function weeksAgo(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}
