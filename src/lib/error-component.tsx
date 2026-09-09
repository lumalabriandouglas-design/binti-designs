import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const message = error.message || "";
    const stale =
      /chunk|dynamically imported|failed to fetch|network|load/i.test(message);
    if (!stale) return;
    try {
      if (sessionStorage.getItem("binti-error-reload") === "1") return;
      sessionStorage.setItem("binti-error-reload", "1");
    } catch {
      return;
    }
    const timer = window.setTimeout(() => window.location.reload(), 500);
    return () => window.clearTimeout(timer);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-paper px-6 text-center text-ink">
      <p className="text-[11px] uppercase tracking-[0.28em] text-mute">The floor paused</p>
      <h1 className="display text-4xl">Give it a moment.</h1>
      <p className="max-w-md text-sm leading-relaxed text-mute">
        The house is opening the rack again. If it stays still, refresh.
      </p>
      <button
        type="button"
        className="border border-ink px-6 py-3 text-[11px] uppercase tracking-[0.2em]"
        onClick={() => window.location.reload()}
      >
        Refresh
      </button>
    </main>
  );
}
