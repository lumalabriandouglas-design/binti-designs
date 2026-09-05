const KEY = "binti-house-notes";

export type Book = {
  tagline: string;
  about: string;
  whatsapp: string;
  phone: string;
  payment_phone: string;
  instagram: string;
  tiktok: string;
};

const EMPTY: Book = {
  tagline: "Cut. Drape. Belong.",
  about: "",
  whatsapp: "+256740711344",
  phone: "+256740711344",
  payment_phone: "+256740711344",
  instagram: "https://www.instagram.com/binti_dezigns",
  tiktok: "",
};

export function readHouseBook(): Book {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}

export function writeHouseBook(book: Book) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(book));
}

export function mergeBooks(...parts: Array<Partial<Book> | null | undefined>): Book {
  return parts.reduce<Book>((acc, part) => {
    if (!part) return acc;
    return {
      tagline: part.tagline || acc.tagline,
      about: part.about || acc.about,
      whatsapp: part.whatsapp || acc.whatsapp,
      phone: part.phone || acc.phone,
      payment_phone: part.payment_phone || acc.payment_phone,
      instagram: part.instagram || acc.instagram,
      tiktok: part.tiktok || acc.tiktok,
    };
  }, EMPTY);
}
