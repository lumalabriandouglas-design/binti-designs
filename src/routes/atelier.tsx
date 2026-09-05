import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { CallbackForm } from "@/components/callback-form";
import { HouseContact, mergeHouse } from "@/components/house-contact";
import { getPublicCatalog } from "@/lib/server/boutique";
import { getHouseNotes } from "@/lib/firebase/catalog";

export const Route = createFileRoute("/atelier")({
  loader: () => getPublicCatalog(),
  component: Atelier,
});

function Atelier() {
  const data = Route.useLoaderData();
  const notes = useQuery({ queryKey: ["house-notes"], queryFn: getHouseNotes });
  const house = mergeHouse(data.settings, notes.data);
  const cover = data.pieces[0]?.cover_url;

  return (
    <SiteShell settings={data.settings}>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-2 md:gap-16 md:px-10 md:py-24">
        <div>
          <p className="eyebrow">Maison</p>
          <h1 className="mt-6 text-4xl sm:text-6xl md:text-7xl">The house</h1>
          <p className="mt-8 max-w-md text-sm leading-relaxed text-ink-soft">{house.about}</p>
          <div className="mt-10">
            <HouseContact house={house} />
          </div>
        </div>
        {cover ? <img src={cover} alt="" className="w-full bg-paper-2 object-contain" /> : null}
      </section>
      <section className="border-t border-line">
        <div className="mx-auto max-w-xl px-5 py-16 sm:px-8 sm:py-24">
          <CallbackForm />
        </div>
      </section>
    </SiteShell>
  );
}
