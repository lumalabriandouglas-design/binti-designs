import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { CallbackForm } from "@/components/callback-form";
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
      <section className="mx-auto grid max-w-6xl gap-16 px-5 py-16 md:grid-cols-2">
        <div>
          <p className="eyebrow">Maison</p>
          <h1 className="display mt-3 text-6xl md:text-7xl">The house</h1>
          <p className="mt-8 max-w-md text-sm leading-relaxed text-ink-soft">{settings?.about}</p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-mute">
            A private floor in Kampala. The Drapé Collective showroom stays
            where it is. New work travels there only when she sends it.
          </p>
        </div>
        {cover ? (
          <img src={cover} alt="" className="w-full bg-paper-2 object-contain" />
        ) : null}
      </section>
      <section className="border-t border-line">
        <div className="mx-auto max-w-xl px-5 py-16">
          <CallbackForm />
        </div>
      </section>
    </SiteShell>
  );
}
