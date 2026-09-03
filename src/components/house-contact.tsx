import { useState } from "react";
import { Copy, Phone } from "lucide-react";
import type { Settings } from "@/lib/server/boutique";
import type { HouseNotes } from "@/lib/firebase/catalog";
import { readHouseBook } from "@/lib/house-book";
import { InstagramMark, WhatsAppMark } from "@/components/brand-marks";

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
  const local = readHouseBook();
  const whatsapp = notes?.whatsapp || settings?.whatsapp || local.whatsapp;
  const phone = notes?.phone || settings?.phone || local.phone;
  const payment = notes?.payment_phone || settings?.payment_phone || local.payment_phone;
  const digits = whatsapp.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return {
    tagline: notes?.tagline || settings?.tagline || local.tagline,
    about: notes?.about || settings?.about || local.about,
    whatsapp,
    phone,
    payment,
    instagram: notes?.instagram || settings?.instagram || local.instagram,
    waLink: digits ? `https://wa.me/${digits}` : "",
  };
}

export function HouseContact({
  house,
}: {
  house: ReturnType<typeof mergeHouse>;
}) {
  const [copied, setCopied] = useState(false);
  if (!house.whatsapp && !house.phone && !house.payment && !house.instagram) return null;

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
      {house.instagram ? (
        <a href={house.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-ink">
          <InstagramMark className="h-4 w-4" />
          Instagram
        </a>
      ) : null}
    </div>
  );
}
