import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BagItem = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  price_cents: number;
  currency: string;
  cover_url: string;
  qty: number;
};

type BagState = {
  items: BagItem[];
  add: (item: Omit<BagItem, "qty">) => void;
  remove: (id: number) => void;
  removeSlug: (slug: string) => void;
  setQty: (id: number, qty: number) => void;
  clear: () => void;
};

export const useBag = create<BagState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === item.id ? { ...i, qty: i.qty + 1 } : i,
            ),
          });
          return;
        }
        set({ items: [...get().items, { ...item, qty: 1 }] });
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      removeSlug: (slug) => set({ items: get().items.filter((i) => i.slug !== slug) }),
      setQty: (id, qty) =>
        set({
          items: get()
            .items.map((i) => (i.id === id ? { ...i, qty } : i))
            .filter((i) => i.qty > 0),
        }),
      clear: () => set({ items: [] }),
    }),
    { name: "binti.bag" },
  ),
);

export const STUDIO_TOKEN_KEY = "binti.studio";

export function getStudioToken() {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(STUDIO_TOKEN_KEY) ?? "";
}

export function setStudioToken(token: string) {
  window.sessionStorage.setItem(STUDIO_TOKEN_KEY, token);
}

export function clearStudioToken() {
  window.sessionStorage.removeItem(STUDIO_TOKEN_KEY);
}
