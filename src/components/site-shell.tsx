import { Link, useRouterState } from "@tanstack/react-router";
import { CircleUser, ShoppingBag } from "lucide-react";
import { HouseSignedIn, houseSignOut, useHouseUser } from "@/lib/firebase/session";
import { isHouseAccount } from "@/lib/house";
import { useBag } from "@/lib/bag";
import type { Settings } from "@/lib/server/boutique";

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
  const house = isHouseAccount(user?.primaryEmail, settings?.admin_email);
  const wa = settings?.whatsapp?.replace(/[^\d+]/g, "") ?? "";

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
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
            {house ? (
              <Link to="/atelier-studio" className="text-[0.62rem] tracking-[0.2em] uppercase text-mute">
                Floor
              </Link>
            ) : null}
            <HouseSignedIn>
              {house ? null : (
                <Link to="/account" aria-label="Saved looks" className="text-ink">
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
      <footer className="mt-24 border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3">
          <p className="display text-4xl">BINTI DESIGNS</p>
          <p className="text-sm leading-relaxed text-mute">
            {settings?.tagline ?? "Cut. Drape. Belong."}
          </p>
          <div className="text-sm leading-7 text-mute">
            {settings?.instagram ? (
              <a href={settings.instagram} target="_blank" rel="noreferrer">
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
            {wa ? (
              <>
                <br />
                <a href={`https://wa.me/${wa.replace(/^\+/, "")}`} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
