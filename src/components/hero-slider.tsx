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
    }, 5600);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) {
    return (
      <section className="flex min-h-[86dvh] items-end bg-paper px-6 py-16">
        <h1 className="display text-7xl md:text-8xl">BINTI DESIGNS</h1>
      </section>
    );
  }

  const current = slides[index] ?? slides[0];

  return (
    <section className="relative min-h-[86dvh] overflow-hidden bg-paper">
      <AnimatePresence mode="sync">
        <motion.div
          key={current.slug + current.cover_url}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center bg-paper"
        >
          <img
            src={current.cover_url}
            alt={`${current.title} ${current.subtitle ?? ""}`}
            className="h-full w-full object-contain"
          />
        </motion.div>
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-paper to-transparent" />
      <div className="relative z-10 mx-auto flex min-h-[86dvh] max-w-6xl flex-col justify-end px-5 py-10">
        <p className="display text-4xl md:text-6xl">{current.title}</p>
        {current.subtitle ? <p className="mt-2 text-mute">{current.subtitle}</p> : null}
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
          className="mt-6 inline-block w-fit border border-ink px-5 py-2 text-[0.65rem] tracking-[0.22em] uppercase"
        >
          View
        </Link>
        {slides.length > 1 ? (
          <div className="mt-8 flex gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.slug + i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                className={`h-px ${i === index ? "w-10 bg-ink" : "w-6 bg-line"}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
