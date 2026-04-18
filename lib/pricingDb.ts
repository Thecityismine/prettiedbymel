import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth, authReady } from "./firebase";
import { restPatch } from "./firestoreRest";
import { cacheGet, cacheSet } from "./cache";
import { defaultServices } from "./defaultServices";
import type { Service } from "./types";

const PRICING_DOC = doc(db, "settings", "pricing");
const KEY = "services";

export async function loadServices(): Promise<Service[]> {
  const hit = cacheGet<Service[]>(KEY);
  if (hit) {
    if (hit.stale) {
      (async () => {
        if (!auth.currentUser) await authReady;
        const snap = await getDoc(PRICING_DOC);
        if (snap.exists()) cacheSet(KEY, snap.data().services as Service[]);
      })().catch(() => {});
    }
    return hit.data;
  }
  if (!auth.currentUser) await authReady;
  const snap = await getDoc(PRICING_DOC);
  if (snap.exists()) {
    const data = snap.data().services as Service[];
    cacheSet(KEY, data);
    return data;
  }
  await setDoc(PRICING_DOC, { services: defaultServices });
  cacheSet(KEY, defaultServices);
  return defaultServices;
}

export async function saveServices(services: Service[]): Promise<void> {
  await restPatch("settings", "pricing", { services });
  cacheSet(KEY, services);
}
