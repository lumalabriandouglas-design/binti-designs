import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPublicCatalog } from "@/lib/server/boutique";
import { getHouseNotes } from "@/lib/firebase/catalog";
import { HouseContact, mergeHouse } from "@/components/house-contact";
import { InstagramMark, TikTokMark } from "@/components/brand-marks";
import { HOUSE_BIO_LINE, publicUrl } from "@/lib/site-url";

export const Route = createFileRoute("/bio")({
  loader: () => getPublicCatalog(),
  head: () => ({
    meta: [
      { title: "BINTI DESIGNS" },
      { name: "description", content: HOUSE_BIO_LINE },
      { property: "og:title", content: "BINTI DESIGNS" },
      { property: "og:description", content: HOUSE_BIO_LINE },
      { property: "og:url", content: publicUrl("/bio") },
    ],
  }),
  component: BioPage,
});

function BioPage() {
  const data = Route.useLoaderData();
  const notes = useQuery({ queryKey: ["house-notes"], queryFn: getHouseNotes });
  const house = mergeHouse(data.settings, notes.data);

  const rows = [
    { to: "/", label: "The floor" },
    { to: "/collection", label: "Collection" },
    { to: "/reels", label: "Reels" },
    { to: "/atelier", label: "House" },
  ] as const;

  return (
    <main className="min-h-dvh bg-paper px-6 py-16 text-ink sm:px-8">
      <div className="mx-auto flex min-h-[80dvh] max-w-md flex-col justify-center">
        <p className="text-[11px] uppercase tracking-[0.32em] text-mute">Atelier</p>
        <h1 className="display mt-4 text-5xl sm:text-6xl">BINTI DESIGNS</h1>
        <p className="mt-6 text-sm leading-relaxed text-mute">{house.tagline || HOUSE_BIO_LINE}</p>
        <nav className="mt-12 space-y-1" aria-label="House links">
          {rows.map((row) => (
            <Link
              key={row.to}
              to={row.to}
              className="block border-b border-line py-4 text-2xl tracking-tight"
            >
              {row.label}
            </Link>
          ))}
        </nav>
        <div className="mt-10 space-y-4 text-sm">
          {house.instagram ? (
            <a
              href={house.instagram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3"
            >
              <InstagramMark className="h-5 w-5" />
              Instagram
            </a>
          ) : null}
          {house.tiktok ? (
            <a href={house.tiktok} target="_blank" rel="noreferrer" className="flex items-center gap-3">
              <TikTokMark className="h-5 w-5" />
              TikTok
            </a>
          ) : null}
          <HouseContact house={house} />
        </div>
      </div>
    </main>
  );
}
