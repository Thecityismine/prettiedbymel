import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth, authReady } from "./firebase";
import { defaultServices } from "./defaultServices";
import type { Service } from "./types";

const PRICING_DOC = doc(db, "settings", "pricing");

export async function loadServices(): Promise<Service[]> {
  if (!auth.currentUser) await authReady;
  const snap = await getDoc(PRICING_DOC);
  if (snap.exists()) {
    return snap.data().services as Service[];
  }
  await setDoc(PRICING_DOC, { services: defaultServices });
  return defaultServices;
}

export async function saveServices(services: Service[]): Promise<void> {
  if (!auth.currentUser) await authReady;
  const timedOut = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Save timed out — check your connection.")), 12000)
  );
  await Promise.race([setDoc(PRICING_DOC, { services }), timedOut]);
}
