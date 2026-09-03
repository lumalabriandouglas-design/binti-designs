import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  listInquiries,
  listLooks,
  removeLook,
  saveLook,
  setLookSoldOut,
  type Look,
} from "@/lib/firebase/catalog";
import { HOUSE_EMAIL } from "@/lib/firebase/firebase";
import {
  houseGoogleStrict,
  houseSignIn,
  houseSignOut,
  useHouseUser,
} from "@/lib/firebase/session";
import { isHouseAccount } from "@/lib/house";
import { compressImageFile, compressVideoFile, parseGallery } from "@/lib/media";
import { BananaMark, MinionPeek } from "@/components/minion";
import {
  deletePiece,
  getPublicCatalog,
  openStudioForHouse,
  savePiece,
  saveSettings,
  setSoldOut,
} from "@/lib/server/boutique";
import { formatMoney } from "@/lib/utils";
import { setStudioToken } from "@/lib/bag";

export const Route = createFileRoute("/atelier-studio")({ component: AtelierStudio });

type Tab = "rack" | "table" | "house" | "requests";

function AtelierStudio() {
  const { user, isPending } = useHouseUser();
  const [denied, setDenied] = useState("");

  if (isPending) {
    return (
      <QuietFrame>
        <BananaMark className="mx-auto mb-6 h-8 w-8" />
        Opening her floor
      </QuietFrame>
    );
  }

  if (user && !isHouseAccount(user.primaryEmail)) {
    void houseSignOut();
    return (
      <QuietFrame>
        This key does not open the floor.
        <Link to="/" className="mt-6 block text-banana">
          Return
        </Link>
      </QuietFrame>
    );
  }

  if (!user) return <StudioDoor denied={denied} setDenied={setDenied} />;

  return <Dashboard email={user.primaryEmail || HOUSE_EMAIL} />;
}

function QuietFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0d0c0a] px-6 text-center text-paper">
      <div className="max-w-md">{children}</div>
    </div>
  );
}

