import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

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
  created_at: string;
};

export type Inquiry = {
  id: string;
  name: string;
  phone: string;
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
    created_at: String(data.created_at ?? ""),
  };
}

export async function listLooks(): Promise<Look[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const snap = await getDocs(collection(db, "pieces"));
  return snap.docs
    .map((row) => asLook(row.id, row.data()))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
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
}) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Could not send the request.");
  await addDoc(collection(db, "inquiries"), {
    name: input.name,
    phone: input.phone,
    note: input.note,
    pieceSlug: input.pieceSlug,
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
        note: String(data.note ?? ""),
        pieceSlug: String(data.pieceSlug ?? ""),
        createdAt: String(data.createdAt?.toDate?.() ?? ""),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
