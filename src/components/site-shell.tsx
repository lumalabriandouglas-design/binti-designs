import { Link, useRouterState } from "@tanstack/react-router";
import { HouseSignedIn, houseSignOut, useHouseUser } from "@/lib/firebase/session";
import { useBag } from "@/lib/bag";
import type { Settings } from "@/lib/server/boutique";

const NAV = [
  { to: "/collection", label: "Collection" },
  { to: "/journal", label: "Journal" },
  { to: "/atelier", label: "Atelier" },
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
  const brand = settings?.brand_name ?? "BINTI DESIGNS";
  const wa = settings?.whatsapp?.replace(/[^\d+]/g, "") ?? "";

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="display text-2xl tracking-tight">
            {brand}
          </Link>
          <nav className="hidden items-center gap-7 text-[0.72rem] tracking-[0.22em] uppercase md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={
                  pathname.startsWith(item.to) ? "text-ink" : "text-mute hover:text-ink"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4 text-[0.72rem] tracking-[0.18em] uppercase">
            <HouseSignedIn>
              <Link to="/account" className="text-mute hover:text-ink">
                Saved
              </Link>
              <button type="button" className="text-mute hover:text-ink" onClick={() => void houseSignOut()}>
                Sign out
              </button>
            </HouseSignedIn>
            <AccountLink />
            <Link to="/bag" className="text-ink">
              Bag{count ? ` ${count}` : ""}
            </Link>
          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto border-t border-line px-5 py-3 text-[0.68rem] tracking-[0.2em] uppercase md:hidden">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className="shrink-0 text-mute">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
          <div>
            <p className="display text-3xl">{brand}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-mute">
              {settings?.tagline ?? "Cut. Drape. Belong."}
            </p>
          </div>
          <div className="text-sm leading-7 text-mute">
            <p className="eyebrow mb-3 text-ink">Visit</p>
            {settings?.instagram ? (
              <a href={settings.instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
            ) : null}
            <br />
            {settings?.drape_url ? (
              <a href={settings.drape_url} target="_blank" rel="noreferrer">
                Drapé Collective showroom
              </a>
            ) : null}
            <br />
            {wa ? (
              <a href={`https://wa.me/${wa.replace(/^\+/, "")}`} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            ) : (
              <span>WhatsApp — added from the atelier</span>
            )}
          </div>
          <div className="text-sm leading-7 text-mute">
            <p className="eyebrow mb-3 text-ink">House</p>
            <Link to="/atelier">The house</Link>
            <br />
            <Link to="/studio">Her studio — upload looks</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AccountLink() {
  const { user } = useHouseUser();
  if (user) return null;
  return (
    <Link to="/login" className="text-mute hover:text-ink">
      Account
    </Link>
  );
}
