import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getStudioData, saveJournal, savePiece, type Piece } from "@/lib/server/boutique";
import { getStudioToken } from "@/lib/bag";
import { MAX_STILLS, parseGallery } from "@/lib/media";
import { resolveMedia } from "@/lib/server/upload";
import { uploadFilm, uploadStill, type StoredStill } from "@/lib/client/upload-media";
import { slugify } from "@/lib/utils";
import { BananaLoader } from "@/components/minion";

type Search = { edit?: string };

export const Route = createFileRoute("/studio/upload")({
  component: UploadPage,
  validateSearch: (s: Record<string, unknown>): Search => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
  }),
});

function UploadPage() {
  const nav = useNavigate();
  const { edit } = Route.useSearch();
  const token = typeof window !== "undefined" ? getStudioToken() : "";
  const studio = useQuery({
    queryKey: ["studio", token],
    queryFn: () => getStudioData({ data: { token } }),
    enabled: Boolean(token),
  });

  const existing = useMemo(() => {
    if (!edit || !studio.data) return undefined;
    return studio.data.pieces.find((p) => String(p.id) === edit);
  }, [edit, studio.data]);

  if (!token) {
    return (
      <p className="px-5 py-16 text-sm text-[#f0d24b]">
        Lock timed out. Open the atelier door again.
      </p>
    );
  }
  if (studio.isLoading) return <BananaLoader label="Laying out the table" />;

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-10 lg:grid-cols-2">
      <LookForm token={token} existing={existing} onSaved={() => nav({ to: "/studio" })} />
      <JournalForm token={token} />
    </div>
  );
}

function stillsFromPiece(piece?: Piece): StoredStill[] {
  if (!piece) return [];
  const gallery = parseGallery(piece.gallery);
  const fromGallery = gallery
    .map((item) => {
      if (typeof item === "string") {
        return { thumb: item, display: item, master: item };
      }
      return {
        thumb: item.thumb || item.display || "",
        display: item.display || item.thumb || "",
        master: item.master || item.display || item.thumb || "",
      };
    })
    .filter((item) => item.display);
  if (fromGallery.length) return fromGallery;
  if (piece.cover_url) {
    return [{ thumb: piece.cover_url, display: piece.cover_url, master: piece.cover_url }];
  }
  return [];
}

