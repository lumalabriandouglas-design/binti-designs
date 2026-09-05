import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { CallbackForm } from "@/components/callback-form";
import { listPublicLooks, getHouseNotes } from "@/lib/firebase/catalog";
import { HouseContact, mergeHouse } from "@/components/house-contact";
import { HouseSignedIn, HouseSignedOut, useHouseUser } from "@/lib/firebase/session";
import { rememberNext, stashPendingLook } from "@/lib/client-closet";

export const Route = createFileRoute("/piece/$slug")({ component: PiecePage });

function PiecePage() {
  const { slug } = Route.useParams();
  const pieceQ = useQuery({
    queryKey: ["piece", slug],
    queryFn: () => getPieceBySlug({ data: { slug } }),
  });
  const cat = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });

  const looks = useQuery({ queryKey: ["looks-public"], queryFn: listPublicLooks });
  const firestorePiece = looks.data?.find((row) => row.slug === slug);
  const piece = firestorePiece
    ? {
        id: 0,
        slug: firestorePiece.slug,
        title: firestorePiece.title,
        subtitle: firestorePiece.subtitle,
        description: firestorePiece.description,
        price_cents: firestorePiece.price_cents,
        currency: firestorePiece.currency,
        category: firestorePiece.category,
        cover_url: firestorePiece.cover_url,
        gallery: JSON.stringify(firestorePiece.gallery.map((url) => ({ thumb: url, display: url, master: url }))),
        video_url: firestorePiece.video_url,
        caption: firestorePiece.caption,
        status: "published",
        publish_to_drape: false,
        drape_status: "idle",
        sold_out: firestorePiece.sold_out,
        created_at: firestorePiece.created_at,
      }
    : pieceQ.data;

  if (pieceQ.isLoading && looks.isLoading) {
    return (
      <SiteShell settings={cat.data?.settings}>
        <p className="px-5 py-24 text-mute">Preparing the look…</p>
      </SiteShell>
    );
  }
  if (!piece) {
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
      <PieceView piece={piece} />
    </SiteShell>
  );
}

function PieceView({ piece }: { piece: Piece }) {
  const add = useBag((s) => s.add);
  const nav = useNavigate();
  const { user } = useHouseUser();
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
    <section className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:gap-10 sm:py-12 md:grid-cols-2 md:py-16">
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
        <h1 className="display mt-3 text-4xl sm:text-5xl md:text-6xl">{piece.title}</h1>
        {piece.subtitle ? <p className="mt-2 text-lg text-mute">{piece.subtitle}</p> : null}
        <p className="mt-8 max-w-md text-sm leading-relaxed text-ink-soft">{piece.description}</p>
        {piece.caption ? (
          <p className="mt-6 max-w-md font-[family-name:var(--font-display)] text-xl italic text-mute">
            {piece.caption}
          </p>
        ) : null}
        <p className="mt-10 text-lg">
          {piece.sold_out
            ? "This look is reserved."
            : piece.price_cents
              ? formatMoney(piece.price_cents, piece.currency)
              : "Price on inquiry"}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {piece.sold_out ? null : (
          <button
            type="button"
            className="bg-ink px-6 py-3 text-xs tracking-[0.2em] uppercase text-paper"
            onClick={() => {
              const look = {
                id: piece.id || Date.now(),
                slug: piece.slug,
                title: piece.title,
                subtitle: piece.subtitle,
                price_cents: piece.price_cents,
                currency: piece.currency,
                cover_url: piece.cover_url,
              };
              if (!user) {
                stashPendingLook(look);
                rememberNext("/bag");
                setNote("Sign in to keep this look in your bag.");
                void nav({ to: "/login" });
                return;
              }
              add(look);
              setNote("Added to bag. It stays with your account.");
            }}
          >
            Add to bag
          </button>
          )}
          <HouseSignedIn>
            <button
              type="button"
              className="border border-line px-6 py-3 text-[0.7rem] tracking-[0.2em] uppercase"
              onClick={() => save.mutate()}
            >
              Save
            </button>
          </HouseSignedIn>
          <HouseSignedOut>
            <Link
              to="/login"
              className="border border-line px-6 py-3 text-[0.7rem] tracking-[0.2em] uppercase"
            >
              Save with account
            </Link>
          </HouseSignedOut>
        </div>
        {note ? <p className="mt-4 text-sm text-mute">{note}</p> : null}
        <PieceContact />
        <div className="mt-14 border-t border-line pt-10">
          <CallbackForm pieceSlug={piece.slug} />
        </div>
      </div>
    </section>
  );
}

function PieceContact() {
  const notes = useQuery({ queryKey: ["house-notes"], queryFn: getHouseNotes });
  const cat = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });
  return (
    <div className="mt-10">
      <HouseContact house={mergeHouse(cat.data?.settings, notes.data)} />
    </div>
  );
}
