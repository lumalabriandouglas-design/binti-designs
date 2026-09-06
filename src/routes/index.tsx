import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DrapeReveal } from "@/components/drape-reveal";
import { SiteShell } from "@/components/site-shell";
import { HeroSlider } from "@/components/hero-slider";
import { CallbackForm } from "@/components/callback-form";
import { HouseContact, mergeHouse } from "@/components/house-contact";
import { LookFrames, lookFrames } from "@/components/look-frames";
import { getPublicCatalog } from "@/lib/server/boutique";
import { getHouseNotes, listPublicLooks } from "@/lib/firebase/catalog";

export const Route = createFileRoute("/")({
  loader: () => getPublicCatalog(),
  component: Home,
});

const RACK = 7;

function Home() {
  const data = Route.useLoaderData();
  const firestore = useQuery({ queryKey: ["looks-public"], queryFn: listPublicLooks });
  const notes = useQuery({ queryKey: ["house-notes"], queryFn: getHouseNotes });
  const house = mergeHouse(data.settings, notes.data);
  const pieces = firestore.data ?? [];
  const rack = pieces.slice(0, RACK);

  return (
    <SiteShell settings={data.settings} overlay>
      <DrapeReveal house="BINTI DESIGNS">
      <HeroSlider pieces={rack} />
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24 md:px-10 md:py-28">
        <div className="mb-12 flex items-end justify-between gap-6 sm:mb-20">
          <h2 className="text-3xl sm:text-5xl md:text-7xl">Now on the rack</h2>
          {pieces.length > RACK ? (
            <Link to="/collection" className="eyebrow text-ink">
              All looks
            </Link>
          ) : null}
        </div>
        {rack.length ? (
        <div className="space-y-20 md:space-y-28">
          {rack.map((piece, index) => (
            <motion.div
              key={piece.slug}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`grid items-end gap-8 md:grid-cols-2 ${index % 2 ? "md:[&>a]:order-2 md:[&>div:first-child]:order-2" : ""}`}
            >
              <LookFrames
                slug={piece.slug}
                alt={piece.title}
                urls={lookFrames(piece.cover_url, piece.gallery)}
              />
              <div className="pb-4">
                <p className="eyebrow">{piece.sold_out ? "Reserved" : "Available"}</p>
                <h3 className="display mt-4 text-3xl sm:text-4xl md:text-6xl">{piece.title}</h3>
                <p className="mt-3 text-mute">{piece.subtitle}</p>
                <Link
                  to="/piece/$slug"
                  params={{ slug: piece.slug }}
                  className="mt-8 inline-block text-xs tracking-[0.24em] uppercase"
                >
                  View
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        ) : (
          <p className="max-w-md text-sm leading-relaxed text-mute">
            The rack is being dressed. WhatsApp the house if you want a look before it hangs.
          </p>
        )}
      </section>
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 md:grid-cols-2 md:gap-20 md:px-10 md:py-28">
          <div>
            <p className="eyebrow">House</p>
            <h2 className="mt-6 text-3xl sm:text-5xl md:text-7xl">A private floor in Kampala.</h2>
            <p className="mt-8 max-w-md text-sm leading-relaxed text-mute">{house.about || data.settings?.about}</p>
            <div className="mt-8">
              <HouseContact house={house} />
            </div>
          </div>
          <CallbackForm />
        </div>
      </section>
      </DrapeReveal>
    </SiteShell>
  );
}
