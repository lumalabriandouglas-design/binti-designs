import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { SiteShell } from "@/components/site-shell";
import { getPublicCatalog } from "@/lib/server/boutique";
import { listPublicLooks } from "@/lib/firebase/catalog";
import { formatMoney } from "@/lib/utils";

export const Route = createFileRoute("/collection")({
  loader: () => getPublicCatalog(),
  component: Collection,
});

const FRAMES = [
  "md:col-span-7 md:pr-10",
  "md:col-span-5 md:mt-28",
  "md:col-span-5 md:mt-8",
  "md:col-span-7 md:mt-36 md:pl-8",
  "md:col-span-8 md:col-start-3 md:mt-10",
  "md:col-span-6 md:mt-24",
];

function Collection() {
  const data = Route.useLoaderData();
  const firestore = useQuery({ queryKey: ["looks-public"], queryFn: listPublicLooks });
  const pieces = firestore.isFetched ? (firestore.data ?? []) : [];

  return (
    <SiteShell settings={data.settings}>
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24 md:px-10 md:py-32">
        <p className="eyebrow">Showroom</p>
        <h1 className="mt-6 max-w-3xl text-4xl sm:text-6xl md:text-8xl">Collection</h1>
        <p className="mt-8 max-w-md text-sm leading-relaxed text-mute">
          Looks as worn. Space left around the garment so the cut can speak.
        </p>
        <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-16 sm:mt-24 md:grid-cols-12 md:gap-y-8">
          {pieces.length ? pieces.map((piece, index) => (
            <motion.div
              key={piece.slug + index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={FRAMES[index % FRAMES.length]}
            >
              <Link to="/piece/$slug" params={{ slug: piece.slug }}>
                <div className="bg-paper-2">
                  <img
                    src={piece.cover_url}
                    alt={piece.title}
                    className="w-full object-contain"
                  />
                </div>
                <div className="mt-7 flex items-baseline justify-between gap-6">
                  <div>
                    <h2 className="text-3xl md:text-4xl">{piece.title}</h2>
                    <p className="mt-2 text-sm text-mute">{piece.subtitle}</p>
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
          )) : (
            <p className="col-span-full max-w-md text-sm leading-relaxed text-mute">
              Nothing on the floor yet. When Natasha hangs a look, it will live here.
            </p>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
