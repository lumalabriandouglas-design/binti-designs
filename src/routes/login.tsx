import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SiteShell } from "@/components/site-shell";
import {
  houseGoogle,
  houseSignIn,
  houseSignUp,
  useHouseUser,
} from "@/lib/firebase/session";
import { GoogleMark } from "@/components/brand-marks";
import { isHouseAccount } from "@/lib/house";
import { getPublicCatalog } from "@/lib/server/boutique";
import { listLooks } from "@/lib/firebase/catalog";
import { takeNext } from "@/lib/client-closet";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const nav = useNavigate();
  const { user, isPending } = useHouseUser();
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });
  const looks = useQuery({ queryKey: ["looks"], queryFn: listLooks });
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const pieces =
    looks.data && looks.data.length
      ? looks.data
      : (catalog.data?.pieces ?? []).map((p) => ({
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle,
          cover_url: p.cover_url,
        }));

  useEffect(() => {
    if (isPending || !user) return;
    const house = isHouseAccount(user.primaryEmail, catalog.data?.settings?.admin_email);
    void nav({ to: house ? "/atelier-studio" : takeNext() });
  }, [user, isPending, catalog.data?.settings?.admin_email, nav]);

  async function finish() {
    const snapshot = catalog.data ?? (await getPublicCatalog());
    const house = isHouseAccount(email || user?.primaryEmail, snapshot.settings?.admin_email);
    await nav({ to: house ? "/atelier-studio" : takeNext() });
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      if (mode === "up") await houseSignUp(email, password, name || "Client");
      else await houseSignIn(email, password);
      await finish();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not continue.");
    }
  }

  return (
    <SiteShell settings={catalog.data?.settings}>
      <section className="grid min-h-[78dvh] bg-paper lg:grid-cols-[1.1fr_0.9fr]">
        <LookColumn pieces={pieces} />
        <div className="flex items-center border-t border-line px-6 py-14 lg:border-t-0 lg:border-l lg:px-14">
          <div className="w-full max-w-md">
            <p className="eyebrow">The house</p>
            <h1 className="display mt-4 text-5xl md:text-6xl">
              {mode === "in" ? "Welcome back." : "Join the house."}
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-mute">
              Walk the collection without an account. Sign in when you add a look
              to the bag so it stays with you offline.
            </p>
            <div className="mt-10 space-y-3">
              <button
                type="button"
                onClick={async () => {
                  setMessage("");
                  try {
                    await houseGoogle();
                    await finish();
                  } catch (err) {
                    setMessage(err instanceof Error ? err.message : "Google sign-in failed.");
                  }
                }}
                className="flex w-full items-center justify-center gap-3 border border-ink px-4 py-3 text-xs tracking-[0.2em] uppercase"
              >
                <GoogleMark className="h-4 w-4" />
                Continue with Google
              </button>
              <div className="flex items-center gap-4 py-2">
                <span className="h-px flex-1 bg-line" />
                <span className="text-[0.62rem] tracking-[0.2em] uppercase text-mute">or email</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <form className="space-y-3" onSubmit={onEmail}>
                {mode === "up" ? (
                  <input
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-line bg-paper px-3 py-3 text-sm outline-none"
                  />
                ) : null}
                <input
                  required
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-line bg-paper px-3 py-3 text-sm outline-none"
                />
                <input
                  required
                  type="password"
                  minLength={8}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-line bg-paper px-3 py-3 text-sm outline-none"
                />
                <button
                  type="submit"
                  className="w-full bg-ink py-3 text-xs tracking-[0.22em] uppercase text-paper"
                >
                  {mode === "in" ? "Sign in" : "Create account"}
                </button>
              </form>
              <button
                type="button"
                className="text-xs tracking-[0.16em] uppercase text-mute"
                onClick={() => setMode(mode === "in" ? "up" : "in")}
              >
                {mode === "in" ? "Need an account" : "Already have one"}
              </button>
              {message ? <p className="text-sm text-mute">{message}</p> : null}
              <Link to="/collection" className="mt-8 block text-xs tracking-[0.2em] uppercase text-mute">
                Browse without an account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function LookColumn({
  pieces,
}: {
  pieces: { slug: string; title: string; subtitle?: string; cover_url: string }[];
}) {
  const slides = pieces.filter((p) => p.cover_url).slice(0, 6);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const current = slides[index];
  const side = slides[(index + 1) % slides.length];

  return (
    <div className="relative grid min-h-[52dvh] grid-cols-2 bg-paper-2 lg:min-h-full">
      <div className="relative overflow-hidden">
        {current ? (
          <AnimatePresence mode="wait">
            <motion.img
              key={current.cover_url + current.slug}
              src={current.cover_url}
              alt={current.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0 h-full w-full object-contain"
            />
          </AnimatePresence>
        ) : null}
      </div>
      <div className="relative hidden overflow-hidden border-l border-line sm:block">
        {side ? (
          <img src={side.cover_url} alt={side.title} className="absolute inset-0 h-full w-full object-contain" />
        ) : null}
      </div>
      {current ? (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-paper via-paper/80 to-transparent px-5 py-6">
          <p className="display text-3xl">{current.title}</p>
          <p className="text-sm text-mute">{current.subtitle}</p>
        </div>
      ) : null}
    </div>
  );
}
