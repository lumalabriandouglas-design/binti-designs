import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { getPublicCatalog, placeInquiry } from "@/lib/server/boutique";
import { useBag } from "@/lib/bag";
import { formatMoney } from "@/lib/utils";

export const Route = createFileRoute("/bag")({ component: BagPage });

function BagPage() {
  const cat = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });
  const items = useBag((s) => s.items);
  const setQty = useBag((s) => s.setQty);
  const clear = useBag((s) => s.clear);
  const total = items.reduce((n, i) => n + i.price_cents * i.qty, 0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState("");

  const order = useMutation({
    mutationFn: () =>
      placeInquiry({
        data: {
          guest_name: name,
          guest_phone: phone,
          guest_email: email,
          items: JSON.stringify(items),
          notes,
          total_cents: total,
        },
      }),
    onSuccess: (res) => {
      const lines = items
        .map((i) => `• ${i.title} ${i.subtitle} ×${i.qty}`)
        .join("%0A");
      const msg = `Hello BINTI DESIGNS — I would like to reserve:%0A${lines}%0A%0AName: ${name}%0APhone: ${phone}`;
      if (res.whatsapp) {
        const num = res.whatsapp.replace(/[^\d]/g, "");
        window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
      }
      clear();
      setDone(
        res.payment_phone
          ? `Inquiry #${res.id} received. Pay to ${res.payment_phone} when she confirms. Flutterwave follows.`
          : `Inquiry #${res.id} received. She will confirm the piece and payment.`,
      );
    },
  });

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
          <p className="eyebrow">Inquiry</p>
          <p className="mt-3 text-sm leading-relaxed text-mute">
            No account required. This sends the look to the atelier and opens
            WhatsApp if she has added a number. Card checkout via Flutterwave
            is wired for later.
          </p>
          <p className="mt-6 text-lg">{formatMoney(total)}</p>
          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!items.length) return;
              order.mutate();
            }}
          >
            <input
              required
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-line bg-paper px-3 py-3 text-sm outline-none"
            />
            <input
              required
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-line bg-paper px-3 py-3 text-sm outline-none"
            />
            <input
              placeholder="Email — optional"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line bg-paper px-3 py-3 text-sm outline-none"
            />
            <textarea
              placeholder="Fit notes, city, timing"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-24 w-full border border-line bg-paper px-3 py-3 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={!items.length || order.isPending}
              className="w-full bg-ink py-3 text-[0.7rem] tracking-[0.2em] uppercase text-paper disabled:opacity-40"
            >
              {order.isPending ? "Sending…" : "Send inquiry"}
            </button>
          </form>
          {done ? <p className="mt-4 text-sm text-mute">{done}</p> : null}
          {order.error ? (
            <p className="mt-4 text-sm text-mute">{String(order.error.message)}</p>
          ) : null}
        </aside>
      </section>
    </SiteShell>
  );
}
