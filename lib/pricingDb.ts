import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { defaultServices } from "./defaultServices";
import type { Service } from "./types";

const PRICING_DOC = doc(db, "settings", "pricing");

export async function loadServices(): Promise<Service[]> {
  const snap = await getDoc(PRICING_DOC);
  if (snap.exists()) {
    return snap.data().services as Service[];
  }
  await setDoc(PRICING_DOC, { services: defaultServices });
  return defaultServices;
}

export async function saveServices(services: Service[]): Promise<void> {
  await setDoc(PRICING_DOC, { services });
}
