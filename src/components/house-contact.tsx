import { useState } from "react";
import { Copy, Phone } from "lucide-react";
import type { Settings } from "@/lib/server/boutique";
import type { HouseNotes } from "@/lib/firebase/catalog";
import { readHouseBook } from "@/lib/house-book";
import { InstagramMark, TikTokMark, WhatsAppMark } from "@/components/brand-marks";

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
  tiktok: string;
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
    tiktok: notes?.tiktok || local.tiktok,
    waLink: digits ? `https://wa.me/${digits}` : "",
  };
}

export type PieceHint = { title: string; subtitle?: string; slug?: string };

export function pieceMessage(piece?: PieceHint) {
  if (!piece?.title) return "Hello BINTI DESIGNS —";
  const name = [piece.title, piece.subtitle].filter(Boolean).join(" ");
  const url = piece.slug ? ` https://binti-designs.vercel.app/piece/${piece.slug}` : "";
  return `Hello BINTI DESIGNS — I am writing about ${name}.${url}`;
}

function instagramHandle(url: string) {
  const match = url.match(/instagram\.com\/([^/?#]+)/i) || url.match(/^@?([a-z0-9._]+)$/i);
  return match?.[1] || "";
}

export function HouseContact({
  house,
  piece,
}: {
  house: ReturnType<typeof mergeHouse>;
  piece?: PieceHint;
}) {
  const [copied, setCopied] = useState(false);
  const [igNote, setIgNote] = useState("");
  if (!house.whatsapp && !house.phone && !house.payment && !house.instagram) return null;

  const opener = pieceMessage(piece);
  const waHref = house.waLink
    ? `${house.waLink}?text=${encodeURIComponent(opener)}`
    : "";
  const handle = instagramHandle(house.instagram);
  const igHref = handle ? `https://ig.me/m/${handle}` : house.instagram;

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

  async function openInstagram() {
    try {
      await navigator.clipboard.writeText(opener);
      setIgNote("Opening line copied. Paste it in the chat.");
    } catch {
      setIgNote("");
    }
  }

  return (
    <div className="space-y-3 text-sm">
      {waHref ? (
        <a href={waHref} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-ink">
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
      {igHref ? (
        <a
          href={igHref}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-ink"
          onClick={() => void openInstagram()}
        >
          <InstagramMark className="h-4 w-4" />
          Instagram
        </a>
      ) : null}
      {igNote ? <p className="text-xs text-mute">{igNote}</p> : null}
      {house.tiktok ? (
        <a href={house.tiktok} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-ink">
          <TikTokMark className="h-4 w-4" />
          TikTok
        </a>
      ) : null}
    </div>
  );
}
