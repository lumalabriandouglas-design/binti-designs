import type { JournalEntry, OrderRow, Piece, Settings } from "@/lib/server/boutique";

export function useMemoryDb() {
  return Boolean(process.env.VERCEL) && !process.env.DATABASE_URL;
}

const now = () => new Date().toISOString();

function look(
  id: number,
  slug: string,
  subtitle: string,
  description: string,
  price: number,
  caption: string,
): Piece {
  return {
    id,
    slug,
    title: "The Wrap Set",
    subtitle,
    description,
    price_cents: price,
    currency: "KES",
    category: "Set",
    cover_url: "/looks/wrap-set.jpg",
    gallery: "[]",
    video_url: "",
    caption,
    status: "published",
    publish_to_drape: false,
    drape_status: "idle",
    created_at: now(),
  };
}

type Memory = {
  pin: string;
  pin_changed: boolean;
  settings: Settings;
  pieces: Piece[];
  journal: JournalEntry[];
  orders: OrderRow[];
  tokens: Set<string>;
  wishlists: Map<string, number[]>;
  nextPiece: number;
  nextJournal: number;
  nextOrder: number;
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
    },
    pieces: [
      look(
        1,
        "wrap-set-midnight",
        "Midnight",
        "One-shoulder wrap top with a falling sash, cut against a close capri. Made to travel from daylight into evening without changing its mind.",
        18500,
        "Midnight wrap. Gold at the ear. Quiet power.",
      ),
      look(
        2,
        "wrap-set-pewter",
        "Pewter",
        "The same architecture in a cooler metal. Light gathers on the sash and leaves the rest of the body clean.",
        18500,
        "Pewter in late sun. The sash does the talking.",
      ),
      look(
        3,
        "wrap-set-crimson",
        "Crimson",
        "A saturated red that holds its depth indoors. Wear it with a small bag and nothing else that argues.",
        19500,
        "Crimson wrap. The room rearranges itself.",
      ),
    ],
    journal: [],
    orders: [],
    tokens: new Set(),
    wishlists: new Map(),
    nextPiece: 4,
    nextJournal: 1,
    nextOrder: 1,
  };
}

export function memory(): Memory {
  g.__bintiMemory__ ??= seed();
  return g.__bintiMemory__;
}