function LookForm({
  token,
  existing,
  onSaved,
}: {
  token: string;
  existing?: Piece;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [subtitle, setSubtitle] = useState(existing?.subtitle ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [caption, setCaption] = useState(existing?.caption ?? "");
  const [price, setPrice] = useState(
    existing ? String(Math.round(existing.price_cents / 100)) : "",
  );
  const [category, setCategory] = useState(existing?.category ?? "Set");
  const [stills, setStills] = useState<StoredStill[]>(() => stillsFromPiece(existing));
  const [video, setVideo] = useState(existing?.video_url ?? "");

  useEffect(() => {
    const seed = stillsFromPiece(existing);
    if (!seed.length) return;
    void (async () => {
      const resolved: StoredStill[] = [];
      for (const still of seed) {
        const preview = still.display.startsWith("r2:")
          ? await resolveMedia({ data: { ref: still.display } })
          : still.display;
        resolved.push({ ...still, preview });
      }
      setStills(resolved);
    })();
  }, [existing]);
  const [status, setStatus] = useState<"draft" | "published">(
    (existing?.status as "draft" | "published") ?? "published",
  );
  const [drape, setDrape] = useState(existing?.publish_to_drape ?? false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  const save = useMutation({
    mutationFn: () =>
      savePiece({
        data: {
          token,
          id: existing?.id,
          slug: existing?.slug || slugify(`${title}-${subtitle || category}`),
          title,
          subtitle,
          description,
          caption,
          price_cents: Math.max(0, Math.round(Number(price || 0) * 100)),
          category,
          cover_url: stills[0]?.display || "",
          gallery: JSON.stringify(
            stills.map(({ thumb, display, master }) => ({ thumb, display, master })),
          ),
          video_url: video,
          status,
          publish_to_drape: drape,
        },
      }),
    onSuccess: onSaved,
    onError: (e) => setErr(e.message),
  });

  async function onImages(files: FileList | null) {
    if (!files?.length) return;
    setErr("");
    const room = MAX_STILLS - stills.length;
    const picked = Array.from(files).slice(0, room);
    if (!picked.length) {
      setErr(`A look holds ${MAX_STILLS} stills.`);
      return;
    }
    try {
      for (const [index, file] of picked.entries()) {
        setBusy(`Compressing still ${stills.length + index + 1} of ${stills.length + picked.length}…`);
        const stored = await uploadStill(token, file);
        setStills((current) =>
          current.length >= MAX_STILLS ? current : [...current, stored],
        );
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Image failed.");
    } finally {
      setBusy("");
    }
  }

  async function onVideo(file?: File) {
    if (!file) return;
    setErr("");
    setBusy("Compressing film…");
    try {
      setVideo(await uploadFilm(token, file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Video failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!stills[0]) {
          setErr("Add at least one still.");
          return;
        }
        save.mutate();
      }}
    >
      <p className="text-[0.68rem] tracking-[0.28em] uppercase text-[#f0d24b]">
        Look
      </p>
      <h2 className="display text-4xl text-paper">
        {existing ? "Edit the look" : "Upload a look"}
      </h2>
      <p className="text-sm text-paper/50">
        Drop up to {MAX_STILLS} photographs. The house compresses them for the
        archive, then opens a high-resolution still when someone looks closer.
      </p>
      <label className="block border border-dashed border-[#f0d24b]/40 bg-white/5 px-4 py-10 text-center text-sm text-paper/70">
        Drop photographs or click to choose — {stills.length}/{MAX_STILLS}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void onImages(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {stills.length ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {stills.map((still, index) => (
            <button
              key={`${still.display}-${index}`}
              type="button"
              className="relative bg-white/5"
              onClick={() =>
                setStills((current) => current.filter((_, i) => i !== index))
              }
              title="Remove"
            >
              <img src={still.preview || still.thumb || still.display} alt="" className="h-28 w-full object-contain" />
            </button>
          ))}
        </div>
      ) : null}
      <label className="block text-xs uppercase tracking-[0.16em] text-paper/45">
        Optional video — compressed in the house
        <input
          type="file"
          accept="video/*"
          className="mt-2 block w-full text-sm"
          onChange={(e) => onVideo(e.target.files?.[0])}
        />
      </label>
      {video ? <p className="text-xs text-paper/40">Film ready.</p> : null}
      <input
        placeholder="Or paste a video link"
        value={video.startsWith("data:") || video.startsWith("r2:") ? "" : video}
        onChange={(e) => setVideo(e.target.value)}
        className="w-full border border-white/15 bg-transparent px-3 py-3 text-sm text-paper outline-none"
      />
      <input
        required
        placeholder="Title — The Wrap Set"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-white/15 bg-transparent px-3 py-3 text-sm text-paper outline-none"
      />
      <input
        placeholder="Colour or season — Midnight"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        className="w-full border border-white/15 bg-transparent px-3 py-3 text-sm text-paper outline-none"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="h-24 w-full border border-white/15 bg-transparent px-3 py-3 text-sm text-paper outline-none"
      />
      <textarea
        placeholder="Caption — her voice"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="h-20 w-full border border-white/15 bg-transparent px-3 py-3 text-sm text-paper outline-none"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Price UGX"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border border-white/15 bg-transparent px-3 py-3 text-sm text-paper outline-none"
        />
        <input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-white/15 bg-transparent px-3 py-3 text-sm text-paper outline-none"
        />
      </div>
      <label className="flex items-center gap-3 text-sm text-paper/70">
        <input
          type="checkbox"
          checked={status === "published"}
          onChange={(e) => setStatus(e.target.checked ? "published" : "draft")}
        />
        Show on the public site
      </label>
      <label className="flex items-center gap-3 text-sm text-paper/70">
        <input type="checkbox" checked={drape} onChange={(e) => setDrape(e.target.checked)} />
        Also send to Drapé Collective (no second upload here)
      </label>
      {busy ? <p className="text-sm text-[#f0d24b]">{busy}</p> : null}
      {err ? <p className="text-sm text-[#f0d24b]">{err}</p> : null}
      <button
        type="submit"
        disabled={save.isPending || Boolean(busy)}
        className="bg-[#f0d24b] px-6 py-3 text-[0.7rem] tracking-[0.2em] uppercase text-[#161412]"
      >
        {save.isPending ? "Saving…" : "Save look"}
      </button>
    </form>
  );
}

function JournalForm({ token }: { token: string }) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState("");
  const [type, setType] = useState<"image" | "video">("image");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  const save = useMutation({
    mutationFn: () =>
      saveJournal({
        data: { token, title, caption, media_url: media, media_type: type },
      }),
    onSuccess: () => {
      setTitle("");
      setCaption("");
      setMedia("");
    },
    onError: (e) => setErr(e.message),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!media) {
          setErr("Add media first.");
          return;
        }
        save.mutate();
      }}
    >
      <p className="text-[0.68rem] tracking-[0.28em] uppercase text-[#f0d24b]">
        Journal
      </p>
      <h2 className="display text-4xl text-paper">A note, a film</h2>
      <label className="block border border-dashed border-white/20 px-4 py-8 text-center text-sm text-paper/60">
        Image or short video
        <input
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setErr("");
            try {
              if (file.type.startsWith("video")) {
                setType("video");
                setBusy("Compressing film…");
                setMedia(await uploadFilm(token, file));
              } else {
                setType("image");
                setBusy("Compressing still…");
                const stored = await uploadStill(token, file);
                setMedia(stored.display);
              }
            } catch (error) {
              setErr(error instanceof Error ? error.message : "Could not read file.");
            } finally {
              setBusy("");
            }
          }}
        />
      </label>
      {media && type === "image" ? (
        <img src={media} alt="" className="max-h-72 w-full object-contain bg-white/5" />
      ) : null}
      <input
        placeholder="Title — optional"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-white/15 bg-transparent px-3 py-3 text-sm text-paper outline-none"
      />
      <textarea
        placeholder="Caption"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="h-24 w-full border border-white/15 bg-transparent px-3 py-3 text-sm text-paper outline-none"
      />
      {busy ? <p className="text-sm text-[#f0d24b]">{busy}</p> : null}
      {err ? <p className="text-sm text-[#f0d24b]">{err}</p> : null}
      <button
        type="submit"
        className="border border-[#f0d24b] px-6 py-3 text-[0.7rem] tracking-[0.2em] uppercase text-[#f0d24b]"
      >
        Save to journal
      </button>
    </form>
  );
}
