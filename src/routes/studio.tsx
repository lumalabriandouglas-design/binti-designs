import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  closeCallback,
  deletePiece,
  getPublicCatalog,
  getStudioData,
  listCallbacks,
  markDrapePublished,
  openStudioForHouse,
  setSoldOut,
  type Piece,
} from "@/lib/server/boutique";
import { clearStudioToken, getStudioToken, setStudioToken } from "@/lib/bag";
import { BananaLoader, MinionPeek } from "@/components/minion";
import { formatMoney } from "@/lib/utils";
import { houseSignOut, useHouseUser } from "@/lib/firebase/session";
import { isHouseAccount } from "@/lib/house";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/studio")({ component: StudioGate });

function StudioGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useHouseUser();
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });
  const [token, setToken] = useState("");
  const house = isHouseAccount(user?.primaryEmail, catalog.data?.settings?.admin_email);

  useEffect(() => {
    setToken(getStudioToken());
  }, []);

  const open = useMutation({
    mutationFn: () => openStudioForHouse(),
    onSuccess: (res) => {
      if (!res.ok) return;
      setStudioToken(res.token);
      setToken(res.token);
    },
  });

  useEffect(() => {
    if (!house || token || open.isPending || open.isSuccess) return;
    open.mutate();
  }, [house, token, open.isPending, open.isSuccess, open]);

  if (isPending || catalog.isLoading) {
    return (
      <StudioFrame>
        <BananaLoader />
      </StudioFrame>
    );
  }

  if (!house) {
    return (
      <SiteShell settings={catalog.data?.settings}>
        <section className="mx-auto max-w-xl px-5 py-24">
          <p className="eyebrow">404</p>
          <h1 className="display mt-3 text-5xl">This page is not here</h1>
          <p className="mt-4 text-sm text-mute">The address does not open a room.</p>
          <Link to="/" className="mt-8 inline-block eyebrow text-ink">
            Return to the house
          </Link>
        </section>
      </SiteShell>
    );
  }

  if (!token) {
    return (
      <StudioFrame>
        <BananaLoader label="Opening her floor" />
      </StudioFrame>
    );
  }

  const onIndex = pathname === "/studio";

  return (
    <StudioFrame>
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link to="/studio" className="display text-2xl text-paper">
            Floor
          </Link>
          <nav className="flex flex-wrap items-center gap-5 text-xs tracking-[0.2em] uppercase text-paper/55">
            <Link to="/studio" className={onIndex ? "text-banana" : ""}>
              Rack
            </Link>
            <Link to="/studio/upload" className={pathname.includes("/upload") ? "text-banana" : ""}>
              Upload
            </Link>
            <Link to="/studio/settings" className={pathname.includes("/settings") ? "text-banana" : ""}>
              House
            </Link>
            <Link to="/" className="text-paper/35">
              Public
            </Link>
            <button
              type="button"
              onClick={() => {
                clearStudioToken();
                setToken("");
                void houseSignOut();
              }}
            >
              Leave
            </button>
          </nav>
        </div>
      </header>
      {onIndex ? <StudioHome token={token} /> : <Outlet />}
      <footer className="group mt-16 border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-end justify-between px-5 py-8">
          <p className="text-xs tracking-[0.2em] uppercase text-paper/35">Private floor</p>
          <MinionPeek />
        </div>
      </footer>
    </StudioFrame>
  );
}

function StudioFrame({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-ink text-paper">{children}</div>;
}

function StudioHome({ token }: { token: string }) {
  const q = useQuery({
    queryKey: ["studio", token],
    queryFn: () => getStudioData({ data: { token } }),
  });
  const calls = useQuery({
    queryKey: ["callbacks", token],
    queryFn: () => listCallbacks({ data: { token } }),
  });
  const del = useMutation({
    mutationFn: (id: number) => deletePiece({ data: { token, id } }),
    onSuccess: () => q.refetch(),
  });
  const drape = useMutation({
    mutationFn: (id: number) => markDrapePublished({ data: { token, id } }),
    onSuccess: () => q.refetch(),
  });
  const sold = useMutation({
    mutationFn: ({ id, sold_out }: { id: number; sold_out: boolean }) =>
      setSoldOut({ data: { token, id, sold_out } }),
    onSuccess: () => q.refetch(),
  });
  const close = useMutation({
    mutationFn: (id: number) => closeCallback({ data: { token, id } }),
    onSuccess: () => calls.refetch(),
  });

  if (q.isLoading) return <BananaLoader label="Pulling the rack" />;

  const pieces = q.data?.pieces ?? [];
  const orders = q.data?.orders ?? [];
  const callbacks = calls.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.28em] uppercase text-banana">Studio</p>
          <h1 className="display mt-2 text-5xl text-paper">The rack</h1>
        </div>
        <Link
          to="/studio/upload"
          className="bg-banana px-5 py-3 text-xs tracking-[0.2em] uppercase text-ink"
        >
          Upload a look
        </Link>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {pieces.map((piece: Piece) => (
          <article key={piece.id} className="border border-white/10 p-4">
            <div className="flex gap-4">
              <img src={piece.cover_url} alt="" className="h-40 w-28 object-contain bg-white/5" />
              <div className="min-w-0 flex-1">
                <p className="text-paper">{piece.title}</p>
                <p className="text-sm text-paper/50">{piece.subtitle}</p>
                <p className="mt-2 text-sm text-paper/55">
                  {piece.sold_out
                    ? "Reserved"
                    : piece.price_cents
                      ? formatMoney(piece.price_cents, piece.currency)
                      : "Inquiry"}{" "}
                  · {piece.status}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs tracking-[0.16em] uppercase">
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
                    onClick={() => sold.mutate({ id: piece.id, sold_out: !piece.sold_out })}
                  >
                    {piece.sold_out ? "Back on rack" : "Mark reserved"}
                  </button>
                  <button
                    type="button"
                    className="border border-white/20 px-3 py-2"
                    onClick={() => drape.mutate(piece.id)}
                  >
                    Send to Drapé
                  </button>
                  <button
                    type="button"
                    className="border border-white/20 px-3 py-2 text-banana"
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
        <p className="text-xs tracking-[0.28em] uppercase text-banana">Call requests</p>
        <ul className="mt-4 divide-y divide-white/10">
          {callbacks.length === 0 ? (
            <li className="py-4 text-sm text-paper/40">No callbacks yet.</li>
          ) : (
            callbacks.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
                <div>
                  <p className="text-paper">{row.name || "Client"} · {row.phone}</p>
                  <p className="text-paper/45">
                    {row.piece_slug || "House"} {row.note ? `— ${row.note}` : ""}
                  </p>
                </div>
                {row.status === "open" ? (
                  <button type="button" className="text-xs uppercase tracking-[0.16em]" onClick={() => close.mutate(row.id)}>
                    Mark done
                  </button>
                ) : (
                  <span className="text-xs uppercase tracking-[0.16em] text-paper/35">Closed</span>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
      <section className="mt-16">
        <p className="text-xs tracking-[0.28em] uppercase text-banana">Bag inquiries</p>
        <ul className="mt-4 divide-y divide-white/10">
          {orders.length === 0 ? (
            <li className="py-4 text-sm text-paper/40">None yet.</li>
          ) : (
            orders.map((order) => (
              <li key={order.id} className="py-4 text-sm text-paper/70">
                {order.guest_name} · {order.guest_phone} · {formatMoney(order.total_cents)}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
