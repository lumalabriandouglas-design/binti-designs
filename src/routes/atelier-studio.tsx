import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  listInquiries,
  listLooks,
  removeLook,
  saveLook,
  setLookSoldOut,
  type Look,
} from "@/lib/firebase/catalog";
import { HOUSE_EMAIL } from "@/lib/firebase/firebase";
import { houseGoogleStrict, houseSignOut, useHouseUser } from "@/lib/firebase/session";
import { isHouseAccount } from "@/lib/house";
import { compressImageFile } from "@/lib/media";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/atelier-studio")({ component: AtelierStudio });

function AtelierStudio() {
  const { user, isPending } = useHouseUser();
  const [denied, setDenied] = useState("");

  if (isPending) {
    return <QuietFrame>Opening…</QuietFrame>;
  }

  if (user && !isHouseAccount(user.primaryEmail)) {
    void houseSignOut();
    return (
      <QuietFrame>
        Access denied.
        <Link to="/" className="mt-6 block text-gold">
          Return
        </Link>
      </QuietFrame>
    );
  }

  if (!user) {
    return (
      <QuietFrame>
        <p className="eyebrow">Private</p>
        <h1 className="display mt-4 text-5xl text-paper">Continue</h1>
        <button
          type="button"
          className="mt-10 border border-gold px-6 py-3 text-xs tracking-[0.24em] uppercase text-gold"
          onClick={async () => {
            setDenied("");
            try {
              await houseGoogleStrict();
            } catch (err) {
              setDenied(err instanceof Error ? err.message : "Access denied.");
            }
          }}
        >
          Continue with Google
        </button>
        {denied ? <p className="mt-6 text-sm text-gold">{denied}</p> : null}
      </QuietFrame>
    );
  }

  return <Dashboard email={user.primaryEmail || HOUSE_EMAIL} />;
}

function QuietFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-6 text-center text-paper">
      <div className="max-w-md">{children}</div>
    </div>
  );
}

function Dashboard({ email }: { email: string }) {
  const looks = useQuery({ queryKey: ["looks"], queryFn: listLooks });
  const inquiries = useQuery({ queryKey: ["inquiries"], queryFn: listInquiries });
  const [editing, setEditing] = useState<Look | null>(null);

  return (
    <div className="min-h-dvh bg-ink text-paper">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <p className="display text-2xl">Floor</p>
          <div className="flex items-center gap-5 text-xs tracking-[0.2em] uppercase text-paper/50">
            <span className="hidden sm:inline">{email}</span>
            <Link to="/">Public</Link>
            <button type="button" onClick={() => void houseSignOut()}>
              Leave
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-16 px-5 py-12 lg:grid-cols-[1fr_0.9fr]">
        <LookForm
          key={editing?.id ?? "new"}
          existing={editing}
          onSaved={() => {
            setEditing(null);
            void looks.refetch();
          }}
        />
        <div>
          <p className="eyebrow">Rack</p>
          <div className="mt-6 space-y-4">
            {(looks.data ?? []).map((look) => (
              <article key={look.id} className="flex gap-4 border border-white/10 p-3">
                <img src={look.cover_url} alt="" className="h-28 w-20 object-contain bg-white/5" />
                <div className="min-w-0 flex-1">
                  <p>{look.title}</p>
                  <p className="text-sm text-paper/45">{look.subtitle}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em]">
                    <button type="button" onClick={() => setEditing(look)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await setLookSoldOut(look.id, !look.sold_out);
                        void looks.refetch();
                      }}
                    >
                      {look.sold_out ? "On rack" : "Sold out"}
                    </button>
                    <button
                      type="button"
                      className="text-gold"
                      onClick={async () => {
                        await removeLook(look.id);
                        void looks.refetch();
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="eyebrow mt-14">Requests</p>
          <ul className="mt-4 space-y-3 text-sm text-paper/70">
            {(inquiries.data ?? []).length === 0 ? <li>None yet.</li> : null}
            {(inquiries.data ?? []).map((row) => (
              <li key={row.id}>
                {row.name || "Client"} · {row.phone}
                <span className="block text-paper/40">{row.pieceSlug} {row.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function LookForm({
  existing,
  onSaved,
}: {
  existing: Look | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [subtitle, setSubtitle] = useState(existing?.subtitle ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [price, setPrice] = useState(existing ? String(existing.price_cents / 100) : "");
  const [cover, setCover] = useState(existing?.cover_url ?? "");
  const [gallery, setGallery] = useState<string[]>(existing?.gallery ?? []);
  const [soldOut, setSoldOut] = useState(existing?.sold_out ?? false);
  const [busy, setBusy] = useState("");

  const save = useMutation({
    mutationFn: () =>
      saveLook({
        id: existing?.id,
        title,
        subtitle,
        description,
        price_cents: Math.round(Number(price || 0) * 100),
        cover_url: cover,
        gallery,
        sold_out: soldOut,
      }),
    onSuccess: onSaved,
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!cover || !title) return;
        save.mutate();
      }}
    >
      <p className="eyebrow">{existing ? "Edit look" : "New look"}</p>
      <h1 className="display text-5xl text-paper">The table</h1>
      <label className="block border border-dashed border-gold/40 px-4 py-8 text-center text-sm text-paper/60">
        Photographs — up to eight
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []).slice(0, 8 - gallery.length);
            for (const file of files) {
              setBusy("Compressing still…");
              const url = await compressImageFile(file);
              setCover((current) => current || url);
              setGallery((current) => [...current, url]);
            }
            setBusy("");
            e.target.value = "";
          }}
        />
      </label>
      {cover ? <img src={cover} alt="" className="max-h-72 w-full object-contain bg-white/5" /> : null}
      <input
        required
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-white/15 bg-transparent px-3 py-3 text-sm outline-none"
      />
      <input
        placeholder="Colour / season"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        className="w-full border border-white/15 bg-transparent px-3 py-3 text-sm outline-none"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="h-24 w-full border border-white/15 bg-transparent px-3 py-3 text-sm outline-none"
      />
      <input
        placeholder="Price UGX"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full border border-white/15 bg-transparent px-3 py-3 text-sm outline-none"
      />
      <label className="flex items-center gap-3 text-sm text-paper/70">
        <input type="checkbox" checked={soldOut} onChange={(e) => setSoldOut(e.target.checked)} />
        Sold out
      </label>
      {busy ? <p className="text-sm text-gold">{busy}</p> : null}
      <button type="submit" className="bg-gold px-6 py-3 text-xs tracking-[0.22em] uppercase text-ink">
        {save.isPending ? "Saving…" : "Save look"}
      </button>
    </form>
  );
}
