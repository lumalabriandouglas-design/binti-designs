import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CircleUser, ShoppingBag } from "lucide-react";
import { HouseSignedIn, houseSignOut, useHouseUser } from "@/lib/firebase/session";
import { isHouseAccount } from "@/lib/house";
import { useBag } from "@/lib/bag";
import type { Settings } from "@/lib/server/boutique";
import { getHouseNotes } from "@/lib/firebase/catalog";
import { HouseCurtain } from "@/components/house-curtain";
import { HouseContact, mergeHouse } from "@/components/house-contact";

const NAV = [
  { to: "/collection", label: "Collection" },
  { to: "/atelier", label: "House" },
  { to: "/journal", label: "Notes" },
] as const;

export function SiteShell({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings?: Settings | null;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const count = useBag((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const { user } = useHouseUser();
  const houseAccount = isHouseAccount(user?.primaryEmail, settings?.admin_email);
  const notes = useQuery({ queryKey: ["house-notes"], queryFn: getHouseNotes });
  const house = mergeHouse(settings, notes.data);
  const hidden = pathname.startsWith("/atelier-studio");

  return (
    <div className="min-h-dvh bg-paper text-ink">
      {hidden ? null : <HouseCurtain />}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6 md:px-10">
          <Link to="/" className="display text-2xl tracking-tight md:text-3xl">
            BINTI DESIGNS
          </Link>
          <nav className="hidden items-center gap-8 text-[0.68rem] tracking-[0.24em] uppercase md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={pathname.startsWith(item.to) ? "text-ink" : "text-mute"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            {houseAccount ? (
              <Link to="/atelier-studio" className="text-[0.62rem] tracking-[0.2em] uppercase text-mute">
                Floor
              </Link>
            ) : null}
            <HouseSignedIn>
              {houseAccount ? null : (
                <Link to="/account" aria-label="Saved" className="text-ink">
                  <CircleUser className="h-5 w-5" strokeWidth={1.4} />
                </Link>
              )}
              <button type="button" className="text-[0.62rem] tracking-[0.16em] uppercase text-mute" onClick={() => void houseSignOut()}>
                Sign out
              </button>
            </HouseSignedIn>
            {user ? null : (
              <Link to="/login" aria-label="Account" className="text-ink">
                <CircleUser className="h-5 w-5" strokeWidth={1.4} />
              </Link>
            )}
            <Link to="/bag" aria-label="Cart" className="relative text-ink">
              <ShoppingBag className="h-5 w-5" strokeWidth={1.4} />
              {count ? (
                <span className="absolute -right-2 -top-2 min-w-4 text-center text-[0.6rem]">{count}</span>
              ) : null}
            </Link>
          </div>
        </div>
        <nav className="flex gap-6 overflow-x-auto border-t border-line px-5 py-3 text-[0.65rem] tracking-[0.22em] uppercase md:hidden">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className="shrink-0 text-mute">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="mt-32 border-t border-line">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-3 md:px-10">
          <p className="text-4xl md:text-5xl">BINTI DESIGNS</p>
          <p className="text-sm leading-relaxed text-mute">{house.tagline}</p>
          <div className="text-sm leading-7 text-mute">
            {house.instagram ? (
              <a href={house.instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
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
