import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { getPublicCatalog } from "@/lib/server/boutique";
import { formatMoney } from "@/lib/utils";

export const Route = createFileRoute("/collection")({
  loader: () => getPublicCatalog(),
  component: Collection,
});

function Collection() {
  const data = Route.useLoaderData();
  const pieces = data.pieces ?? [];

  return (
    <SiteShell settings={data.settings}>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="eyebrow">Showroom</p>
        <h1 className="display mt-3 text-6xl">Collection</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-mute">
          A quiet rack. Each look is photographed as worn — then kept here until
          she replaces it with the next sitting.
        </p>
        <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2">
          {pieces.map((piece) => (
            <Link key={piece.id} to="/piece/$slug" params={{ slug: piece.slug }} className="group">
              <div className="bg-paper-2">
                <img
                  src={piece.cover_url}
                  alt={piece.title}
                  className="w-full object-contain"
                />
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <div>
                  <p>{piece.title}</p>
                  <p className="text-sm text-mute">{piece.subtitle || piece.category}</p>
                </div>
                <p className="text-sm text-mute">
                  {piece.price_cents ? formatMoney(piece.price_cents, piece.currency) : "Inquiry"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
