import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { getPublicCatalog } from "@/lib/server/boutique";

export const Route = createFileRoute("/")({
  loader: () => getPublicCatalog(),
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  const pieces = data.pieces ?? [];
  const settings = data.settings;
  const featured = pieces[0];

  return (
    <SiteShell settings={settings}>
      <section className="grid bg-paper lg:grid-cols-2 lg:items-stretch">
        <div className="flex items-center justify-center bg-paper-2 px-3 py-6 lg:min-h-[88dvh] lg:px-8 lg:py-10">
          {featured ? (
            <img
              src={featured.cover_url}
              alt={featured.title}
              className="mx-auto h-auto w-auto max-h-[82dvh] max-w-full"
            />
          ) : null}
        </div>
        <div className="flex flex-col justify-end px-6 py-12 lg:px-14 lg:py-20">
          <p className="eyebrow">East African atelier</p>
          <h1 className="display mt-5 text-6xl md:text-8xl">
            BINTI
            <br />
            DESIGNS
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-mute">
            Clothes that keep their line in hard light. Cut close. Draped once.
            Meant to be worn, not explained.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/collection"
              className="bg-ink px-6 py-3 text-[0.7rem] tracking-[0.22em] uppercase text-paper"
            >
              Enter the showroom
            </Link>
            <Link
              to="/atelier"
              className="border border-line px-6 py-3 text-[0.7rem] tracking-[0.22em] uppercase"
            >
              The house
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">This season</p>
            <h2 className="display mt-2 text-5xl">The Wrap Set</h2>
          </div>
          <Link to="/collection" className="eyebrow text-ink">
            All looks
          </Link>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {pieces.slice(0, 3).map((piece) => (
            <Link key={piece.id} to="/piece/$slug" params={{ slug: piece.slug }} className="group">
              <div className="bg-paper-2">
                <img
                  src={piece.cover_url}
                  alt={`${piece.title} ${piece.subtitle}`}
                  className="w-full object-contain"
                />
              </div>
              <p className="mt-4 text-sm">{piece.title}</p>
              <p className="text-sm text-mute">{piece.subtitle}</p>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
