import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { getPublicCatalog } from "@/lib/server/boutique";

export const Route = createFileRoute("/atelier")({
  loader: () => getPublicCatalog(),
  component: Atelier,
});

function Atelier() {
  const data = Route.useLoaderData();
  const settings = data.settings;
  const cover = data.pieces[0]?.cover_url;

  return (
    <SiteShell settings={settings}>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-2">
        <div>
          <p className="eyebrow">The house</p>
          <h1 className="display mt-3 text-6xl">Atelier</h1>
          <p className="mt-8 max-w-md text-sm leading-relaxed text-ink-soft">{settings?.about}</p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-mute">
            BINTI DESIGNS is her own floor — separate from the Drapé Collective
            showroom, which stays exactly where it is. New work can travel there
            when she chooses, never the other way around.
          </p>
        </div>
        {cover ? (
          <img
            src={cover}
            alt="Atelier look"
            className="w-full bg-paper-2 object-contain"
          />
        ) : null}
      </section>
    </SiteShell>
  );
}
