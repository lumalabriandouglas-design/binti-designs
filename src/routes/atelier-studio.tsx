import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  getHouseNotes,
  listInquiries,
  listLooks,
  removeLook,
  saveHouseNotes,
  saveLook,
  setLookSoldOut,
  setLookHidden,
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
import { uploadFilm, uploadStill } from "@/lib/client/upload-media";
import { Phone } from "lucide-react";
import { GoogleMark, InstagramMark, TikTokMark, WhatsAppMark } from "@/components/brand-marks";
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
import { writeHouseBook, readHouseBook } from "@/lib/house-book";
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
        <Link to="/" className="mt-6 block text-mute">
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
    <div className="flex min-h-dvh items-center justify-center bg-[#14110e] px-6 text-center text-[#f6f1ea]">
      <div className="w-full max-w-md">{children}</div>
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <QuietFrame>
      <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-gold">Private</p>
      <h1 className="display mt-4 text-4xl text-[#f6f1ea] sm:text-5xl">This floor is closed.</h1>
      <p className="mt-4 text-sm text-[#f6f1ea]/60">
        Sign in with the house Google. Wrong accounts are turned away.
      </p>
      <button
        type="button"
        className="mt-10 flex w-full items-center justify-center gap-3 border border-gold bg-gold px-6 py-3 text-xs tracking-[0.24em] uppercase text-[#14110e]"
        onClick={async () => {
          setDenied("");
          try {
            await houseGoogleStrict();
          } catch (err) {
            setDenied("Access denied.");
          }
        }}
      >
        <GoogleMark className="h-4 w-4" />
        Continue with Google
      </button>
      <form
        className="mt-8 space-y-3 text-left"
        autoComplete="off"
        onSubmit={async (e) => {
          e.preventDefault();
          setDenied("");
          try {
            if (!isHouseAccount(email)) {
              setDenied("Access denied.");
              return;
            }
            await houseSignIn(email, password);
          } catch {
            setDenied("Access denied.");
          }
        }}
      >
        <input
          type="email"
          name="floor-email"
          autoComplete="off"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-[#f6f1ea]/20 bg-transparent px-3 py-3 text-sm text-[#f6f1ea] outline-none"
        />
        <input
          required
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-[#f6f1ea]/20 bg-transparent px-3 py-3 text-sm text-[#f6f1ea] outline-none"
        />
        <button type="submit" className="w-full border border-[#f6f1ea]/30 py-3 text-xs tracking-[0.22em] uppercase text-[#f6f1ea]">
          Open
        </button>
      </form>
      {denied ? <p className="mt-6 text-sm text-[#f6f1ea]/50">{denied}</p> : null}
    </QuietFrame>
  );
}

