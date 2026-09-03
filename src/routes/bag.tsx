import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Phone } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { getPublicCatalog } from "@/lib/server/boutique";
import { getHouseNotes } from "@/lib/firebase/catalog";
import { mergeHouse } from "@/components/house-contact";
import { useBag } from "@/lib/bag";
import { formatMoney } from "@/lib/utils";

export const Route = createFileRoute("/bag")({ component: BagPage });

function WhatsAppMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.02m-7.01 15.24h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.24 8.23m4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.17-.48-.29"
      />
    </svg>
  );
}

export function BagPage() {
  const cat = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });
  const houseBook = useQuery({ queryKey: ["house-notes"], queryFn: getHouseNotes });
  const house = mergeHouse(cat.data?.settings, houseBook.data);
  const items = useBag((s) => s.items);
  const setQty = useBag((s) => s.setQty);
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
