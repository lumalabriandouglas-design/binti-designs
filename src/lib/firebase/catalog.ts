import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { resolveMediaBatch } from "@/lib/server/upload";

export type Look = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  caption: string;
  price_cents: number;
  currency: string;
  category: string;
  cover_url: string;
  gallery: string[];
  video_url: string;
  sold_out: boolean;
  hidden: boolean;
  created_at: string;
};

export type Inquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  accountId: string;
  accountName: string;
  note: string;
  pieceSlug: string;
  createdAt: string;
};

function asLook(id: string, data: DocumentData): Look {
  return {
    id,
    slug: String(data.slug ?? id),
    title: String(data.title ?? "Untitled"),
    subtitle: String(data.subtitle ?? ""),
    description: String(data.description ?? ""),
    caption: String(data.caption ?? ""),
    price_cents: Number(data.price_cents ?? 0),
    currency: String(data.currency ?? "UGX"),
    category: String(data.category ?? "Look"),
    cover_url: String(data.cover_url ?? ""),
    gallery: Array.isArray(data.gallery) ? data.gallery.map(String) : [],
    video_url: String(data.video_url ?? ""),
    sold_out: Boolean(data.sold_out),
    hidden: Boolean(data.hidden),
    created_at: String(data.created_at ?? ""),
  };
}

async function resolveRefs(looks: Look[], keys: Array<"cover" | "gallery" | "video">) {
  const refs = looks.flatMap((look) => {
    const urls: string[] = [];
    if (keys.includes("cover")) urls.push(look.cover_url);
    if (keys.includes("video")) urls.push(look.video_url);
    if (keys.includes("gallery")) urls.push(...look.gallery);
    return urls.filter((url) => url.startsWith("r2:"));
  });
  if (!refs.length) return looks;
  try {
    const map = await resolveMediaBatch({ data: { refs: [...new Set(refs)] } });
    return looks.map((look) => ({
      ...look,
      cover_url: map[look.cover_url] || look.cover_url,
      video_url: look.video_url ? map[look.video_url] || look.video_url : look.video_url,
      gallery: look.gallery.map((url) => map[url] || url),
    }));
  } catch {
    return looks;
  }
}

export async function listLooks(): Promise<Look[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const snap = await getDocs(collection(db, "pieces"));
  const looks = snap.docs
    .map((row) => asLook(row.id, row.data()))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return resolveRefs(looks, ["cover", "gallery", "video"]);
}

export async function listPublicLooks(): Promise<Look[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const snap = await getDocs(collection(db, "pieces"));
  const looks = snap.docs
    .map((row) => asLook(row.id, row.data()))
    .filter((look) => !look.hidden)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return resolveRefs(looks, ["cover"]);
}

export async function hydrateLook(look: Look): Promise<Look> {
  const [ready] = await resolveRefs([look], ["cover", "gallery", "video"]);
  return ready ?? look;
}

export async function setLookHidden(id: string, hidden: boolean) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Archive is not connected.");
  await updateDoc(doc(db, "pieces", id), { hidden });
}

export async function saveLook(look: Partial<Look> & { title: string; cover_url: string }) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Archive is not connected.");
  const payload = {
    slug: look.slug || look.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title: look.title,
    subtitle: look.subtitle ?? "",
    description: look.description ?? "",
    caption: look.caption ?? "",
    price_cents: look.price_cents ?? 0,
    currency: look.currency ?? "UGX",
    category: look.category ?? "Look",
    cover_url: look.cover_url,
    gallery: look.gallery ?? [],
    video_url: look.video_url ?? "",
    sold_out: Boolean(look.sold_out),
    hidden: Boolean(look.hidden),
    created_at: look.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (look.id) {
    await updateDoc(doc(db, "pieces", look.id), payload);
    return look.id;
  }
  const row = await addDoc(collection(db, "pieces"), payload);
  return row.id;
}

export async function removeLook(id: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Archive is not connected.");
  await deleteDoc(doc(db, "pieces", id));
}

export async function setLookSoldOut(id: string, sold_out: boolean) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Archive is not connected.");
  await updateDoc(doc(db, "pieces", id), { sold_out });
}

export async function sendInquiry(input: {
  name: string;
  phone: string;
  note: string;
  pieceSlug: string;
  email?: string;
  accountId?: string;
  accountName?: string;
}) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Could not send the request.");
  await addDoc(collection(db, "inquiries"), {
    name: input.name,
    phone: input.phone,
    note: input.note,
    pieceSlug: input.pieceSlug,
    email: input.email ?? "",
    accountId: input.accountId ?? "",
    accountName: input.accountName ?? "",
    createdAt: serverTimestamp(),
  });
}

export async function listInquiries(): Promise<Inquiry[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const snap = await getDocs(collection(db, "inquiries"));
  return snap.docs
    .map((row) => {
      const data = row.data();
      return {
        id: row.id,
        name: String(data.name ?? ""),
        phone: String(data.phone ?? ""),
        email: String(data.email ?? ""),
        accountId: String(data.accountId ?? ""),
        accountName: String(data.accountName ?? ""),
        note: String(data.note ?? ""),
        pieceSlug: String(data.pieceSlug ?? ""),
        createdAt: String(data.createdAt?.toDate?.() ?? ""),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type HouseNotes = {
  tagline: string;
  about: string;
  whatsapp: string;
  phone: string;
  payment_phone: string;
  instagram: string;
  tiktok: string;
};

export async function getHouseNotes(): Promise<HouseNotes | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, "house", "notes"));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    tagline: String(data.tagline ?? ""),
    about: String(data.about ?? ""),
    whatsapp: String(data.whatsapp ?? ""),
    phone: String(data.phone ?? ""),
    payment_phone: String(data.payment_phone ?? ""),
    instagram: String(data.instagram ?? ""),
    tiktok: String(data.tiktok ?? ""),
  };
}

export async function saveHouseNotes(notes: HouseNotes) {
  const db = getFirebaseDb();
  if (!db) throw new Error("House book is not connected.");
  await setDoc(doc(db, "house", "notes"), notes, { merge: true });
}

