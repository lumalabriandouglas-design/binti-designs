import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { getPublicCatalog } from "@/lib/server/boutique";
import { listPublicReels, type Look } from "@/lib/firebase/catalog";
import { formatMoney } from "@/lib/utils";
import { useBag } from "@/lib/bag";
import { HouseSignedIn, HouseSignedOut } from "@/lib/firebase/session";
import { rememberNext, stashPendingLook } from "@/lib/client-closet";

export const Route = createFileRoute("/reels")({
  loader: () => getPublicCatalog(),
  component: ReelsPage,
});

function bagLook(look: Look) {
  return {
    id: Math.abs(
      [...look.slug].reduce((n, ch) => (n * 33 + ch.charCodeAt(0)) | 0, 7),
    ),
    slug: look.slug,
    title: look.title,
    subtitle: look.subtitle,
    cover_url: look.cover_url,
    price_cents: look.price_cents,
    currency: look.currency,
  };
}

function ReelsPage() {
  const data = Route.useLoaderData();
  const reels = useQuery({ queryKey: ["looks-reels"], queryFn: listPublicReels });
  const looks = reels.data ?? [];

  return (
    <SiteShell settings={data.settings}>
      <section className="bg-[#11100e] text-[#f6f1ea]">
        <div className="mx-auto max-w-md px-0 pt-20 sm:max-w-lg">
          <div className="px-5 pb-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-gold">Film</p>
            <h1 className="display mt-2 text-4xl sm:text-5xl">Reels</h1>
            <p className="mt-2 text-sm text-[#f6f1ea]/60">
              The look moving. Open the stills or take it from here.
            </p>
          </div>
          {looks.length === 0 ? (
            <p className="px-5 py-16 text-sm text-[#f6f1ea]/50">
              No film on the floor yet. When Natasha hangs a look with a reel, it plays here.
            </p>
          ) : (
            <div className="h-[calc(100dvh-8.5rem)] snap-y snap-mandatory overflow-y-auto">
              {looks.map((look) => (
                <ReelCard key={look.id} look={look} />
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function ReelCard({ look }: { look: Look }) {
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
  }, [look.video_url]);

  return (
    <article className="relative flex h-full min-h-[34rem] snap-start flex-col justify-end">
      <video
        ref={videoRef}
        src={look.video_url}
        poster={look.cover_url}
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
          {look.sold_out ? "Reserved" : look.category || "Look"}
        </p>
        <h2 className="display text-3xl">{look.title}</h2>
        {look.subtitle ? <p className="text-[#f6f1ea]/70">{look.subtitle}</p> : null}
        <p className="text-sm text-[#f6f1ea]/70">
          {look.sold_out
            ? "This look has left the rack."
            : look.price_cents
              ? formatMoney(look.price_cents, look.currency)
              : "Inquiry"}
        </p>
        <div className="pointer-events-auto flex flex-wrap gap-2 pt-1">
          <Link
            to="/piece/$slug"
            params={{ slug: look.slug }}
            className="bg-[#f6f1ea] px-4 py-3 text-[11px] tracking-[0.18em] uppercase text-[#11100e]"
          >
            The stills
          </Link>
          {look.sold_out ? null : (
            <>
              <HouseSignedIn>
                <button
                  type="button"
                  className="border border-[#f6f1ea]/40 px-4 py-3 text-[11px] tracking-[0.18em] uppercase"
                  onClick={() => add(bagLook(look))}
                >
                  Add to bag
                </button>
              </HouseSignedIn>
              <HouseSignedOut>
                <Link
                  to="/login"
                  className="border border-[#f6f1ea]/40 px-4 py-3 text-[11px] tracking-[0.18em] uppercase"
                  onClick={() => {
                    stashPendingLook(bagLook(look));
                    rememberNext("/reels");
                  }}
                >
                  Sign in to bag
                </Link>
              </HouseSignedOut>
            </>
          )}
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
