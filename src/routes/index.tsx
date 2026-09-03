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
          currency: p.currency,
          sold_out: p.sold_out,
        }));

  return (
    <SiteShell settings={data.settings}>
      <HeroSlider pieces={pieces} />
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Season</p>
            <h2 className="display mt-3 text-5xl md:text-7xl">The rack</h2>
          </div>
          <Link to="/collection" className="eyebrow text-ink">
            All looks
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-12">
          {pieces.slice(0, 6).map((piece, index) => (
            <motion.div
              key={piece.slug + index}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className={index % 3 === 0 ? "md:col-span-7" : "md:col-span-5"}
            >
              <Link to="/piece/$slug" params={{ slug: piece.slug }}>
                <div className="bg-paper-2">
                  <img
                    src={piece.cover_url}
                    alt={piece.title}
                    className="w-full object-contain"
                  />
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <p className="display text-2xl">{piece.title}</p>
                    <p className="text-sm text-mute">{piece.subtitle}</p>
                  </div>
                  {piece.sold_out ? <span className="eyebrow">Reserved</span> : null}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="border-t border-line bg-paper text-ink">
        <div className="mx-auto grid max-w-6xl gap-16 px-5 py-24 md:grid-cols-2">
          <div>
            <p className="eyebrow">Maison</p>
            <h2 className="display mt-4 text-5xl text-ink">Cut close.<br />Held still.</h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-mute">
              {data.settings?.about}
            </p>
          </div>
          <div>
            <CallbackForm />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
