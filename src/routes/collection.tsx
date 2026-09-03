import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { SiteShell } from "@/components/site-shell";
import { getPublicCatalog } from "@/lib/server/boutique";
import { listLooks } from "@/lib/firebase/catalog";
import { formatMoney } from "@/lib/utils";

export const Route = createFileRoute("/collection")({
  loader: () => getPublicCatalog(),
  component: Collection,
});

function Collection() {
  const data = Route.useLoaderData();
  const firestore = useQuery({ queryKey: ["looks"], queryFn: listLooks });
  const pieces =
    firestore.data && firestore.data.length
      ? firestore.data
      : (data.pieces ?? []);

  return (
    <SiteShell settings={data.settings}>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="eyebrow">Showroom</p>
        <h1 className="display mt-3 text-6xl md:text-8xl">Collection</h1>
        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-12">
          {pieces.map((piece, index) => (
            <motion.div
              key={piece.slug + index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={index % 2 === 0 ? "md:col-span-7" : "md:col-span-5 md:mt-16"}
            >
              <Link to="/piece/$slug" params={{ slug: piece.slug }}>
                <div className="bg-paper-2">
                  <img src={piece.cover_url} alt={piece.title} className="w-full object-contain" />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <div>
                    <p className="display text-2xl">{piece.title}</p>
                    <p className="text-sm text-mute">{piece.subtitle}</p>
                  </div>
                  <p className="text-sm text-mute">
                    {"sold_out" in piece && piece.sold_out
                      ? "Reserved"
                      : piece.price_cents
                        ? formatMoney(piece.price_cents, piece.currency)
                        : "Inquiry"}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
