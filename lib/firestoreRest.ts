import { auth, authReady } from "./firebase";

type FirestoreValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { stringValue: string }
  | { arrayValue: { values: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } };

function toValue(v: unknown): FirestoreValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === "object") {
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      fields[k] = toValue(val);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

function toDocument(obj: Record<string, unknown>) {
  const fields: Record<string, FirestoreValue> = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toValue(v);
  }
  return { fields };
}

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;

// POST to a collection — Firestore assigns a random document ID, returns it.
export async function restPost(
  col: string,
  data: Record<string, unknown>,
): Promise<string> {
  if (!auth.currentUser) await authReady;
  const token = await auth.currentUser!.getIdToken();
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${col}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(toDocument(data)),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Firestore create failed (${res.status}): ${msg}`);
  }

  const json = await res.json();
  // name is like "projects/.../databases/.../documents/clients/DOCID"
  return (json.name as string).split("/").pop()!;
}

export async function restPatch(
  collection: string,
  docId: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!auth.currentUser) await authReady;
  const token = await auth.currentUser!.getIdToken();
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${collection}/${docId}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(toDocument(data)),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Firestore write failed (${res.status}): ${msg}`);
  }
}
