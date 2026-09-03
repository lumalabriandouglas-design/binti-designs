import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteShell } from "@/components/site-shell";
import {
  getPieceBySlug,
  getPublicCatalog,
  toggleWishlist,
  type Piece,
} from "@/lib/server/boutique";
import { useBag } from "@/lib/bag";
import { formatMoney } from "@/lib/utils";
import { parseGallery } from "@/lib/media";
import { SignedIn, SignedOut } from "@/lib/auth/gates";

export const Route = createFileRoute("/piece/$slug")({ component: PiecePage });

function PiecePage() {
  const { slug } = Route.useParams();
  const pieceQ = useQuery({
    queryKey: ["piece", slug],
    queryFn: () => getPieceBySlug({ data: { slug } }),
  });
  const cat = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });

  if (pieceQ.isLoading) {
    return (
      <SiteShell settings={cat.data?.settings}>
        <p className="px-5 py-24 text-mute">Preparing the look…</p>
      </SiteShell>
    );
  }
  if (!pieceQ.data) {
    return (
      <SiteShell settings={cat.data?.settings}>
        <div className="px-5 py-24">
          <p>This look has left the rack.</p>
          <Link to="/collection" className="mt-4 inline-block eyebrow text-ink">
            Back to collection
          </Link>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell settings={cat.data?.settings}>
      <PieceView piece={pieceQ.data} />
    </SiteShell>
  );
}

function PieceView({ piece }: { piece: Piece }) {
  const add = useBag((s) => s.add);
  const [note, setNote] = useState("");
  const frames = parseGallery(piece.gallery);
  const slides = (frames.length
    ? frames.map((item) =>
        typeof item === "string"
          ? { thumb: item, display: item, master: item }
          : {
              thumb: item.thumb || item.display || piece.cover_url,
              display: item.display || item.thumb || piece.cover_url,
              master: item.master || item.display || piece.cover_url,
            },
      )
    : [{ thumb: piece.cover_url, display: piece.cover_url, master: piece.cover_url }]
  ).filter((item) => item.display);
  const [active, setActive] = useState(0);
  const current = slides[active] ?? slides[0];
  const save = useMutation({
    mutationFn: () => toggleWishlist({ data: { pieceId: piece.id } }),
    onSuccess: (res) => setNote(res.saved ? "Saved to your account." : "Removed from saved."),
    onError: () => setNote("Sign in to save looks across devices."),
  });

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:grid-cols-2 md:py-16">
      <div className="bg-paper-2">
        {current ? (
          <img
            src={current.display}
            srcSet={`${current.display} 1600w, ${current.master} 3840w`}
            sizes="(min-width: 768px) 50vw, 100vw"
            alt={piece.title}
            className="w-full object-contain"
          />
        ) : null}
        {slides.length > 1 ? (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {slides.map((slide, index) => (
              <button
                key={`${slide.thumb}-${index}`}
                type="button"
                className={index === active ? "ring-1 ring-ink" : "opacity-70"}
                onClick={() => setActive(index)}
              >
                <img src={slide.thumb || slide.display} alt="" className="h-20 w-full object-contain bg-paper" />
              </button>
            ))}
          </div>
        ) : null}
        {piece.video_url ? (
          <video
            className="mt-3 w-full"
            controls
            playsInline
            src={piece.video_url}
            poster={piece.cover_url}
          />
        ) : null}
      </div>
      <div className="md:pt-8">
        <p className="eyebrow">{piece.category}</p>
        <h1 className="display mt-3 text-6xl">{piece.title}</h1>
        {piece.subtitle ? <p className="mt-2 text-lg text-mute">{piece.subtitle}</p> : null}
        <p className="mt-8 max-w-md text-sm leading-relaxed text-ink-soft">{piece.description}</p>
        {piece.caption ? (
          <p className="mt-6 max-w-md font-[family-name:var(--font-display)] text-xl italic text-mute">
            {piece.caption}
          </p>
        ) : null}
        <p className="mt-10 text-lg">
          {piece.price_cents ? formatMoney(piece.price_cents, piece.currency) : "Price on inquiry"}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="bg-ink px-6 py-3 text-[0.7rem] tracking-[0.2em] uppercase text-paper"
            onClick={() => {
              add({
                id: piece.id,
                slug: piece.slug,
                title: piece.title,
                subtitle: piece.subtitle,
                price_cents: piece.price_cents,
                currency: piece.currency,
                cover_url: piece.cover_url,
              });
              setNote("Added to bag.");
            }}
          >
            Add to bag
          </button>
          <SignedIn>
            <button
              type="button"
              className="border border-line px-6 py-3 text-[0.7rem] tracking-[0.2em] uppercase"
              onClick={() => save.mutate()}
            >
              Save
            </button>
          </SignedIn>
          <SignedOut>
            <Link
              to="/login"
              className="border border-line px-6 py-3 text-[0.7rem] tracking-[0.2em] uppercase"
            >
              Save with account
            </Link>
          </SignedOut>
        </div>
        {note ? <p className="mt-4 text-sm text-mute">{note}</p> : null}
        <p className="mt-10 text-xs leading-relaxed text-mute">
          Checkout does not require an account. Flutterwave follows. The bag
          opens an inquiry — and WhatsApp, once she adds her number in the atelier.
        </p>
      </div>
    </section>
  );
}
