import { useEffect, useState, type ReactNode } from "react";

export function DrapeReveal({
  house = "BINTI DESIGNS",
  children,
}: {
  house?: string;
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("open");
      return;
    }
    const start = window.setTimeout(() => setPhase("opening"), 480);
    const done = window.setTimeout(() => setPhase("open"), 2800);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(done);
    };
  }, [house]);

  const parted = phase !== "closed";

  return (
    <div className="relative">
      {children}
      {phase !== "open" ? (
        <div className="pointer-events-none fixed inset-0 z-[70]">
          <div className={`drape drape-left ${parted ? "drape-open-left" : ""}`} aria-hidden />
          <div className={`drape drape-right ${parted ? "drape-open-right" : ""}`} aria-hidden />
          <div
            className={`absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center transition-opacity duration-700 ${
              parted ? "opacity-0" : "opacity-100"
            }`}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-gold">
              Welcome to
            </p>
            <h1 className="display mt-4 max-w-3xl text-4xl text-[#f6f1ea] md:text-6xl">{house}</h1>
            <p className="mt-3 font-[family-name:var(--font-display)] text-2xl italic text-[#f6f1ea]/80 md:text-3xl">
              showroom
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
