import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/september-14")({
  component: BirthdaySeal,
});

const OPEN_AT = new Date("2026-09-14T00:00:00+03:00").getTime();

const NOTES = [
  { day: "2026-09-06", line: "Not yet. Keep the fourteenth free." },
  { day: "2026-09-07", line: "Something is waiting. That is all." },
  { day: "2026-09-08", line: "Do not ask what it is. Asking spoils the cut." },
  { day: "2026-09-09", line: "Five nights. Wear whatever you like." },
  { day: "2026-09-10", line: "Still closed. On purpose." },
  { day: "2026-09-11", line: "Almost. No peeking." },
  { day: "2026-09-12", line: "Two nights." },
  { day: "2026-09-13", line: "Tomorrow. Sleep well." },
  { day: "2026-09-14", line: "Now." },
];

function eatStamp(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

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
  const days = Math.floor(safe / 86_400_000);
  const hours = Math.floor((safe % 86_400_000) / 3_600_000);
  const minutes = Math.floor((safe % 3_600_000) / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1000);
  return { days, hours, minutes, seconds };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function BirthdaySeal() {
  const now = useNow();
  const open = now >= OPEN_AT;
  const remain = parts(OPEN_AT - now);
  const today = eatStamp(new Date(now));
  const shown = useMemo(
    () => NOTES.filter((note) => note.day <= today),
    [today],
  );
  const latest = shown[shown.length - 1];

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#14110e] text-[#f6f1ea]">
      <div className="drape drape-left" aria-hidden />
      <div className="drape drape-right" aria-hidden />
      <main className="relative z-20 mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.34em] text-gold">
          14 September
        </p>
        {open ? (
          <>
            <h1 className="display mt-6 text-5xl sm:text-7xl">Happy birthday.</h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-[#f6f1ea]/70">
              That is all this page will say. The rest is better in a room,
              not on a screen.
            </p>
          </>
        ) : (
          <>
            <h1 className="display mt-6 text-4xl sm:text-6xl">Sealed.</h1>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#f6f1ea]/65">
              Midnight in Kampala. Nothing inside until then.
            </p>
            <div className="mt-12 grid w-full grid-cols-4 gap-2 text-[#f6f1ea]">
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
            {latest ? (
              <p className="mt-12 max-w-sm font-[family-name:var(--font-display)] text-xl italic text-[#f6f1ea]/80">
                {latest.line}
              </p>
            ) : null}
            <p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-[#f6f1ea]/35">
              One line a day. That is all.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
