import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import {
  houseGoogle,
  houseSignIn,
  houseSignUp,
  useHouseUser,
} from "@/lib/firebase/session";
import { isHouseAccount } from "@/lib/house";
import { getPublicCatalog } from "@/lib/server/boutique";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const nav = useNavigate();
  const { user, isPending } = useHouseUser();
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isPending || !user) return;
    const house = isHouseAccount(user.primaryEmail, catalog.data?.settings?.admin_email);
    void nav({ to: house ? "/atelier-studio" : "/account" });
  }, [user, isPending, catalog.data?.settings?.admin_email, nav]);

  async function finish() {
    const snapshot = catalog.data ?? (await getPublicCatalog());
    const house = isHouseAccount(
      email || user?.primaryEmail,
      snapshot.settings?.admin_email,
    );
    await nav({ to: house ? "/atelier-studio" : "/account" });
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
      <section className="mx-auto max-w-md px-5 py-20">
        <p className="eyebrow">Clients</p>
        <h1 className="display mt-3 text-5xl">
          {mode === "in" ? "Sign in" : "Open an account"}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-mute">
          Optional. Save looks across devices, or request a call with no account
          at all.
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
            className="w-full border border-line px-4 py-3 text-sm"
          >
            Continue with Google
          </button>
          <div className="hairline my-6" />
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
            <button type="submit" className="w-full bg-ink py-3 text-xs tracking-[0.2em] uppercase text-paper">
              {mode === "in" ? "Sign in" : "Create account"}
            </button>
          </form>
          <button type="button" className="text-sm text-mute" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "Need an account?" : "Already have one?"}
          </button>
          {message ? <p className="text-sm text-mute">{message}</p> : null}
        </div>
      </section>
    </SiteShell>
  );
}