function Dashboard({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("rack");
  const [editing, setEditing] = useState<Look | null>(null);
  const [token, setToken] = useState("");
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });
  const notes = useQuery({ queryKey: ["house-notes"], queryFn: getHouseNotes });
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
          hidden: false,
          created_at: piece.created_at,
        }),
      );
    return [...remote, ...local];
  }, [firestore.data, catalog.data?.pieces]);

  function startEdit(look: Look) {
    setEditing(look);
    setTab("table");
  }

  const rooms = [
    { id: "rack" as Tab, label: "Collection", hint: "The rack" },
    { id: "table" as Tab, label: "Hang", hint: "New look" },
    { id: "requests" as Tab, label: "Desk", hint: "Clients" },
    { id: "house" as Tab, label: "House", hint: "Numbers & socials" },
  ];

  return (
    <div className="min-h-dvh bg-[#f3eee6] text-ink lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="hidden bg-[#14110e] text-[#f6f1ea] lg:block">
        <div className="flex h-full flex-col px-7 py-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-gold">Atelier</p>
          <p className="display mt-3 text-3xl">BINTI</p>
          <p className="mt-2 text-sm text-[#f6f1ea]/65">Welcome back, Natasha.</p>
          <p className="mt-1 text-[11px] text-[#f6f1ea]/40">{email}</p>
          <nav className="mt-10 space-y-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  if (room.id === "table") setEditing(null);
                  setTab(room.id);
                }}
                className={`flex w-full items-baseline justify-between px-3 py-3 text-left ${
                  tab === room.id
                    ? "bg-gold text-[#14110e]"
                    : "text-[#f6f1ea]/75 hover:text-[#f6f1ea]"
                }`}
              >
                <span className="text-[11px] tracking-[0.18em] uppercase">{room.label}</span>
                <span className="text-[10px] tracking-[0.12em] uppercase opacity-70">{room.hint}</span>
              </button>
            ))}
          </nav>
          <div className="mt-10 grid grid-cols-2 gap-3 border-t border-[#f6f1ea]/15 pt-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-gold">Looks</p>
              <p className="display mt-1 text-3xl">{rack.length}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-gold">Desk</p>
              <p className="display mt-1 text-3xl">{(inquiries.data ?? []).length}</p>
            </div>
          </div>
          <div className="mt-auto flex flex-col gap-3 pt-10 text-[10px] uppercase tracking-[0.18em] text-[#f6f1ea]/50">
            <Link to="/">The house</Link>
            <Link to="/collection">Collection</Link>
            <button type="button" className="text-left" onClick={() => void houseSignOut()}>
              Close the floor
            </button>
          </div>
        </div>
      </aside>

      <div className="px-4 py-6 sm:px-8 sm:py-10">
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 lg:hidden">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => {
                if (room.id === "table") setEditing(null);
                setTab(room.id);
              }}
              className={`shrink-0 px-4 py-2 text-[10px] tracking-[0.16em] uppercase ${
                tab === room.id ? "bg-[#14110e] text-gold" : "border border-line text-mute"
              }`}
            >
              {room.label}
            </button>
          ))}
        </div>
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
            whatsapp={notes.data?.whatsapp || catalog.data?.settings?.whatsapp || ""}
            phone={notes.data?.phone || catalog.data?.settings?.phone || ""}
            payment={notes.data?.payment_phone || catalog.data?.settings?.payment_phone || ""}
            instagram={notes.data?.instagram || catalog.data?.settings?.instagram || ""}
            tiktok={notes.data?.tiktok || ""}
            about={notes.data?.about || catalog.data?.settings?.about || ""}
            tagline={notes.data?.tagline || catalog.data?.settings?.tagline || ""}
            onSaved={() => {
              void catalog.refetch();
              void notes.refetch();
            }}
          />
        ) : null}
        {tab === "requests" ? (
          <Requests rows={inquiries.data ?? []} />
        ) : null}
      </div>

      <footer className="px-5 pb-8 text-[10px] uppercase tracking-[0.18em] text-mute">For Natasha only</footer>
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
          <p className="eyebrow">The rack</p>
          <h1 className="display mt-2 text-5xl">The house</h1>
        </div>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {looks.length === 0 ? (
          <p className="text-sm text-mute">The rack is empty. Open House to hang the first piece.</p>
        ) : null}
        {looks.map((look) => (
          <article key={look.id} className="flex gap-4 border border-line p-4">
            <img src={look.cover_url} alt="" className="h-36 w-24 object-contain bg-paper-2" />
            <div className="min-w-0 flex-1">
              <p>{look.title}</p>
              <p className="text-sm text-mute">{look.subtitle || look.category}</p>
              <p className="mt-2 text-sm text-mute">
                {look.hidden
                  ? "Hidden"
                  : look.sold_out
                    ? "Reserved"
                    : look.price_cents
                      ? formatMoney(look.price_cents, look.currency)
                      : "Inquiry"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[0.62rem] tracking-[0.16em] uppercase">
                <button type="button" className="border border-line px-3 py-2" onClick={() => onEdit(look)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="border border-line px-3 py-2"
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
                  className="border border-line px-3 py-2"
                  onClick={async () => {
                    if (look.id.startsWith("local-")) return;
                    await setLookHidden(look.id, !look.hidden);
                    onRefresh();
                  }}
                >
                  {look.hidden ? "Show" : "Hide"}
                </button>
                <button
                  type="button"
                  className="border border-line px-3 py-2 text-mute"
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
  const [hidden, setHidden] = useState(existing?.hidden ?? false);
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
        hidden,
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
      try {
        await saveLook({
          ...payload,
          id: existing && !existing.id.startsWith("local-") ? existing.id : undefined,
          created_at: existing?.created_at,
        });
      } catch (err) {
        if (!token) throw err;
        const frames = gallery.map((url) => ({ thumb: url, display: url, master: url }));
        await savePiece({
          data: {
            token,
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
      }
    },
    onSuccess: onSaved,
    onError: (err) => setError(err instanceof Error ? err.message : "Could not save."),
  });

  return (
    <form
      className="mx-auto max-w-5xl"
      onSubmit={(e) => {
        e.preventDefault();
        if (!cover || !title) {
          setError("A title and one photograph are required.");
          return;
        }
        save.mutate();
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold">
            {existing ? "Edit" : "Hang"}
          </p>
          <h1 className="display mt-2 text-4xl sm:text-5xl md:text-6xl">
            {existing ? existing.title : "New look"}
          </h1>
        </div>
        <button
          type="submit"
          className="bg-[#14110e] px-7 py-3 text-[11px] tracking-[0.22em] uppercase text-[#f6f1ea]"
        >
          {save.isPending ? "Saving…" : existing ? "Save changes" : "Hang in the house"}
        </button>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section>
          <p className="text-[10px] uppercase tracking-[0.2em] text-mute">Photographs</p>
          <label className="mt-3 flex min-h-48 cursor-pointer flex-col items-center justify-center border border-dashed border-[#14110e]/20 bg-[#faf7f2] px-4 py-10 text-center text-sm text-mute">
            Drop stills here, or tap to choose. Five to eight. First frame is the cover until you pick another.
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []).slice(0, 8 - gallery.length);
                for (const file of files) {
                  setBusy(`Sending ${file.name} to the archive…`);
                  try {
                    const stored = await uploadStill(token || "house", file);
                    const url = stored.display || stored.preview || stored.master;
                    setCover((current) => current || url);
                    setGallery((current) => [...current, url]);
                  } catch (err) {
                    const url = await compressImageFile(file);
                    setCover((current) => current || url);
                    setGallery((current) => [...current, url]);
                    setError(err instanceof Error ? err.message : "Archive failed; kept a local still.");
                  }
                }
                setBusy("");
                e.target.value = "";
              }}
            />
          </label>
          {gallery.length ? (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {gallery.map((url, index) => (
                <div key={`${url}-${index}`} className="relative bg-[#faf7f2]">
                  <button type="button" onClick={() => setCover(url)} className="block w-full">
                    <img src={url} alt="" className="aspect-[3/4] w-full object-contain" />
                  </button>
                  {url === cover ? (
                    <span className="absolute left-2 top-2 bg-[#14110e] px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-gold">
                      Cover
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="absolute right-2 top-2 text-[11px] text-mute"
                    onClick={() => {
                      const next = gallery.filter((_, i) => i !== index);
                      setGallery(next);
                      if (cover === url) setCover(next[0] ?? "");
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <label className="mt-6 flex min-h-28 cursor-pointer flex-col items-center justify-center border border-dashed border-[#14110e]/20 bg-[#faf7f2] px-4 py-8 text-center text-sm text-mute">
            Optional film
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy("Sending film to the archive…");
                try {
                  const url = await uploadFilm(token || "house", file);
                  setVideo(url);
                } catch {
                  const blob = await compressVideoFile(file);
                  setVideo(await blobToDataUrl(blob));
                }
                setBusy("");
                e.target.value = "";
              }}
            />
          </label>
          {video ? <video src={video} controls className="mt-4 w-full bg-[#faf7f2]" /> : null}
        </section>

        <section className="space-y-4">
          <label className="block text-[10px] uppercase tracking-[0.18em] text-mute">
            Title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full border border-[#14110e]/15 bg-transparent px-3 py-3 text-base normal-case tracking-normal text-ink outline-none"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-[10px] uppercase tracking-[0.18em] text-mute">
              Colour / season
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="mt-2 w-full border border-[#14110e]/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal text-ink outline-none"
              />
            </label>
            <label className="block text-[10px] uppercase tracking-[0.18em] text-mute">
              Category
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full border border-[#14110e]/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal text-ink outline-none"
              />
            </label>
          </div>
          <label className="block text-[10px] uppercase tracking-[0.18em] text-mute">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 h-28 w-full border border-[#14110e]/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal text-ink outline-none"
            />
          </label>
          <label className="block text-[10px] uppercase tracking-[0.18em] text-mute">
            Caption
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-2 h-20 w-full border border-[#14110e]/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal text-ink outline-none"
            />
          </label>
          <label className="block text-[10px] uppercase tracking-[0.18em] text-mute">
            Price UGX
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-2 w-full border border-[#14110e]/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal text-ink outline-none"
            />
          </label>
          <label className="flex items-center gap-3 text-sm text-mute">
            <input type="checkbox" checked={soldOut} onChange={(e) => setSold(e.target.checked)} />
            Sold out
          </label>
          <label className="flex items-center gap-3 text-sm text-mute">
            <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
            Hide from the public house
          </label>
          {busy ? <p className="text-sm text-mute">{busy}</p> : null}
          {error ? <p className="text-sm text-mute">{error}</p> : null}
        </section>
      </div>
    </form>
  );
}


function HouseBook({
  token,
  whatsapp,
  phone,
  payment,
  instagram,
  tiktok,
  about,
  tagline,
  onSaved,
}: {
  token: string;
  whatsapp: string;
  phone: string;
  payment: string;
  instagram: string;
  tiktok: string;
  about: string;
  tagline: string;
  onSaved: () => void;
}) {
  const seed = readHouseBook();
  const [wa, setWa] = useState(whatsapp || seed.whatsapp);
  const [tel, setTel] = useState(phone || seed.phone);
  const [pay, setPay] = useState(payment || seed.payment_phone);
  const [ig, setIg] = useState(instagram || seed.instagram);
  const [tt, setTt] = useState(tiktok || seed.tiktok);
  const [line, setLine] = useState(tagline || seed.tagline);
  const [story, setStory] = useState(about || seed.about);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (whatsapp) setWa(whatsapp);
    if (phone) setTel(phone);
    if (payment) setPay(payment);
    if (instagram) setIg(instagram);
    if (tiktok) setTt(tiktok);
    if (tagline) setLine(tagline);
    if (about) setStory(about);
  }, [whatsapp, phone, payment, instagram, tiktok, tagline, about]);

  return (
    <form
      className="mx-auto max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setNote("");
        const book = {
          tagline: line.trim() || "Cut. Drape. Belong.",
          about: story.trim(),
          whatsapp: wa.trim(),
          phone: tel.trim(),
          payment_phone: pay.trim(),
          instagram: ig.trim(),
          tiktok: tt.trim(),
        };
        writeHouseBook(book);
        let remote = false;
        try {
          await saveHouseNotes(book);
          remote = true;
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not reach the house book.");
        }
        if (token) {
          try {
            await saveSettings({
              data: {
                token,
                brand_name: "BINTI DESIGNS",
                tagline: book.tagline,
                whatsapp: book.whatsapp,
                phone: book.phone,
                payment_phone: book.payment_phone,
                instagram: book.instagram,
                drape_url: "https://odrapecollective.com",
                about: book.about,
                admin_email: HOUSE_EMAIL,
              },
            });
          } catch {
            /* Vercel studio token is per-instance */
          }
        }
        setSaving(false);
        setNote(
          remote
            ? "Saved. WhatsApp, call, and pay now use these numbers on the house and the bag."
            : "Saved on this device. Publish Firestore rules so every visitor sees the same numbers.",
        );
        onSaved();
      }}
    >
      <p className="eyebrow">House</p>
      <h1 className="display text-5xl">Numbers</h1>
      <p className="text-sm leading-relaxed text-mute">
        WhatsApp opens chat. Call dials. Pay copies into Mobile Money.
      </p>
      <label className="block text-[0.62rem] uppercase tracking-[0.16em] text-mute">
        <span className="flex items-center gap-2">
          <WhatsAppMark className="h-3.5 w-3.5 text-[#25D366]" />
          WhatsApp
        </span>
        <input
          type="tel"
          name="whatsapp"
          autoComplete="tel"
          placeholder="+256…"
          value={wa}
          onChange={(e) => setWa(e.target.value)}
          className="mt-2 w-full border border-line bg-paper px-3 py-3 text-sm normal-case tracking-normal text-ink outline-none"
        />
      </label>
      <label className="block text-[0.62rem] uppercase tracking-[0.16em] text-mute">
        <span className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
          Call
        </span>
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          placeholder="+256…"
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          className="mt-2 w-full border border-line bg-paper px-3 py-3 text-sm normal-case tracking-normal text-ink outline-none"
        />
      </label>
      <label className="block text-[0.62rem] uppercase tracking-[0.16em] text-mute">
        <span className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.08em]">PAY</span>
          Pay
        </span>
        <input
          type="tel"
          name="payment"
          inputMode="tel"
          placeholder="+256…"
          value={pay}
          onChange={(e) => setPay(e.target.value)}
          className="mt-2 w-full border border-line bg-paper px-3 py-3 text-sm normal-case tracking-normal text-ink outline-none"
        />
      </label>
      <label className="block text-[0.62rem] uppercase tracking-[0.16em] text-mute">
        <span className="flex items-center gap-2">
          <InstagramMark className="h-3.5 w-3.5" />
          Instagram
        </span>
        <input
          type="url"
          name="instagram"
          placeholder="https://www.instagram.com/binti_dezigns"
          value={ig}
          onChange={(e) => setIg(e.target.value)}
          className="mt-2 w-full border border-line bg-paper px-3 py-3 text-sm normal-case tracking-normal text-ink outline-none"
        />
      </label>
      <label className="block text-[0.62rem] uppercase tracking-[0.16em] text-mute">
        <span className="flex items-center gap-2">
          <TikTokMark className="h-3.5 w-3.5" />
          TikTok
        </span>
        <input
          type="url"
          name="tiktok"
          placeholder="https://www.tiktok.com/@binti.dezigns"
          value={tt}
          onChange={(e) => setTt(e.target.value)}
          className="mt-2 w-full border border-line bg-paper px-3 py-3 text-sm normal-case tracking-normal text-ink outline-none"
        />
      </label>
      <label className="block text-[0.62rem] uppercase tracking-[0.16em] text-mute">
        Line
        <input
          value={line}
          onChange={(e) => setLine(e.target.value)}
          className="mt-2 w-full border border-line bg-paper px-3 py-3 text-sm normal-case tracking-normal text-ink outline-none"
        />
      </label>
      <label className="block text-[0.62rem] uppercase tracking-[0.16em] text-mute">
        About
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          className="mt-2 h-32 w-full border border-line bg-paper px-3 py-3 text-sm normal-case tracking-normal text-ink outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="bg-ink px-6 py-3 text-xs tracking-[0.22em] uppercase text-paper disabled:opacity-40"
      >
        {saving ? "Saving…" : "Save numbers"}
      </button>
      {note ? <p className="text-sm text-mute">{note}</p> : null}
      {error ? <p className="text-sm text-mute">{error}</p> : null}
    </form>
  );
}

function Requests({
  rows,
}: {
  rows: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    accountId?: string;
    accountName?: string;
    note: string;
    pieceSlug: string;
    createdAt?: string;
  }[];
}) {
  return (
    <div>
      <p className="eyebrow">Desk</p>
      <h1 className="display mt-2 text-5xl">Clients</h1>
      <p className="mt-4 max-w-lg text-sm text-mute">
        Numbers they left, and the account if they signed in.
      </p>
      <ul className="mt-10 divide-y divide-line">
        {rows.length === 0 ? <li className="py-6 text-sm text-mute">No one has left a number yet.</li> : null}
        {rows.map((row) => {
          const digits = row.phone.replace(/[^\d]/g, "");
          return (
            <li key={row.id} className="grid gap-2 py-6 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="text-lg">{row.name || "Client"}</p>
                <p className="mt-1 text-sm">{row.phone}</p>
                {row.email || row.accountName ? (
                  <p className="mt-1 text-sm text-mute">
                    Account · {row.accountName || row.email}
                    {row.email && row.accountName ? ` · ${row.email}` : ""}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-mute">Left as a guest</p>
                )}
                <p className="mt-2 text-sm text-mute">
                  {row.pieceSlug ? `Look · ${row.pieceSlug}` : "House"}
                  {row.note ? ` — ${row.note}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[0.62rem] tracking-[0.16em] uppercase">
                {digits ? (
                  <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                ) : null}
                {row.phone ? <a href={`tel:${row.phone}`}>Call</a> : null}
              </div>
            </li>
          );
        })}
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
