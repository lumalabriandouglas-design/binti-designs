import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/firebase";
import { useBag, type BagItem } from "@/lib/bag";

const PENDING = "binti.pending-look";
const NEXT = "binti.next";

export function rememberNext(path: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(NEXT, path);
}

export function takeNext() {
  if (typeof window === "undefined") return "/account";
  const next = window.sessionStorage.getItem(NEXT);
  window.sessionStorage.removeItem(NEXT);
  return next || "/account";
}

export function stashPendingLook(item: Omit<BagItem, "qty">) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING, JSON.stringify(item));
}

export function takePendingLook(): Omit<BagItem, "qty"> | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PENDING);
  window.sessionStorage.removeItem(PENDING);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Omit<BagItem, "qty">;
  } catch {
    return null;
  }
}

export async function loadRemoteBag(uid: string): Promise<BagItem[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const snap = await getDoc(doc(db, "bags", uid));
  if (!snap.exists()) return [];
  const rows = snap.data().items;
  return Array.isArray(rows) ? (rows as BagItem[]) : [];
}

export async function saveRemoteBag(uid: string, items: BagItem[]) {
  const db = getFirebaseDb();
  if (!db) return;
  await setDoc(doc(db, "bags", uid), { items, updatedAt: Date.now() }, { merge: true });
}

export function mergeBags(local: BagItem[], remote: BagItem[]): BagItem[] {
  const map = new Map<number | string, BagItem>();
  for (const item of [...remote, ...local]) {
    const key = item.slug || item.id;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, item);
      continue;
    }
    map.set(key, { ...prev, qty: Math.max(prev.qty, item.qty) });
  }
  return [...map.values()];
}

export async function hydrateClientBag(uid: string) {
  const pending = takePendingLook();
  if (pending) useBag.getState().add(pending);
  const remote = await loadRemoteBag(uid);
  const merged = mergeBags(useBag.getState().items, remote);
  useBag.setState({ items: merged });
  await saveRemoteBag(uid, merged);
}

export type SavedLook = {
  slug: string;
  title: string;
  subtitle: string;
  cover_url: string;
  price_cents: number;
  currency: string;
  savedAt: number;
};

export async function loadSavedLooks(uid: string): Promise<SavedLook[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const snap = await getDoc(doc(db, "closets", uid));
  if (!snap.exists()) return [];
  const rows = snap.data().looks;
  return Array.isArray(rows) ? (rows as SavedLook[]) : [];
}

export async function writeSavedLooks(uid: string, looks: SavedLook[]) {
  const db = getFirebaseDb();
  if (!db) return;
  await setDoc(doc(db, "closets", uid), { looks, updatedAt: Date.now() }, { merge: true });
}

export async function toggleSavedLook(uid: string, look: Omit<SavedLook, "savedAt">) {
  const current = await loadSavedLooks(uid);
  const exists = current.some((row) => row.slug === look.slug);
  const next = exists
    ? current.filter((row) => row.slug !== look.slug)
    : [{ ...look, savedAt: Date.now() }, ...current];
  await writeSavedLooks(uid, next);
  return { saved: !exists, looks: next };
}

export async function dropSavedLook(uid: string, slug: string) {
  const next = (await loadSavedLooks(uid)).filter((row) => row.slug !== slug);
  await writeSavedLooks(uid, next);
  return next;
}
