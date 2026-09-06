import type { JournalEntry, OrderRow, Piece, Settings } from "@/lib/server/boutique";

export type CallbackRow = {
  id: number;
  name: string;
  phone: string;
  note: string;
  piece_slug: string;
  status: string;
  created_at: string;
};

export function useMemoryDb() {
  return Boolean(process.env.VERCEL) && !process.env.DATABASE_URL;
}

const now = () => new Date().toISOString();

type Memory = {
  pin: string;
  pin_changed: boolean;
  settings: Settings;
  pieces: Piece[];
  journal: JournalEntry[];
  orders: OrderRow[];
  callbacks: CallbackRow[];
  tokens: Set<string>;
  wishlists: Map<string, number[]>;
  nextPiece: number;
  nextJournal: number;
  nextOrder: number;
  nextCallback: number;
};

const g = globalThis as typeof globalThis & { __bintiMemory__?: Memory };

function seed(): Memory {
  return {
    pin: "2408",
    pin_changed: false,
    settings: {
      id: 1,
      brand_name: "BINTI DESIGNS",
      tagline: "Cut. Drape. Belong.",
      whatsapp: "",
      phone: "",
      payment_phone: "",
      instagram: "https://www.instagram.com/binti_dezigns",
      drape_url: "https://odrapecollective.com",
      about:
        "BINTI DESIGNS is an East African atelier devoted to precise cut, quiet luxury, and clothes that hold their shape in the light.",
      pin_changed: false,
      admin_email: "bintidesigns442@gmail.com",
    },
    pieces: [],
    journal: [],
    orders: [],
    callbacks: [],
    tokens: new Set(),
    wishlists: new Map(),
    nextPiece: 1,
    nextJournal: 1,
    nextOrder: 1,
    nextCallback: 1,
  };
}

export function memory(): Memory {
  g.__bintiMemory__ ??= seed();
  return g.__bintiMemory__;
}
