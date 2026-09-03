import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/utils";

export type Slide = {
  slug: string;
  title: string;
  subtitle?: string;
  cover_url: string;
  price_cents?: number;
  currency?: string;
  sold_out?: boolean;
};

export function HeroSlider({ pieces }: { pieces: Slide[] }) {
  const slides = pieces.filter((p) => p.cover_url).slice(0, 8);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) {
    return (
      <section className="flex min-h-dvh items-end bg-[#11100e] px-6 pb-16">
        <h1 className="display text-6xl text-[#f6f1ea] md:text-8xl">BINTI DESIGNS</h1>
      </section>
    );
  }

  const current = slides[index] ?? slides[0];

  return (
    <section className="relative min-h-dvh overflow-hidden bg-[#11100e]">
      {slides.map((slide, i) => (
        <img
          key={slide.slug + slide.cover_url}
          src={slide.cover_url}
          alt={`${slide.title} ${slide.subtitle ?? ""}`}
          className={`absolute inset-0 h-full w-full object-contain object-top transition-opacity duration-700 ${
            i === index ? "opacity-100 hero-kenburns" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-[#11100e] via-[#11100e]/35 to-[#11100e]/20" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-7xl flex-col justify-end px-6 pb-16 pt-28 md:px-10">
        <p className="rise-in text-[11px] font-medium uppercase tracking-[0.32em] text-gold">
          Kampala
        </p>
        <h1 className="rise-in display mt-4 max-w-3xl text-5xl text-[#f6f1ea] md:text-7xl">
          {current.title}
        </h1>
        {current.subtitle ? (
          <p className="mt-3 font-[family-name:var(--font-display)] text-2xl italic text-[#f6f1ea]/80">
            {current.subtitle}
          </p>
        ) : null}
        <p className="mt-3 text-sm text-[#f6f1ea]/70">
          {current.sold_out
            ? "Reserved"
            : current.price_cents
              ? formatMoney(current.price_cents, current.currency || "UGX")
              : ""}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/piece/$slug"
            params={{ slug: current.slug }}
            className="bg-[#f6f1ea] px-6 py-3 text-[11px] tracking-[0.22em] uppercase text-[#11100e]"
          >
            The piece
          </Link>
          <Link
            to="/collection"
            className="border border-[#f6f1ea]/50 px-6 py-3 text-[11px] tracking-[0.22em] uppercase text-[#f6f1ea]"
          >
            Collection
          </Link>
        </div>
        {slides.length > 1 ? (
          <div className="mt-10 flex items-center justify-between gap-4 border-t border-[#f6f1ea]/15 pt-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
              Now showing
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous"
                className="grid size-11 place-items-center rounded-full border border-[#f6f1ea]/30 text-[#f6f1ea]"
                onClick={() => setIndex((index - 1 + slides.length) % slides.length)}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Next"
                className="grid size-11 place-items-center rounded-full border border-[#f6f1ea]/30 text-[#f6f1ea]"
                onClick={() => setIndex((index + 1) % slides.length)}
              >
                <ChevronRight size={16} />
              </button>
              <p className="ml-2 text-[10px] uppercase tracking-[0.16em] text-[#f6f1ea]/70">
                {index + 1} / {slides.length}
              </p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-[#f6f1ea]/10">
        <div key={current.slug + index} className="hero-progress h-px bg-gold" />
      </div>
    </section>
  );
}
