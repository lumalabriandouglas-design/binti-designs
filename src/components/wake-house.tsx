import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { firebaseAuth } from "@/lib/firebase/app";

const LONG_AWAY_MS = 8 * 60 * 1000;

function isStaleAsset(message: string) {
  return /chunk|dynamically imported|loading css chunk|importing a module script failed|failed to fetch dynamically/i.test(
    message,
  );
}

function reloadOnce(key: string) {
  try {
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
  } catch {
    return;
  }
  window.location.reload();
}

export function WakeHouse() {
  const client = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const clear = window.setTimeout(() => {
      try {
        sessionStorage.removeItem("binti-asset-reload");
        sessionStorage.removeItem("binti-error-reload");
        sessionStorage.removeItem("binti-wake-reload");
      } catch {
        /* private mode */
      }
    }, 8000);

    let hiddenAt = document.hidden ? Date.now() : 0;

    const wake = () => {
      const auth = firebaseAuth();
      void auth?.currentUser?.getIdToken(true).catch(() => undefined);
      void client.invalidateQueries();
      void client.refetchQueries({ type: "active" });
    };

    const onVisible = () => {
      const waited = hiddenAt ? Date.now() - hiddenAt : 0;
      hiddenAt = 0;
      wake();
      const onStudio = /atelier-studio|\/studio/.test(window.location.pathname);
      if (waited >= LONG_AWAY_MS && !onStudio) {
        reloadOnce("binti-wake-reload");
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else onVisible();
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) wake();
    };

    const onError = (event: ErrorEvent) => {
      if (isStaleAsset(String(event.message || event.error || ""))) {
        reloadOnce("binti-asset-reload");
      }
    };

    const onReject = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason || "");
      if (isStaleAsset(message)) reloadOnce("binti-asset-reload");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", wake);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);

    return () => {
      window.clearTimeout(clear);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", wake);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
    };
  }, [client]);

  return null;
}
