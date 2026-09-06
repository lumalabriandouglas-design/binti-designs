import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { houseSignOut, useHouseUser } from "@/lib/firebase/session";
import { isHouseAccount } from "@/lib/house";
import { useBag } from "@/lib/bag";
import type { Settings } from "@/lib/server/boutique";
import { getHouseNotes } from "@/lib/firebase/catalog";
import { InstagramMark, TikTokMark } from "@/components/brand-marks";
import { HouseContact, mergeHouse } from "@/components/house-contact";

const NAV = [
  { to: "/collection", label: "Collection" },
  { to: "/reels", label: "Reels" },
  { to: "/atelier", label: "House" },
] as const;

export function SiteShell({
  children,
  settings,
  overlay = false,
}: {
  children: React.ReactNode;
  settings?: Settings | null;
  overlay?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const count = useBag((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const { user } = useHouseUser();
  const houseAccount = isHouseAccount(user?.primaryEmail, settings?.admin_email);
  const notes = useQuery({ queryKey: ["house-notes"], queryFn: getHouseNotes });
  const house = mergeHouse(settings, notes.data);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const float = overlay && !scrolled;
  const ink = float ? "text-[#f6f1ea]" : "text-ink";
  const mute = float ? "text-[#f6f1ea]/70" : "text-mute";

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
          float ? "bg-transparent" : "border-b border-line bg-paper/92 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 sm:px-6 sm:py-5 md:grid-cols-[1fr_auto_1fr] md:px-10">
          <Link to="/" className={`display text-xl tracking-tight sm:text-2xl md:text-3xl ${ink}`}>
            BINTI DESIGNS
          </Link>
          <nav className="hidden items-center gap-10 md:flex" aria-label="House">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-mark ${pathname.startsWith(item.to) ? `nav-mark-on ${ink}` : mute}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className={`flex items-center justify-end gap-5 ${ink}`}>
            {user ? (
              <AccountMark
                letter={(user.primaryEmail || user.displayName || "B").trim().charAt(0).toUpperCase()}
                house={houseAccount}
                float={float}
              />
            ) : (
              <Link to="/login" className={`hidden nav-mark sm:inline-flex ${mute}`}>
                Sign in
              </Link>
            )}
            <Link to="/bag" aria-label="Cart" className={`relative ${ink}`}>
              <ShoppingBag className="h-5 w-5" strokeWidth={1.25} />
              {count ? (
                <span className="absolute -right-2 -top-2 min-w-4 text-center text-[0.6rem]">{count}</span>
              ) : null}
            </Link>
          </div>
        </div>
        {float ? null : (
        <nav className="flex justify-center gap-8 border-t border-line px-4 py-3 md:hidden" aria-label="House">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-mark ${pathname.startsWith(item.to) ? `nav-mark-on text-ink` : "text-mute"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        )}
      </header>
      <main className={overlay ? "" : "pt-20 sm:pt-24"}>{children}</main>
      <footer className="mt-16 border-t border-line sm:mt-24 md:mt-32">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 sm:py-16 md:grid-cols-3 md:px-10 md:py-20">
          <p className="text-3xl sm:text-4xl md:text-5xl">BINTI DESIGNS</p>
          <p className="text-sm leading-relaxed text-mute">{house.tagline}</p>
          <div className="text-sm leading-7 text-mute">
            {house.instagram ? (
              <a
                href={house.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-ink"
              >
                <InstagramMark className="h-4 w-4" />
                Instagram
              </a>
            ) : null}
            {house.tiktok ? (
              <>
                <br />
                <a
                  href={house.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-ink"
                >
                  <TikTokMark className="h-4 w-4" />
                  TikTok
                </a>
              </>
            ) : null}
            {settings?.drape_url ? (
              <>
                <br />
                <a href={settings.drape_url} target="_blank" rel="noreferrer">
                  Drapé Collective
                </a>
              </>
            ) : null}
            <div className="mt-4">
              <HouseContact house={house} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AccountMark({
  letter,
  house,
  float,
}: {
  letter: string;
  house: boolean;
  float: boolean;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label="Account"
        aria-expanded={open}
        className={`grid size-8 place-items-center rounded-full border text-[0.7rem] tracking-[0.08em] ${
          float ? "border-[#f6f1ea]/50" : "border-line"
        }`}
        onClick={() => setOpen((value) => !value)}
      >
        {letter}
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-50 min-w-44 border border-line bg-paper py-2 text-ink shadow-sm">
          <Link
            to={house ? "/atelier-studio" : "/account"}
            className="block px-4 py-2 text-[11px] uppercase tracking-[0.16em]"
            onClick={() => setOpen(false)}
          >
            {house ? "Studio" : "Your floor"}
          </Link>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-[11px] uppercase tracking-[0.16em] text-mute"
            onClick={() => {
              setOpen(false);
              void houseSignOut();
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
