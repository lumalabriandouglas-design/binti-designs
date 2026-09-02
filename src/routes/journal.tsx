import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { getPublicCatalog } from "@/lib/server/boutique";

export const Route = createFileRoute("/journal")({
  loader: () => getPublicCatalog(),
  component: Journal,
});

function Journal() {
  const data = Route.useLoaderData();
  const entries = data.journal ?? [];
  const fromLooks = (data.pieces ?? [])
    .filter((p) => p.caption)
    .map((p) => ({
      id: `p-${p.id}`,
      title: `${p.title} ${p.subtitle}`.trim(),
      caption: p.caption,
      media_url: p.cover_url,
      media_type: p.video_url ? "video" : "image",
      video: p.video_url,
    }));

  const feed = [
    ...entries.map((e) => ({
      ...e,
      video: e.media_type === "video" ? e.media_url : "",
    })),
    ...fromLooks,
  ];

  return (
    <SiteShell settings={data.settings}>
      <section className="mx-auto max-w-3xl px-5 py-16">
        <p className="eyebrow">Notes</p>
        <h1 className="display mt-3 text-6xl">Journal</h1>
        <p className="mt-4 text-sm text-mute">
          Captions she writes on the work — stills and moving image, in her voice.
        </p>
        <div className="mt-12 space-y-16">
          {feed.length === 0 ? (
            <p className="text-mute">The first note has not been pinned yet.</p>
          ) : (
            feed.map((entry) => (
              <article key={entry.id}>
                {entry.video ? (
                  <video src={entry.video} controls playsInline className="w-full bg-ink" />
                ) : (
                  <img
                    src={entry.media_url}
                    alt={entry.title}
                    className="w-full object-contain"
                  />
                )}
                {entry.title ? <p className="mt-4 text-sm">{entry.title}</p> : null}
                {entry.caption ? (
                  <p className="mt-2 font-[family-name:var(--font-display)] text-2xl italic leading-snug">
                    {entry.caption}
                  </p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </SiteShell>
  );
}
