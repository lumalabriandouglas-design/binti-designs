import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/site-shell";
import {
  houseGoogle,
  houseSignIn,
  houseSignUp,
  useHouseUser,
} from "@/lib/firebase/session";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const nav = useNavigate();
  const { user, isPending } = useHouseUser();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  if (!isPending && user) {
    void nav({ to: "/account" });
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      if (mode === "up") await houseSignUp(email, password, name || "Client");
      else await houseSignIn(email, password);
      await nav({ to: "/account" });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not continue.");
    }
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-md px-5 py-20">
        <p className="eyebrow">Clients</p>
        <h1 className="display mt-3 text-5xl">
          {mode === "in" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-mute">
          Optional. Use it to save looks across devices. The bag and inquiry
          work without one.
        </p>
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={async () => {
              setMessage("");
              try {
                await houseGoogle();
                await nav({ to: "/account" });
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
            <button
              type="submit"
              className="w-full bg-ink py-3 text-[0.7rem] tracking-[0.2em] uppercase text-paper"
            >
              {mode === "in" ? "Sign in" : "Create account"}
            </button>
          </form>
          <button
            type="button"
            className="text-sm text-mute"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
          >
            {mode === "in" ? "Need an account?" : "Already have one?"}
          </button>
          {message ? <p className="text-sm text-mute">{message}</p> : null}
        </div>
        <p className="mt-10 text-xs text-mute">
          House staff use the{" "}
          <Link to="/studio" className="text-ink">
            atelier door
          </Link>
          , not this page.
        </p>
      </section>
    </SiteShell>
  );
}
