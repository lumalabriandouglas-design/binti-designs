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
    }, 6200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) {
    return (
      <section className="flex min-h-[92dvh] items-end bg-ink px-6 py-20 text-paper">
        <div>
          <p className="eyebrow">Maison</p>
          <h1 className="display mt-6 text-7xl md:text-9xl">BINTI<br />DESIGNS</h1>
        </div>
      </section>
    );
  }

  const current = slides[index] ?? slides[0];

  return (
    <section className="relative min-h-[92dvh] overflow-hidden bg-ink text-paper">
      <AnimatePresence mode="sync">
        <motion.img
          key={current.slug + current.cover_url}
          src={current.cover_url}
          alt={`${current.title} ${current.subtitle ?? ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-contain bg-ink"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/30" />
      <div className="relative z-10 mx-auto flex min-h-[92dvh] max-w-6xl flex-col justify-end px-5 py-16">
        <motion.div
          key={current.slug}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="eyebrow">Binti Designs</p>
          <h1 className="display mt-5 max-w-4xl text-6xl text-paper md:text-8xl">
            {current.title}
          </h1>
          {current.subtitle ? <p className="mt-4 text-lg text-gold">{current.subtitle}</p> : null}
          <p className="mt-4 text-sm text-paper/70">
            {current.sold_out
              ? "Reserved"
              : current.price_cents
                ? formatMoney(current.price_cents, current.currency || "KES")
                : ""}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/piece/$slug"
              params={{ slug: current.slug }}
              className="bg-paper px-7 py-3 text-xs tracking-[0.24em] uppercase text-ink"
            >
              The look
            </Link>
            <Link
              to="/collection"
              className="border border-gold/50 px-7 py-3 text-xs tracking-[0.24em] uppercase text-paper"
            >
              Collection
            </Link>
          </div>
        </motion.div>
        {slides.length > 1 ? (
          <div className="mt-12 flex gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.slug + i}
                type="button"
                aria-label={`Look ${i + 1}`}
                className={`h-px ${i === index ? "w-12 bg-gold" : "w-8 bg-paper/30"}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