function StudioDoor({
  denied,
  setDenied,
}: {
  denied: string;
  setDenied: (value: string) => void;
}) {
  const [email, setEmail] = useState(HOUSE_EMAIL);
  const [password, setPassword] = useState("");

  return (
    <QuietFrame>
      <BananaMark className="mx-auto mb-8 h-8 w-8" />
      <p className="text-[0.62rem] tracking-[0.32em] uppercase text-banana">Private floor</p>
      <h1 className="display mt-4 text-5xl text-paper">Atelier</h1>
      <p className="mt-4 text-sm text-paper/50">
        Only the house account may enter. The public site does not mention this room.
      </p>
      <button
        type="button"
        className="mt-10 w-full border border-banana/60 px-6 py-3 text-xs tracking-[0.24em] uppercase text-banana"
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
      <form
        className="mt-6 space-y-3 text-left"
        onSubmit={async (e) => {
          e.preventDefault();
          setDenied("");
          try {
            if (!isHouseAccount(email)) {
              setDenied("This key does not open the floor.");
              return;
            }
            await houseSignIn(email, password);
          } catch (err) {
            setDenied(err instanceof Error ? err.message : "Could not open.");
          }
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-white/15 bg-transparent px-3 py-3 text-sm text-paper outline-none"
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-white/15 bg-transparent px-3 py-3 text-sm text-paper outline-none"
        />
        <button type="submit" className="w-full bg-banana py-3 text-xs tracking-[0.22em] uppercase text-ink">
          Open
        </button>
      </form>
      {denied ? <p className="mt-6 text-sm text-banana">{denied}</p> : null}
    </QuietFrame>
  );
}

function Dashboard({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("rack");
  const [editing, setEditing] = useState<Look | null>(null);
  const [token, setToken] = useState("");
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });
  const firestore = useQuery({ queryKey: ["looks"], queryFn: listLooks });
  const inquiries = useQuery({ queryKey: ["inquiries"], queryFn: listInquiries });

  useEffect(() => {
    void openStudioForHouse().then((res) => {
      if (res.ok) {
        setStudioToken(res.token);
        setToken(res.token);
      }
    });
  }, []);

  const rack = useMemo(() => {
    const remote = firestore.data ?? [];
    const slugs = new Set(remote.map((row) => row.slug));
    const local = (catalog.data?.pieces ?? [])
      .filter((piece) => !slugs.has(piece.slug))
      .map(
        (piece): Look => ({
          id: `local-${piece.id}`,
          slug: piece.slug,
          title: piece.title,
          subtitle: piece.subtitle,
          description: piece.description,
          caption: piece.caption,
          price_cents: piece.price_cents,
          currency: piece.currency || "UGX",
          category: piece.category,
          cover_url: piece.cover_url,
          gallery: parseGallery(piece.gallery).map((item) =>
            typeof item === "string" ? item : item.display || item.thumb,
          ),
          video_url: piece.video_url,
          sold_out: piece.sold_out,
          created_at: piece.created_at,
        }),
      );
    return [...remote, ...local];
  }, [firestore.data, catalog.data?.pieces]);

  function startEdit(look: Look) {
    setEditing(look);
    setTab("table");
  }

  return (
    <div className="min-h-dvh bg-[#0d0c0a] text-paper">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <BananaMark className="h-6 w-6" />
            <div>
              <p className="display text-2xl leading-none">Studio</p>
              <p className="mt-1 text-[0.6rem] tracking-[0.22em] uppercase text-banana">{email}</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-5 text-[0.65rem] tracking-[0.22em] uppercase text-paper/45">
            {(
              [
                ["rack", "Rack"],
                ["table", "Look"],
                ["house", "House"],
                ["requests", "Requests"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={tab === id ? "text-banana" : ""}
                onClick={() => {
                  if (id === "table" && tab !== "table") setEditing(null);
                  setTab(id);
                }}
              >
                {label}
              </button>
            ))}
            <Link to="/" className="text-paper/30">
              Public
            </Link>
            <button type="button" onClick={() => void houseSignOut()}>
              Leave
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        {tab === "rack" ? (
          <Rack
            looks={rack}
            onEdit={startEdit}
            onRefresh={() => {
              void firestore.refetch();
              void catalog.refetch();
            }}
            token={token}
          />
        ) : null}
        {tab === "table" ? (
          <LookForm
            key={editing?.id ?? "new"}
            existing={editing}
            token={token}
            onSaved={() => {
              setEditing(null);
              setTab("rack");
              void firestore.refetch();
              void catalog.refetch();
            }}
          />
        ) : null}
        {tab === "house" ? (
          <HouseBook
            token={token}
            whatsapp={catalog.data?.settings?.whatsapp ?? ""}
            phone={catalog.data?.settings?.phone ?? ""}
            payment={catalog.data?.settings?.payment_phone ?? ""}
            instagram={catalog.data?.settings?.instagram ?? ""}
            about={catalog.data?.settings?.about ?? ""}
            tagline={catalog.data?.settings?.tagline ?? ""}
            onSaved={() => void catalog.refetch()}
          />
        ) : null}
        {tab === "requests" ? (
          <Requests rows={inquiries.data ?? []} />
        ) : null}
      </div>

      <footer className="group border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-end justify-between px-5 py-8">
          <p className="text-[0.62rem] tracking-[0.22em] uppercase text-paper/30">
            For her eyes only
          </p>
          <MinionPeek />
        </div>
      </footer>
    </div>
  );
}

function Rack({
  looks,
  onEdit,
  onRefresh,
  token,
}: {
  looks: Look[];
  onEdit: (look: Look) => void;
  onRefresh: () => void;
  token: string;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.62rem] tracking-[0.28em] uppercase text-banana">The rack</p>
          <h1 className="display mt-2 text-5xl">Every look</h1>
        </div>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {looks.length === 0 ? (
          <p className="text-sm text-paper/45">The rack is empty. Open Look to hang the first piece.</p>
        ) : null}
        {looks.map((look) => (
          <article key={look.id} className="flex gap-4 border border-white/10 p-4">
            <img src={look.cover_url} alt="" className="h-36 w-24 object-contain bg-white/5" />
            <div className="min-w-0 flex-1">
              <p className="text-paper">{look.title}</p>
              <p className="text-sm text-paper/45">{look.subtitle || look.category}</p>
              <p className="mt-2 text-sm text-paper/55">
                {look.sold_out
                  ? "Reserved"
                  : look.price_cents
                    ? formatMoney(look.price_cents, look.currency)
                    : "Inquiry"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[0.62rem] tracking-[0.16em] uppercase">
                <button type="button" className="border border-white/20 px-3 py-2" onClick={() => onEdit(look)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="border border-white/20 px-3 py-2"
                  onClick={async () => {
                    if (look.id.startsWith("local-")) {
                      await setSoldOut({
                        data: {
                          token,
                          id: Number(look.id.replace("local-", "")),
                          sold_out: !look.sold_out,
                        },
                      });
                    } else {
                      await setLookSoldOut(look.id, !look.sold_out);
                    }
                    onRefresh();
                  }}
                >
                  {look.sold_out ? "Back on rack" : "Sold out"}
                </button>
                <button
                  type="button"
                  className="border border-white/20 px-3 py-2 text-banana"
                  onClick={async () => {
                    if (!window.confirm("Remove this look from the house?")) return;
                    if (look.id.startsWith("local-")) {
                      await deletePiece({
                        data: { token, id: Number(look.id.replace("local-", "")) },
                      });
                    } else {
                      await removeLook(look.id);
                    }
                    onRefresh();
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function LookForm({
  existing,
  token,
  onSaved,
}: {
  existing: Look | null;
  token: string;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [subtitle, setSubtitle] = useState(existing?.subtitle ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [caption, setCaption] = useState(existing?.caption ?? "");
  const [category, setCategory] = useState(existing?.category ?? "Look");
  const [price, setPrice] = useState(existing ? String(existing.price_cents / 100) : "");
  const [cover, setCover] = useState(existing?.cover_url ?? "");
  const [gallery, setGallery] = useState<string[]>(existing?.gallery ?? []);
  const [video, setVideo] = useState(existing?.video_url ?? "");
  const [soldOut, setSold] = useState(existing?.sold_out ?? false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        subtitle,
        description,
        caption,
        category,
        price_cents: Math.round(Number(price || 0) * 100),
        currency: "UGX" as const,
        cover_url: cover,
        gallery,
        video_url: video,
        sold_out: soldOut,
        slug: existing?.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      };
      if (existing?.id.startsWith("local-") && token) {
        const frames = gallery.map((url) => ({ thumb: url, display: url, master: url }));
        await savePiece({
          data: {
            token,
            id: Number(existing.id.replace("local-", "")),
            slug: payload.slug,
            title,
            subtitle,
            description,
            price_cents: payload.price_cents,
            category,
            cover_url: cover,
            gallery: JSON.stringify(frames),
            video_url: video,
            caption,
            status: "published",
            publish_to_drape: false,
          },
        });
        await setSoldOut({
          data: { token, id: Number(existing.id.replace("local-", "")), sold_out: soldOut },
        });
        return;
      }
      await saveLook({
        ...payload,
        id: existing && !existing.id.startsWith("local-") ? existing.id : undefined,
        created_at: existing?.created_at,
      });
    },
    onSuccess: onSaved,
    onError: (err) => setError(err instanceof Error ? err.message : "Could not save."),
  });

  return (
    <form
      className="mx-auto max-w-2xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!cover || !title) {
          setError("A title and one photograph are required.");
          return;
        }
        save.mutate();
      }}
    >
      <p className="text-[0.62rem] tracking-[0.28em] uppercase text-banana">
        {existing ? "Edit look" : "New look"}
      </p>
      <h1 className="display text-5xl">{existing ? existing.title : "Hang a look"}</h1>
      <label className="block border border-dashed border-banana/35 px-4 py-8 text-center text-sm text-paper/55">
        Photographs — five to eight. The first is the cover unless you choose another.
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []).slice(0, 8 - gallery.length);
            for (const file of files) {
              setBusy(`Compressing ${file.name}…`);
              const url = await compressImageFile(file);
              setCover((current) => current || url);
              setGallery((current) => [...current, url]);
            }
            setBusy("");
            e.target.value = "";
          }}
        />
      </label>
      {gallery.length ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {gallery.map((url, index) => (
            <div key={`${url}-${index}`} className="relative bg-white/5">
              <button type="button" onClick={() => setCover(url)}>
                <img src={url} alt="" className="h-20 w-full object-contain" />
              </button>
              {url === cover ? (
                <span className="absolute left-1 top-1 text-[0.55rem] uppercase tracking-[0.12em] text-banana">
                  Cover
                </span>
              ) : null}
              <button
                type="button"
                className="absolute right-1 top-1 text-[0.55rem] uppercase text-paper/70"
                onClick={() => {
                  const next = gallery.filter((_, i) => i !== index);
                  setGallery(next);
                  if (cover === url) setCover(next[0] ?? "");
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <label className="block border border-dashed border-white/15 px-4 py-6 text-center text-sm text-paper/45">
        Optional film
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy("Compressing film…");
            const blob = await compressVideoFile(file);
            const url = await blobToDataUrl(blob);
            setVideo(url);
            setBusy("");
            e.target.value = "";
          }}
        />
      </label>
      {video ? <video src={video} controls className="w-full bg-white/5" /> : null}
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
      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full border border-white/15 bg-transparent px-3 py-3 text-sm outline-none"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="h-24 w-full border border-white/15 bg-transparent px-3 py-3 text-sm outline-none"
      />
      <textarea
        placeholder="Caption for the film or sitting"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="h-20 w-full border border-white/15 bg-transparent px-3 py-3 text-sm outline-none"
      />
      <input
        placeholder="Price UGX"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full border border-white/15 bg-transparent px-3 py-3 text-sm outline-none"
      />
      <label className="flex items-center gap-3 text-sm text-paper/70">
        <input type="checkbox" checked={soldOut} onChange={(e) => setSold(e.target.checked)} />
        Sold out
      </label>
      {busy ? <p className="text-sm text-banana">{busy}</p> : null}
      {error ? <p className="text-sm text-banana">{error}</p> : null}
      <button type="submit" className="bg-banana px-6 py-3 text-xs tracking-[0.22em] uppercase text-ink">
        {save.isPending ? "Saving…" : existing ? "Save changes" : "Hang look"}
      </button>
    </form>
  );
}

function HouseBook({
  token,
  whatsapp,
  phone,
  payment,
  instagram,
  about,
  tagline,
  onSaved,
}: {
  token: string;
  whatsapp: string;
  phone: string;
  payment: string;
  instagram: string;
  about: string;
  tagline: string;
  onSaved: () => void;
}) {
  const [wa, setWa] = useState(whatsapp);
  const [tel, setTel] = useState(phone);
  const [pay, setPay] = useState(payment);
  const [ig, setIg] = useState(instagram);
  const [line, setLine] = useState(tagline);
  const [story, setStory] = useState(about);
  const [note, setNote] = useState("");

  useEffect(() => {
    setWa(whatsapp);
    setTel(phone);
    setPay(payment);
    setIg(instagram);
    setLine(tagline);
    setStory(about);
  }, [whatsapp, phone, payment, instagram, tagline, about]);

  return (
    <form
      className="mx-auto max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!token) {
          setNote("Sign in again to save house notes.");
          return;
        }
        await saveSettings({
          data: {
            token,
            brand_name: "BINTI DESIGNS",
            tagline: line,
            whatsapp: wa,
            phone: tel,
            payment_phone: pay,
            instagram: ig,
            drape_url: "https://odrapecollective.com",
            about: story,
            admin_email: HOUSE_EMAIL,
          },
        });
        setNote("House notes saved.");
        onSaved();
      }}
    >
      <p className="text-[0.62rem] tracking-[0.28em] uppercase text-banana">House</p>
      <h1 className="display text-5xl">Numbers</h1>
      {(
        [
          ["WhatsApp", wa, setWa],
          ["Contact phone", tel, setTel],
          ["Payment number", pay, setPay],
          ["Instagram URL", ig, setIg],
          ["Line", line, setLine],
        ] as const
      ).map(([label, value, set]) => (
        <label key={label} className="block text-[0.62rem] uppercase tracking-[0.16em] text-paper/40">
          {label}
          <input
            value={value}
            onChange={(e) => set(e.target.value)}
            className="mt-2 w-full border border-white/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal text-paper outline-none"
          />
        </label>
      ))}
      <label className="block text-[0.62rem] uppercase tracking-[0.16em] text-paper/40">
        About
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          className="mt-2 h-32 w-full border border-white/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal text-paper outline-none"
        />
      </label>
      <button type="submit" className="bg-banana px-6 py-3 text-xs tracking-[0.22em] uppercase text-ink">
        Save house
      </button>
      {note ? <p className="text-sm text-banana">{note}</p> : null}
    </form>
  );
}

function Requests({ rows }: { rows: { id: string; name: string; phone: string; note: string; pieceSlug: string }[] }) {
  return (
    <div>
      <p className="text-[0.62rem] tracking-[0.28em] uppercase text-banana">Requests</p>
      <h1 className="display mt-2 text-5xl">Call backs</h1>
      <ul className="mt-8 divide-y divide-white/10">
        {rows.length === 0 ? <li className="py-4 text-sm text-paper/40">None yet.</li> : null}
        {rows.map((row) => (
          <li key={row.id} className="py-4 text-sm">
            <p>
              {row.name || "Client"} · {row.phone}
            </p>
            <p className="text-paper/40">
              {row.pieceSlug} {row.note}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
