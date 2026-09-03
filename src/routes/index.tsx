import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { HeroSlider } from "@/components/hero-slider";
import { CallbackForm } from "@/components/callback-form";
import { getPublicCatalog } from "@/lib/server/boutique";

export const Route = createFileRoute("/")({
  loader: () => getPublicCatalog(),
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  const pieces = data.pieces ?? [];
  const settings = data.settings;

  return (
    <SiteShell settings={settings}>
      <HeroSlider pieces={pieces} />
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">This season</p>
            <h2 className="display mt-2 text-5xl md:text-6xl">The rack</h2>
          </div>
          <Link to="/collection" className="eyebrow text-ink">
            All looks
          </Link>
        </div>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {pieces.slice(0, 6).map((piece) => (
            <Link key={piece.id} to="/piece/$slug" params={{ slug: piece.slug }} className="group">
              <div className="bg-paper-2">
                <img
                  src={piece.cover_url}
                  alt={`${piece.title} ${piece.subtitle}`}
                  className="w-full object-contain"
                />
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <div>
                  <p>{piece.title}</p>
                  <p className="text-sm text-mute">{piece.subtitle}</p>
                </div>
                {piece.sold_out ? (
                  <span className="text-xs tracking-[0.16em] uppercase text-gold">Reserved</span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
          <div>
            <p className="eyebrow">Maison</p>
            <h2 className="display mt-3 text-5xl">Cut close. Held still.</h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-mute">
              {settings?.about}
            </p>
            <Link to="/atelier" className="mt-8 inline-block eyebrow text-ink">
              The house
            </Link>
          </div>
          <CallbackForm />
        </div>
      </section>
    </SiteShell>
  );
}
