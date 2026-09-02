import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getStudioData, saveJournal, savePiece, type Piece } from "@/lib/server/boutique";
import { getStudioToken } from "@/lib/bag";
import { compressImageFile, readVideoFile } from "@/lib/media";
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
  const [cover, setCover] = useState(existing?.cover_url ?? "");
  const [video, setVideo] = useState(existing?.video_url ?? "");
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
          cover_url: cover,
          gallery: "[]",
          video_url: video,
          status,
          publish_to_drape: drape,
        },
      }),
    onSuccess: onSaved,
    onError: (e) => setErr(e.message),
  });

  async function onImage(file?: File) {
    if (!file) return;
    setErr("");
    setBusy("Compressing still…");
    try {
      setCover(await compressImageFile(file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Image failed.");
    } finally {
      setBusy("");
    }
  }

  async function onVideo(file?: File) {
    if (!file) return;
    setErr("");
    setBusy("Reading video…");
    try {
      setVideo(await readVideoFile(file));
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
        if (!cover) {
          setErr("Add a still first.");
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
        Stills are compressed on the way in, then shown large on the site.
        Add a caption if you want it in the journal.
      </p>
      <label className="block border border-dashed border-[#f0d24b]/40 bg-white/5 px-4 py-10 text-center text-sm text-paper/70">
        Drop a photograph or click to choose
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onImage(e.target.files?.[0])}
        />
      </label>
      {cover ? (
        <img src={cover} alt="" className="max-h-[28rem] w-full object-contain bg-white/5" />
      ) : null}
      <label className="block text-xs uppercase tracking-[0.16em] text-paper/45">
        Optional video
        <input
          type="file"
          accept="video/*"
          className="mt-2 block w-full text-sm"
          onChange={(e) => onVideo(e.target.files?.[0])}
        />
      </label>
      <input
        placeholder="Or paste a video link"
        value={video.startsWith("data:") ? "" : video}
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
          placeholder="Price KES"
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
        disabled={save.isPending}
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
                setMedia(await readVideoFile(file));
              } else {
                setType("image");
                setMedia(await compressImageFile(file));
              }
            } catch (error) {
              setErr(error instanceof Error ? error.message : "Could not read file.");
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
      {err ? <p className="text-sm text-[#f0d24b]">{err}</p> : null}
      <button
        type="submit"
        className="border border-[#f0d24b] px-6 py-3 text-[0.7rem] tracking-[0.2em] uppercase text-[#f0d24b]"
      >
        {save.isPending ? "Pinning…" : "Pin to journal"}
      </button>
    </form>
  );
}
