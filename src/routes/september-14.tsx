import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BananaMark, MinionPeek } from "@/components/minion";

export const Route = createFileRoute("/september-14")({
  component: UltimateGift,
});

const OPEN_AT = new Date("2026-09-14T00:00:00+03:00").getTime();

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);
  return now;
}

function parts(ms: number) {
  const safe = Math.max(0, ms);
  return {
    days: Math.floor(safe / 86_400_000),
    hours: Math.floor((safe % 86_400_000) / 3_600_000),
    minutes: Math.floor((safe % 3_600_000) / 60_000),
    seconds: Math.floor((safe % 60_000) / 1000),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function UltimateGift() {
  const now = useNow();
  const open = now >= OPEN_AT;
  const remain = parts(OPEN_AT - now);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#14110e] text-[#f6f1ea]">
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
        <MinionPeek />
      </div>
      <main className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
        <BananaMark className="mb-8 h-10 w-10" />
        <p className="text-[10px] font-medium uppercase tracking-[0.34em] text-gold">
          The ultimate gift
        </p>
        {open ? (
          <>
            <h1 className="display mt-6 text-5xl sm:text-7xl">Happy birthday.</h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-[#f6f1ea]/70">
              Ba-na-na. The rest is in the room with you.
            </p>
          </>
        ) : (
          <>
            <h1 className="display mt-6 text-4xl sm:text-6xl">Days to the ultimate gift</h1>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#f6f1ea]/65">
              14 September. Midnight, Kampala. Nothing more until then.
            </p>
            <div className="mt-12 grid w-full grid-cols-4 gap-2">
              {[
                [remain.days, "Days"],
                [remain.hours, "Hours"],
                [remain.minutes, "Min"],
                [remain.seconds, "Sec"],
              ].map(([value, label]) => (
                <div key={String(label)} className="border border-[#f6f1ea]/15 py-5">
                  <p className="display text-3xl sm:text-4xl">{pad(Number(value))}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#f6f1ea]/45">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
