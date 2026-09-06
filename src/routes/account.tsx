import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { getPublicCatalog } from "@/lib/server/boutique";
import { formatMoney } from "@/lib/utils";
import { HouseSignedIn, HouseSignedOut, useHouseUser } from "@/lib/firebase/session";
import { isHouseAccount } from "@/lib/house";
import { useBag } from "@/lib/bag";
import { dropSavedLook, loadSavedLooks, type SavedLook } from "@/lib/client-closet";
import { GoogleMark } from "@/components/brand-marks";
import { HouseContact, mergeHouse } from "@/components/house-contact";
import { getHouseNotes } from "@/lib/firebase/catalog";

export const Route = createFileRoute("/account")({ component: Account });

function Account() {
  const cat = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });
  const book = useQuery({ queryKey: ["house-notes"], queryFn: getHouseNotes });
  const { user } = useHouseUser();
  const items = useBag((s) => s.items);
  const removeSlug = useBag((s) => s.removeSlug);
  const add = useBag((s) => s.add);
  const house = isHouseAccount(user?.primaryEmail, cat.data?.settings?.admin_email);
  const contact = mergeHouse(cat.data?.settings, book.data);
  const queryClient = useQueryClient();
  const saved = useQuery({
    queryKey: ["closet", user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => loadSavedLooks(user!.id),
  });

  const drop = useMutation({
    mutationFn: (slug: string) => dropSavedLook(user!.id, slug),
    onSuccess: (looks) => queryClient.setQueryData(["closet", user?.id], looks),
  });

  return (
    <SiteShell settings={cat.data?.settings}>
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold">Client</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="display text-4xl sm:text-6xl">Your floor</h1>
        </div>

        <HouseSignedOut>
          <p className="mt-8 max-w-md text-sm leading-relaxed text-mute">
            Walk the collection freely. Sign in to keep looks for later and to hold
            a bag across visits.
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

          <div className="mt-14 space-y-16">
            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-mute">Saved</p>
                  <h2 className="display mt-2 text-3xl sm:text-5xl">For later</h2>
                </div>
                <Link to="/collection" className="text-[11px] uppercase tracking-[0.18em]">
                  Collection
                </Link>
              </div>
              {(saved.data ?? []).length === 0 ? (
                <p className="mt-8 max-w-md text-sm text-mute">
                  Nothing pinned yet. Open a look and tap Save — it waits here.
                </p>
              ) : (
                <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {(saved.data ?? []).map((look) => (
                    <SavedCard
                      key={look.slug}
                      look={look}
                      inBag={items.some((item) => item.slug === look.slug)}
                      onBag={() =>
                        add({
                          id: Math.abs(
                            [...look.slug].reduce((n, ch) => (n * 33 + ch.charCodeAt(0)) | 0, 7),
                          ),
                          slug: look.slug,
                          title: look.title,
                          subtitle: look.subtitle,
                          cover_url: look.cover_url,
                          price_cents: look.price_cents,
                          currency: look.currency,
                        })
                      }
                      onDrop={() => drop.mutate(look.slug)}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-mute">Bag</p>
                  <h2 className="display mt-2 text-3xl sm:text-5xl">Ready to reserve</h2>
                </div>
                {items.length ? (
                  <Link to="/bag" className="text-[11px] uppercase tracking-[0.18em]">
                    Open the bag
                  </Link>
                ) : null}
              </div>
              {items.length === 0 ? (
                <p className="mt-8 text-sm text-mute">The bag is empty.</p>
              ) : (
                <ul className="mt-8 divide-y divide-line">
                  {items.map((item) => (
                    <li key={item.slug + item.id} className="flex items-start gap-4 py-5">
                      <img src={item.cover_url} alt="" className="h-28 w-20 bg-paper-2 object-contain" />
                      <div className="min-w-0 flex-1">
                        <Link to="/piece/$slug" params={{ slug: item.slug }}>
                          {item.title}
                        </Link>
                        <p className="text-sm text-mute">
                          {item.subtitle} · ×{item.qty}
                        </p>
                        <p className="mt-1 text-sm">
                          {formatMoney(item.price_cents * item.qty, item.currency)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-[10px] uppercase tracking-[0.16em] text-mute"
                        onClick={() => removeSlug(item.slug)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="border border-line p-6 sm:p-8">
              <p className="text-[10px] uppercase tracking-[0.2em] text-mute">House</p>
              <h2 className="display mt-2 text-3xl">Reach Natasha</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-mute">
                Saved looks stay with this account. When you are ready, reserve from
                the bag by WhatsApp or a call.
              </p>
              <div className="mt-6">
                <HouseContact house={contact} />
              </div>
            </section>
          </div>
        </HouseSignedIn>
      </section>
    </SiteShell>
  );
}

function SavedCard({
  look,
  inBag,
  onBag,
  onDrop,
}: {
  look: SavedLook;
  inBag: boolean;
  onBag: () => void;
  onDrop: () => void;
}) {
  return (
    <li className="border border-line">
      <Link to="/piece/$slug" params={{ slug: look.slug }} className="block bg-paper-2">
        <img src={look.cover_url} alt={look.title} className="h-72 w-full object-contain" />
      </Link>
      <div className="p-4">
        <Link to="/piece/$slug" params={{ slug: look.slug }} className="text-sm">
          {look.title}
        </Link>
        <p className="mt-1 text-xs text-mute">{look.subtitle}</p>
        <p className="mt-2 text-sm">
          {look.price_cents ? formatMoney(look.price_cents, look.currency) : "Inquiry"}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {inBag ? (
            <span className="text-[10px] uppercase tracking-[0.16em] text-mute">In the bag</span>
          ) : (
            <button
              type="button"
              className="text-[10px] uppercase tracking-[0.16em]"
              onClick={onBag}
            >
              Move to bag
            </button>
          )}
          <button
            type="button"
            className="text-[10px] uppercase tracking-[0.16em] text-mute"
            onClick={onDrop}
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
