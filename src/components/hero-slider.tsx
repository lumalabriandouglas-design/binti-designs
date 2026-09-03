import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
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
    }, 5400);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const current = slides[index];

  return (
    <section className="grid min-h-[80dvh] bg-paper md:grid-cols-2">
      <div className="flex flex-col justify-end border-b border-line px-6 py-16 md:border-b-0 md:border-r md:px-12 md:py-20">
        <p className="eyebrow">East Africa · ready to wear</p>
        <h1 className="display mt-8 text-6xl md:text-8xl">
          Clothes
          <br />
          that keep
          <br />
          their line.
        </h1>
        {current ? (
          <div className="mt-10">
            <p className="text-sm">{current.title}</p>
            <p className="text-sm text-mute">{current.subtitle}</p>
            <p className="mt-2 text-sm text-mute">
              {current.sold_out
                ? "Reserved"
                : current.price_cents
                  ? formatMoney(current.price_cents, current.currency || "UGX")
                  : ""}
            </p>
            <Link
              to="/piece/$slug"
              params={{ slug: current.slug }}
              className="mt-8 inline-block bg-ink px-6 py-3 text-xs tracking-[0.24em] uppercase text-paper"
            >
              Open look
            </Link>
          </div>
        ) : null}
        {slides.length > 1 ? (
          <div className="mt-10 flex gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.slug + i}
                type="button"
                className={`h-px ${i === index ? "w-10 bg-ink" : "w-6 bg-line"}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        ) : null}
      </div>
      <div className="relative min-h-[70dvh] bg-paper">
        {current ? (
          <AnimatePresence mode="wait">
            <motion.img
              key={current.slug + current.cover_url}
              src={current.cover_url}
              alt={`${current.title} ${current.subtitle ?? ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 h-full w-full object-contain"
            />
          </AnimatePresence>
        ) : null}
      </div>
    </section>
  );
}
