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

export function HouseContact({
  house,
}: {
  house: ReturnType<typeof mergeHouse>;
}) {
  if (!house.whatsapp && !house.phone && !house.payment) return null;
  return (
    <div className="space-y-2 text-sm leading-7 text-mute">
      {house.phone ? (
        <p>
          Call{" "}
          <a href={`tel:${house.phone}`} className="text-ink">
            {house.phone}
          </a>
        </p>
      ) : null}
      {house.waLink ? (
        <p>
          WhatsApp{" "}
          <a href={house.waLink} target="_blank" rel="noreferrer" className="text-ink">
            {house.whatsapp}
          </a>
        </p>
      ) : null}
      {house.payment ? <p>Pay to {house.payment}</p> : null}
    </div>
  );
}
