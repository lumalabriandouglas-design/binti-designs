import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { SiteShell } from "@/components/site-shell";
import { HeroSlider } from "@/components/hero-slider";
import { CallbackForm } from "@/components/callback-form";
import { getPublicCatalog } from "@/lib/server/boutique";
import { listLooks } from "@/lib/firebase/catalog";

export const Route = createFileRoute("/")({
  loader: () => getPublicCatalog(),
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  const firestore = useQuery({ queryKey: ["looks"], queryFn: listLooks });
  const pieces =
    firestore.data && firestore.data.length
      ? firestore.data
      : (data.pieces ?? []).map((p) => ({
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle,
          cover_url: p.cover_url,
          price_cents: p.price_cents,
          currency: p.currency || "UGX",
          sold_out: p.sold_out,
        }));

  return (
    <SiteShell settings={data.settings}>
      <HeroSlider pieces={pieces} />
      <section className="border-t border-line px-5 py-20">
        <div className="mb-12 flex items-end justify-between">
          <h2 className="display text-5xl">Now on the rack</h2>
          <Link to="/collection" className="text-xs tracking-[0.24em] uppercase">
            All looks
          </Link>
        </div>
        <div className="space-y-20">
          {pieces.slice(0, 4).map((piece, index) => (
            <motion.div
              key={piece.slug + index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`grid items-end gap-8 md:grid-cols-2 ${index % 2 ? "md:[&>a]:order-2" : ""}`}
            >
              <Link to="/piece/$slug" params={{ slug: piece.slug }} className="bg-paper-2">
                <img src={piece.cover_url} alt={piece.title} className="w-full object-contain" />
              </Link>
              <div className="pb-4">
                <p className="eyebrow">{piece.sold_out ? "Reserved" : "Available"}</p>
                <h3 className="display mt-4 text-4xl md:text-6xl">{piece.title}</h3>
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
      </section>
      <section className="border-t border-line">
        <div className="grid gap-16 px-5 py-20 md:grid-cols-2">
          <div>
            <p className="eyebrow">House</p>
            <h2 className="display mt-4 text-5xl">A private floor in Kampala.</h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-mute">{data.settings?.about}</p>
          </div>
          <CallbackForm />
        </div>
      </section>
    </SiteShell>
  );
}
