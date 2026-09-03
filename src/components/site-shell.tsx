import { Link, useRouterState } from "@tanstack/react-router";
import { HouseSignedIn, houseSignOut, useHouseUser } from "@/lib/firebase/session";
import { isHouseAccount } from "@/lib/house";
import { useBag } from "@/lib/bag";
import type { Settings } from "@/lib/server/boutique";

const NAV = [
  { to: "/collection", label: "Looks" },
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
      <header className="border-b border-line">
        <div className="flex items-center justify-between px-5 py-3 text-[0.62rem] tracking-[0.28em] uppercase text-mute">
          <span>Kampala</span>
          <span>Atelier</span>
          <div className="flex items-center gap-4">
            {house ? (
              <Link to="/atelier-studio" className="text-ink">
                Floor
              </Link>
            ) : null}
            <HouseSignedIn>
              {house ? null : (
                <Link to="/account" className="text-ink">
                  Saved
                </Link>
              )}
              <button type="button" onClick={() => void houseSignOut()}>
                Sign out
              </button>
            </HouseSignedIn>
            {user ? null : (
              <Link to="/login" className="text-ink">
                Account
              </Link>
            )}
            <Link to="/bag" className="text-ink">
              Bag{count ? ` ${count}` : ""}
            </Link>
          </div>
        </div>
        <div className="px-5 py-8 text-center">
          <Link to="/" className="display text-5xl md:text-7xl">
            BINTI DESIGNS
          </Link>
          <nav className="mt-6 flex justify-center gap-8 text-[0.68rem] tracking-[0.28em] uppercase">
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
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-line">
        <div className="grid gap-8 px-5 py-14 md:grid-cols-3">
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
