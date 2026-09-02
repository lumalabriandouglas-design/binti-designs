import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { getMyWishlist, getPublicCatalog } from "@/lib/server/boutique";
import { formatMoney } from "@/lib/utils";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";

export const Route = createFileRoute("/account")({ component: Account });

function Account() {
  const cat = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });
  const saved = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => getMyWishlist(),
    retry: false,
  });

  return (
    <SiteShell settings={cat.data?.settings}>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="eyebrow">Client</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="display text-6xl">Saved</h1>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
        <SignedOut>
          <p className="mt-8 max-w-md text-sm text-mute">
            Create an account to keep looks across devices. You can still reserve
            from the bag as a guest.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block bg-ink px-6 py-3 text-[0.7rem] tracking-[0.2em] uppercase text-paper"
          >
            Sign in
          </Link>
        </SignedOut>
        <SignedIn>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
            {(saved.data ?? []).map((piece) => (
              <Link key={piece.id} to="/piece/$slug" params={{ slug: piece.slug }}>
                <img
                  src={piece.cover_url}
                  alt={piece.title}
                  className="w-full object-contain"
                />
                <p className="mt-3 text-sm">{piece.title}</p>
                <p className="text-sm text-mute">
                  {piece.subtitle} · {formatMoney(piece.price_cents, piece.currency)}
                </p>
              </Link>
            ))}
          </div>
          {saved.data && saved.data.length === 0 ? (
            <p className="mt-8 text-sm text-mute">Nothing saved yet.</p>
          ) : null}
        </SignedIn>
      </section>
    </SiteShell>
  );
}
