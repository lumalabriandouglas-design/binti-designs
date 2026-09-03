import { useQuery } from "@tanstack/react-query";
import { HouseContact, mergeHouse } from "@/components/house-contact";
import { getHouseNotes } from "@/lib/firebase/catalog";
import { getPublicCatalog } from "@/lib/server/boutique";

export function CallbackForm({ pieceSlug = "" }: { pieceSlug?: string }) {
  const notes = useQuery({ queryKey: ["house-notes"], queryFn: getHouseNotes });
  const cat = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });
  const house = mergeHouse(cat.data?.settings, notes.data);
  const waHref = house.waLink
    ? `${house.waLink}?text=${encodeURIComponent(
        pieceSlug
          ? `Hello BINTI DESIGNS — I am writing about ${pieceSlug}.`
          : "Hello BINTI DESIGNS — I would like to ask about a piece.",
      )}`
    : "";

  return (
    <div>
      <p className="eyebrow">Reach the house</p>
      <h3 className="display mt-3 text-3xl">Write or call</h3>
      <p className="mt-3 text-sm leading-relaxed text-mute">
        No waiting on a callback. Use the number Natasha put in her studio.
      </p>
      <div className="mt-6">
        {waHref || house.phone || house.payment ? (
          <HouseContact house={{ ...house, waLink: waHref || house.waLink }} />
        ) : (
          <p className="text-sm text-mute">Numbers appear here once she saves them in Studio.</p>
        )}
      </div>
    </div>
  );
}
