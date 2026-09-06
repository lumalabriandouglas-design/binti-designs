import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Phone } from "lucide-react";
import { WhatsAppMark } from "@/components/brand-marks";
import { SiteShell } from "@/components/site-shell";
import { getPublicCatalog } from "@/lib/server/boutique";
import { getHouseNotes } from "@/lib/firebase/catalog";
import { mergeHouse } from "@/components/house-contact";
import { useBag } from "@/lib/bag";
import { formatMoney } from "@/lib/utils";

export const Route = createFileRoute("/bag")({ component: BagPage });

export function BagPage() {
  const cat = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });
  const houseBook = useQuery({ queryKey: ["house-notes"], queryFn: getHouseNotes });
  const house = mergeHouse(cat.data?.settings, houseBook.data);
  const items = useBag((s) => s.items);
  const setQty = useBag((s) => s.setQty);
  const removeSlug = useBag((s) => s.removeSlug);
  const total = items.reduce((n, i) => n + i.price_cents * i.qty, 0);
  const [copied, setCopied] = useState(false);

  const lines = items.map((i) => `• ${i.title} ${i.subtitle} ×${i.qty}`).join("%0A");
  const waText = `Hello BINTI DESIGNS — I would like to reserve:%0A${lines}%0A%0ATotal: ${formatMoney(total)}`;
  const waHref = house.waLink ? `${house.waLink}?text=${waText}` : "";

  async function copyPay() {
    if (!house.payment) return;
    try {
      await navigator.clipboard.writeText(house.payment);
    } catch {
      const field = document.createElement("textarea");
      field.value = house.payment;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <SiteShell settings={cat.data?.settings}>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="eyebrow">Reserve</p>
          <h1 className="display mt-3 text-6xl">Bag</h1>
          {items.length === 0 ? (
            <p className="mt-8 text-sm text-mute">
              The bag is empty.{" "}
              <Link to="/collection" className="text-ink">
                Walk the collection
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-10 divide-y divide-line">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-5">
                  <img src={item.cover_url} alt="" className="h-36 w-24 object-contain bg-paper-2" />
                  <div className="flex-1">
                    <p>{item.title}</p>
                    <p className="text-sm text-mute">{item.subtitle}</p>
                    <p className="mt-2 text-sm">
                      {formatMoney(item.price_cents * item.qty, item.currency)}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-sm">
                      <button type="button" onClick={() => setQty(item.id, item.qty - 1)}>
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button type="button" onClick={() => setQty(item.id, item.qty + 1)}>
                        +
                      </button>
                      <button
                        type="button"
                        className="ml-4 text-[10px] uppercase tracking-[0.16em] text-mute"
                        onClick={() => removeSlug(item.slug)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <aside className="border border-line p-6">
          <p className="eyebrow">Reach the house</p>
          <p className="mt-3 text-sm leading-relaxed text-mute">
            Message or call Natasha directly. Tap the payment number to copy it
            into Mobile Money.
          </p>
          <p className="mt-6 text-lg">{formatMoney(total)}</p>
          <div className="mt-8 space-y-3">
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 border border-line px-4 py-3 text-sm"
              >
                <WhatsAppMark className="h-5 w-5 text-[#25D366]" />
                <span>
                  WhatsApp
                  <span className="mt-0.5 block text-xs text-mute">{house.whatsapp}</span>
                </span>
              </a>
            ) : (
              <p className="text-sm text-mute">WhatsApp number is not on the house book yet.</p>
            )}
            {house.phone ? (
              <a
                href={`tel:${house.phone}`}
                className="flex items-center gap-3 border border-line px-4 py-3 text-sm"
              >
                <Phone className="h-5 w-5" strokeWidth={1.4} />
                <span>
                  Call
                  <span className="mt-0.5 block text-xs text-mute">{house.phone}</span>
                </span>
              </a>
            ) : null}
            {house.payment ? (
              <button
                type="button"
                onClick={() => void copyPay()}
                className="flex w-full items-center gap-3 border border-line px-4 py-3 text-left text-sm"
              >
                <Copy className="h-5 w-5" strokeWidth={1.4} />
                <span>
                  {copied ? "Payment number copied" : "Copy payment number"}
                  <span className="mt-0.5 block text-xs text-mute">{house.payment}</span>
                </span>
              </button>
            ) : null}
          </div>
        </aside>
      </section>
    </SiteShell>
  );
}
