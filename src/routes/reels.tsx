import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { getPublicCatalog } from "@/lib/server/boutique";
import { listFilms, listPublicReels, type HouseFilm, type Look } from "@/lib/firebase/catalog";
import { formatMoney } from "@/lib/utils";
import { useBag } from "@/lib/bag";
import { HouseSignedIn, HouseSignedOut } from "@/lib/firebase/session";
import { rememberNext, stashPendingLook } from "@/lib/client-closet";

export const Route = createFileRoute("/reels")({
  loader: () => getPublicCatalog(),
  component: ReelsPage,
});

type ReelItem = {
  key: string;
  title: string;
  subtitle: string;
  caption?: string;
  video_url: string;
  cover_url: string;
  slug?: string;
  sold_out?: boolean;
  price_cents?: number;
  currency?: string;
  category?: string;
};

function asLookReel(look: Look): ReelItem {
  return {
    key: `look-${look.id}`,
    title: look.title,
    subtitle: look.subtitle,
    caption: look.caption,
    video_url: look.video_url,
    cover_url: look.cover_url,
    slug: look.slug,
    sold_out: look.sold_out,
    price_cents: look.price_cents,
    currency: look.currency,
    category: look.category,
  };
}

function asFilmReel(film: HouseFilm): ReelItem {
  return {
    key: `film-${film.id}`,
    title: film.title,
    subtitle: film.caption,
    caption: film.caption,
    video_url: film.video_url,
    cover_url: film.cover_url,
    slug: film.pieceSlug || undefined,
  };
}

function ReelsPage() {
  const data = Route.useLoaderData();
  const lookReels = useQuery({ queryKey: ["looks-reels"], queryFn: listPublicReels });
  const films = useQuery({ queryKey: ["films"], queryFn: listFilms });
  const feed: ReelItem[] = [
    ...(films.data ?? []).map(asFilmReel),
    ...(lookReels.data ?? []).map(asLookReel),
  ].filter((item) => item.video_url);

  return (
    <SiteShell settings={data.settings}>
      <section className="bg-[#11100e] text-[#f6f1ea]">
        <div className="mx-auto max-w-md px-0 pt-20 sm:max-w-lg">
          <div className="px-5 pb-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-gold">Film</p>
            <h1 className="display mt-2 text-4xl sm:text-5xl">Reels</h1>
            <p className="mt-2 text-sm text-[#f6f1ea]/60">
              Looks in motion, and film she hangs on its own.
            </p>
          </div>
          {feed.length === 0 ? (
            <p className="px-5 py-16 text-sm text-[#f6f1ea]/50">
              No film on the floor yet.
            </p>
          ) : (
            <div className="h-[calc(100dvh-8.5rem)] snap-y snap-mandatory overflow-y-auto">
              {feed.map((item) => (
                <ReelCard key={item.key} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function bagFromReel(item: ReelItem) {
  return {
    id: Math.abs([...String(item.slug || item.key)].reduce((n, ch) => (n * 33 + ch.charCodeAt(0)) | 0, 7)),
    slug: item.slug || item.key,
    title: item.title,
    subtitle: item.subtitle,
    cover_url: item.cover_url,
    price_cents: item.price_cents || 0,
    currency: item.currency || "UGX",
  };
}

function ReelCard({ item }: { item: ReelItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const add = useBag((s) => s.add);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          void node.play().catch(() => undefined);
        } else {
          node.pause();
        }
      },
      { threshold: [0.6] },
    );
    watch.observe(node);
    return () => watch.disconnect();
  }, [item.video_url]);

  return (
    <article className="relative flex h-full min-h-[34rem] snap-start flex-col justify-end">
      <video
        ref={videoRef}
        src={item.video_url}
        poster={item.cover_url}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-contain bg-[#11100e]"
        onClick={() => setMuted((on) => !on)}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#11100e] via-transparent to-[#11100e]/20" />
      <div className="relative z-10 space-y-3 px-5 pb-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
          {item.sold_out ? "Reserved" : item.slug ? item.category || "Look" : "Film"}
        </p>
        <h2 className="display text-3xl">{item.title}</h2>
        {item.subtitle ? <p className="text-[#f6f1ea]/70">{item.subtitle}</p> : null}
        {item.slug && item.price_cents ? (
          <p className="text-sm text-[#f6f1ea]/70">
            {item.sold_out ? "This look has left the rack." : formatMoney(item.price_cents, item.currency)}
          </p>
        ) : null}
        <div className="pointer-events-auto flex flex-wrap gap-2 pt-1">
          {item.slug ? (
            <Link
              to="/piece/$slug"
              params={{ slug: item.slug }}
              className="bg-[#f6f1ea] px-4 py-3 text-[11px] tracking-[0.18em] uppercase text-[#11100e]"
            >
              The stills
            </Link>
          ) : null}
          {item.slug && !item.sold_out ? (
            <>
              <HouseSignedIn>
                <button
                  type="button"
                  className="border border-[#f6f1ea]/40 px-4 py-3 text-[11px] tracking-[0.18em] uppercase"
                  onClick={() => add(bagFromReel(item))}
                >
                  Add to bag
                </button>
              </HouseSignedIn>
              <HouseSignedOut>
                <Link
                  to="/login"
                  className="border border-[#f6f1ea]/40 px-4 py-3 text-[11px] tracking-[0.18em] uppercase"
                  onClick={() => {
                    stashPendingLook(bagFromReel(item));
                    rememberNext("/reels");
                  }}
                >
                  Sign in to bag
                </Link>
              </HouseSignedOut>
            </>
          ) : null}
          <button
            type="button"
            className="border border-[#f6f1ea]/40 px-4 py-3 text-[11px] tracking-[0.18em] uppercase"
            onClick={() => setMuted((on) => !on)}
          >
            {muted ? "Sound" : "Mute"}
          </button>
        </div>
      </div>
    </article>
  );
}

