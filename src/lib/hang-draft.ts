export type HangDraft = {
  slot: string;
  title: string;
  subtitle: string;
  description: string;
  caption: string;
  category: string;
  price: string;
  cover: string;
  gallery: string[];
  video: string;
  soldOut: boolean;
  hidden: boolean;
  savedAt: number;
};

const PREFIX = "binti.hang-draft.";

function keyFor(slot: string) {
  return PREFIX + (slot || "new");
}

function slimUrl(url: string) {
  if (!url || url.startsWith("data:")) return "";
  return url;
}

export function readHangDraft(slot = "new"): HangDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(slot));
    if (!raw) return null;
    const draft = JSON.parse(raw) as HangDraft;
    if (!draft || typeof draft !== "object") return null;
    return draft;
  } catch {
    return null;
  }
}

export function writeHangDraft(draft: HangDraft) {
  if (typeof window === "undefined") return;
  const payload: HangDraft = {
    ...draft,
    cover: slimUrl(draft.cover),
    video: slimUrl(draft.video),
    gallery: draft.gallery.map(slimUrl).filter(Boolean),
  };
  try {
    window.localStorage.setItem(keyFor(draft.slot), JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function clearHangDraft(slot = "new") {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(keyFor(slot));
}
