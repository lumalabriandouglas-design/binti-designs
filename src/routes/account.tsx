import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { getPublicCatalog } from "@/lib/server/boutique";
import { formatMoney } from "@/lib/utils";
import { HouseSignedIn, HouseSignedOut, houseSignOut, useHouseUser } from "@/lib/firebase/session";
import { isHouseAccount } from "@/lib/house";
import { useBag } from "@/lib/bag";
import { GoogleMark } from "@/components/brand-marks";

export const Route = createFileRoute("/account")({ component: Account });

function Account() {
  const cat = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });
  const { user } = useHouseUser();
  const items = useBag((s) => s.items);
  const house = isHouseAccount(user?.primaryEmail, cat.data?.settings?.admin_email);

  return (
    <SiteShell settings={cat.data?.settings}>
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold">Client</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="display text-4xl sm:text-6xl">Your floor</h1>
          <HouseSignedIn>
            <button
              type="button"
              className="text-[0.7rem] tracking-[0.2em] uppercase text-mute"
              onClick={() => void houseSignOut()}
            >
              Sign out
            </button>
          </HouseSignedIn>
        </div>

        <HouseSignedOut>
          <p className="mt-8 max-w-md text-sm leading-relaxed text-mute">
            Walk the collection freely. To keep a look in the bag — even offline —
            sign in so it sits with your account.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-3 bg-[#14110e] px-6 py-3 text-[0.7rem] tracking-[0.2em] uppercase text-[#f6f1ea]"
          >
            <GoogleMark className="h-4 w-4" />
            Sign in
          </Link>
        </HouseSignedOut>

        <HouseSignedIn>
          <p className="mt-4 text-sm text-mute">
            {user?.displayName || "Client"}
            {user?.primaryEmail ? ` · ${user.primaryEmail}` : ""}
          </p>
          {house ? (
            <Link to="/atelier-studio" className="mt-4 inline-block text-[11px] uppercase tracking-[0.18em] text-gold">
              Open the house floor
            </Link>
          ) : null}

          <div className="mt-14 grid gap-10 lg:grid-cols-2">
            <section>
              <p className="text-[10px] uppercase tracking-[0.2em] text-mute">Bag</p>
              <h2 className="display mt-2 text-3xl">Kept looks</h2>
              {items.length === 0 ? (
                <p className="mt-6 text-sm text-mute">
                  Empty.{" "}
                  <Link to="/collection" className="text-ink">
                    Walk the collection
                  </Link>
                </p>
              ) : (
                <ul className="mt-6 divide-y divide-line">
                  {items.map((item) => (
                    <li key={item.slug + item.id} className="flex gap-4 py-4">
                      <img src={item.cover_url} alt="" className="h-24 w-16 bg-[#faf7f2] object-contain" />
                      <div>
                        <Link to="/piece/$slug" params={{ slug: item.slug }} className="text-sm">
                          {item.title}
                        </Link>
                        <p className="text-xs text-mute">
                          {item.subtitle} · ×{item.qty} · {formatMoney(item.price_cents * item.qty, item.currency)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/bag" className="mt-6 inline-block text-[11px] uppercase tracking-[0.18em]">
                Open the bag
              </Link>
            </section>
            <section className="border border-line p-6 sm:p-8">
              <p className="text-[10px] uppercase tracking-[0.2em] text-mute">House</p>
              <h2 className="display mt-2 text-3xl">Notes</h2>
              <p className="mt-4 text-sm leading-relaxed text-mute">
                Your bag is saved to this account. Close the tab, go offline, come
                back — the looks stay. Reserve from the bag with WhatsApp or a call.
              </p>
            </section>
          </div>
        </HouseSignedIn>
      </section>
    </SiteShell>
  );
}
