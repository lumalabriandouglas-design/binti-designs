import { useEffect, useState } from "react";

const KEY = "binti-drape-opened";

export function HouseCurtain() {
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(KEY) === "1") {
      setGone(true);
      return;
    }
    setGone(false);
    const start = window.setTimeout(() => setOpen(true), 900);
    const end = window.setTimeout(() => {
      sessionStorage.setItem(KEY, "1");
      setGone(true);
    }, 2400);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(end);
    };
  }, []);

  if (gone) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
      <div
        className={`absolute inset-y-0 left-0 w-1/2 bg-ink transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "-translate-x-full" : "translate-x-0"
        }`}
      />
      <div
        className={`absolute inset-y-0 right-0 w-1/2 bg-ink transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-full" : "translate-x-0"
        }`}
      />
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-paper transition-opacity duration-500 ${
          open ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="eyebrow text-paper/70">Binti Designs</p>
        <p className="display mt-5 text-4xl md:text-6xl">The cloth draws back.</p>
        <p className="mt-4 max-w-sm text-sm text-paper/60">Welcome into the house.</p>
      </div>
    </div>
  );
}
