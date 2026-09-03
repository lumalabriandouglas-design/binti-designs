import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Piece } from "@/lib/server/boutique";
import { formatMoney } from "@/lib/utils";

export function HeroSlider({ pieces }: { pieces: Piece[] }) {
  const slides = pieces.slice(0, 6);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5600);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) {
    return (
      <section className="flex min-h-[80dvh] items-end bg-paper-2 px-6 py-16">
        <div>
          <p className="eyebrow">Maison</p>
          <h1 className="display mt-4 text-6xl md:text-8xl">BINTI DESIGNS</h1>
        </div>
      </section>
    );
  }

  const current = slides[index] ?? slides[0];

  return (
    <section className="relative min-h-[88dvh] overflow-hidden bg-ink text-paper">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={slide.cover_url}
            alt={`${slide.title} ${slide.subtitle}`}
            className="h-full w-full object-contain bg-ink"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/20" />
      <div className="relative z-10 mx-auto flex min-h-[88dvh] max-w-6xl flex-col justify-end px-5 py-12 md:py-16">
        <p className="eyebrow text-gold">The house</p>
        <h1 className="display mt-4 max-w-3xl text-6xl text-paper md:text-8xl">
          {current.title}
        </h1>
        <p className="mt-3 text-lg text-gold">{current.subtitle}</p>
        {current.sold_out ? (
          <p className="mt-4 text-xs tracking-[0.22em] uppercase text-gold">Reserved</p>
        ) : current.price_cents ? (
          <p className="mt-4 text-sm text-paper/80">
            {formatMoney(current.price_cents, current.currency)}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/piece/$slug"
            params={{ slug: current.slug }}
            className="bg-paper px-6 py-3 text-xs tracking-[0.22em] uppercase text-ink"
          >
            View look
          </Link>
          <Link
            to="/collection"
            className="border border-paper/30 px-6 py-3 text-xs tracking-[0.22em] uppercase text-paper"
          >
            Collection
          </Link>
        </div>
        {slides.length > 1 ? (
          <div className="mt-10 flex gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Look ${i + 1}`}
                className={`h-px w-10 ${i === index ? "bg-gold" : "bg-paper/30"}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
