import { Link, useRouterState } from "@tanstack/react-router";
import { HouseSignedIn, houseSignOut, useHouseUser } from "@/lib/firebase/session";
import { isHouseAccount } from "@/lib/house";
import { useBag } from "@/lib/bag";
import type { Settings } from "@/lib/server/boutique";

const NAV = [
  { to: "/collection", label: "Collection" },
  { to: "/journal", label: "Journal" },
  { to: "/atelier", label: "Maison" },
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
  const brand = settings?.brand_name ?? "BINTI DESIGNS";
  const wa = settings?.whatsapp?.replace(/[^\d+]/g, "") ?? "";

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="display text-2xl tracking-tight">
            {brand}
          </Link>
          <nav className="hidden items-center gap-8 text-xs tracking-[0.22em] uppercase md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={pathname.startsWith(item.to) ? "text-ink" : "text-mute hover:text-ink"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4 text-xs tracking-[0.18em] uppercase">
            {house ? (
              <Link to="/atelier-studio" className="text-gold">
                Floor
              </Link>
            ) : null}
            <HouseSignedIn>
              {house ? null : (
                <Link to="/account" className="text-mute hover:text-ink">
                  Saved
                </Link>
              )}
              <button type="button" className="text-mute hover:text-ink" onClick={() => void houseSignOut()}>
                Sign out
              </button>
            </HouseSignedIn>
            {user ? null : (
              <Link to="/login" className="text-mute hover:text-ink">
                Account
              </Link>
            )}
            <Link to="/bag" className="text-ink">
              Bag{count ? ` ${count}` : ""}
            </Link>
          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto border-t border-line px-5 py-3 text-xs tracking-[0.2em] uppercase md:hidden">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className="shrink-0 text-mute">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-3">
          <div>
            <p className="display text-4xl">{brand}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mute">
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
                Drapé Collective
              </a>
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
          <div className="text-sm leading-7 text-mute">
            <p className="eyebrow mb-3 text-ink">House</p>
            <Link to="/atelier">The maison</Link>
            <br />
            <Link to="/collection">Collection</Link>
            <br />
            <Link to="/login">Client account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
