import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  deletePiece,
  getStudioData,
  markDrapePublished,
  unlockStudio,
  type Piece,
} from "@/lib/server/boutique";
import {
  STUDIO_TOKEN_KEY,
  clearStudioToken,
  getStudioToken,
  setStudioToken,
} from "@/lib/bag";
import { BananaLoader, BananaMark, MinionPeek } from "@/components/minion";
import { formatMoney } from "@/lib/utils";

export const Route = createFileRoute("/studio")({ component: StudioGate });

function StudioGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [token, setToken] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setToken(getStudioToken());
    setReady(true);
  }, []);

  const unlock = useMutation({
    mutationFn: () => unlockStudio({ data: { pin } }),
    onSuccess: (res) => {
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStudioToken(res.token);
      setToken(res.token);
      setError("");
    },
  });

  if (!ready) {
    return (
      <StudioFrame>
        <BananaLoader />
      </StudioFrame>
    );
  }

  if (!token) {
    return (
      <StudioFrame>
        <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
          <BananaMark className="mb-8 h-8 w-8" />
          <p className="text-[0.68rem] tracking-[0.28em] uppercase text-[#d9b83a]">
            Private floor
          </p>
          <h1 className="display mt-3 text-5xl text-paper">Atelier</h1>
          <p className="mt-4 text-sm leading-relaxed text-paper/65">
            This door is hers. The public site stays quiet. Enter the studio pin
            to upload looks, write captions, and send a piece to Drapé.
          </p>
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              unlock.mutate();
            }}
          >
            <label className="block text-[0.68rem] tracking-[0.2em] uppercase text-paper/50">
              Studio pin
              <input
                autoFocus
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="mt-2 w-full border border-white/15 bg-transparent px-3 py-3 text-lg tracking-[0.4em] text-paper outline-none focus:border-[#f0d24b]"
              />
            </label>
            <button
              type="submit"
              className="w-full bg-[#f0d24b] py-3 text-[0.7rem] tracking-[0.22em] uppercase text-[#161412]"
            >
              {unlock.isPending ? "Turning the key…" : "Open"}
            </button>
          </form>
          {error ? <p className="mt-4 text-sm text-[#f0d24b]">{error}</p> : null}
          <p className="mt-10 text-xs leading-relaxed text-paper/40">
            Gift key is <span className="text-[#f0d24b]">2408</span>. Change it
            in Settings after the first visit so only she holds the door.
          </p>
          <Link to="/" className="mt-8 text-xs uppercase tracking-[0.2em] text-paper/40">
            Back to the house
          </Link>
        </div>
      </StudioFrame>
    );
  }

  const onIndex = pathname === "/studio";

  return (
    <StudioFrame>
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link to="/studio" className="display text-2xl text-paper">
            Atelier
          </Link>
          <nav className="flex flex-wrap items-center gap-5 text-[0.68rem] tracking-[0.2em] uppercase text-paper/55">
            <Link to="/studio" className={onIndex ? "text-[#f0d24b]" : ""}>
              Rack
            </Link>
            <Link
              to="/studio/upload"
              className={pathname.includes("/upload") ? "text-[#f0d24b]" : ""}
            >
              Upload
            </Link>
            <Link
              to="/studio/settings"
              className={pathname.includes("/settings") ? "text-[#f0d24b]" : ""}
            >
              House
            </Link>
            <Link to="/" className="text-paper/35">
              Public site
            </Link>
            <button
              type="button"
              onClick={() => {
                clearStudioToken();
                setToken("");
              }}
            >
              Lock
            </button>
          </nav>
        </div>
      </header>
      {onIndex ? <StudioHome token={token} /> : <Outlet />}
      <footer className="group mt-16 border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-end justify-between px-5 py-8">
          <p className="text-xs tracking-[0.2em] uppercase text-paper/35">
            For her eyes only
          </p>
          <MinionPeek />
        </div>
      </footer>
    </StudioFrame>
  );
}

function StudioFrame({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#14120f] text-paper">{children}</div>;
}

function StudioHome({ token }: { token: string }) {
  const q = useQuery({
    queryKey: ["studio", token],
    queryFn: () => getStudioData({ data: { token } }),
  });
  const del = useMutation({
    mutationFn: (id: number) => deletePiece({ data: { token, id } }),
    onSuccess: () => q.refetch(),
  });
  const drape = useMutation({
    mutationFn: (id: number) => markDrapePublished({ data: { token, id } }),
    onSuccess: () => q.refetch(),
  });

  if (q.isLoading) return <BananaLoader label="Pulling the rack" />;
  if (q.error) {
    return (
      <p className="px-5 py-16 text-sm text-[#f0d24b]">
        {q.error.message}. Lock and enter the pin again.
      </p>
    );
  }

  const pieces = q.data?.pieces ?? [];
  const orders = q.data?.orders ?? [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] tracking-[0.28em] uppercase text-[#f0d24b]">
            Studio
          </p>
          <h1 className="display mt-2 text-5xl text-paper">The rack</h1>
        </div>
        <Link
          to="/studio/upload"
          className="bg-[#f0d24b] px-5 py-3 text-[0.7rem] tracking-[0.2em] uppercase text-[#161412]"
        >
          Upload a look
        </Link>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {pieces.map((piece: Piece) => (
          <article key={piece.id} className="border border-white/10 p-4">
            <div className="flex gap-4">
              <img
                src={piece.cover_url}
                alt=""
                className="h-40 w-28 object-contain bg-white/5"
              />
              <div className="min-w-0 flex-1">
                <p className="text-paper">{piece.title}</p>
                <p className="text-sm text-paper/50">{piece.subtitle}</p>
                <p className="mt-2 text-sm text-paper/55">
                  {piece.price_cents
                    ? formatMoney(piece.price_cents, piece.currency)
                    : "Inquiry"}{" "}
                  · {piece.status}
                </p>
                <p className="mt-1 text-xs text-paper/40">
                  Drapé: {piece.drape_status}
                  {piece.publish_to_drape ? " · queued from this house" : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] tracking-[0.16em] uppercase">
                  <Link
                    to="/studio/upload"
                    search={{ edit: String(piece.id) }}
                    className="border border-white/20 px-3 py-2"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="border border-white/20 px-3 py-2"
                    onClick={() => drape.mutate(piece.id)}
                  >
                    Mark on Drapé
                  </button>
                  <button
                    type="button"
                    className="border border-white/20 px-3 py-2 text-[#f0d24b]"
                    onClick={() => del.mutate(piece.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      <section className="mt-16">
        <p className="text-[0.68rem] tracking-[0.28em] uppercase text-[#f0d24b]">
          Inquiries
        </p>
        <ul className="mt-4 divide-y divide-white/10">
          {orders.length === 0 ? (
            <li className="py-4 text-sm text-paper/45">No client notes yet.</li>
          ) : (
            orders.map((o) => (
              <li key={o.id} className="py-4 text-sm text-paper/70">
                #{o.id} · {o.guest_name} · {o.guest_phone} ·{" "}
                {formatMoney(o.total_cents)} · {o.status}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
