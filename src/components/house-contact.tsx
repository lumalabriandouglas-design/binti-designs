import { useState } from "react";
import { Copy, Phone } from "lucide-react";
import type { Settings } from "@/lib/server/boutique";
import type { HouseNotes } from "@/lib/firebase/catalog";

export function mergeHouse(
  settings?: Settings | null,
  notes?: HouseNotes | null,
): {
  tagline: string;
  about: string;
  whatsapp: string;
  phone: string;
  payment: string;
  instagram: string;
  waLink: string;
} {
  const whatsapp = notes?.whatsapp || settings?.whatsapp || "";
  const phone = notes?.phone || settings?.phone || "";
  const payment = notes?.payment_phone || settings?.payment_phone || "";
  const digits = whatsapp.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return {
    tagline: notes?.tagline || settings?.tagline || "Cut. Drape. Belong.",
    about: notes?.about || settings?.about || "",
    whatsapp,
    phone,
    payment,
    instagram: notes?.instagram || settings?.instagram || "",
    waLink: digits ? `https://wa.me/${digits}` : "",
  };
}

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

export function HouseContact({
  house,
}: {
  house: ReturnType<typeof mergeHouse>;
}) {
  const [copied, setCopied] = useState(false);
  if (!house.whatsapp && !house.phone && !house.payment) return null;

  async function copyPay() {
    if (!house.payment) return;
    try {
      await navigator.clipboard.writeText(house.payment);
    } catch {
      /* ignore */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3 text-sm">
      {house.waLink ? (
        <a href={house.waLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-ink">
          <WhatsAppMark className="h-4 w-4 text-[#25D366]" />
          {house.whatsapp}
        </a>
      ) : null}
      {house.phone ? (
        <a href={`tel:${house.phone}`} className="flex items-center gap-2 text-ink">
          <Phone className="h-4 w-4" strokeWidth={1.4} />
          {house.phone}
        </a>
      ) : null}
      {house.payment ? (
        <button type="button" onClick={() => void copyPay()} className="flex items-center gap-2 text-ink">
          <Copy className="h-4 w-4" strokeWidth={1.4} />
          {copied ? "Copied" : house.payment}
        </button>
      ) : null}
    </div>
  );
}
