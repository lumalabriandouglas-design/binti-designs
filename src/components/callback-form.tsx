import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HouseContact, mergeHouse } from "@/components/house-contact";
import { getHouseNotes, sendInquiry } from "@/lib/firebase/catalog";
import { getPublicCatalog } from "@/lib/server/boutique";
import { useHouseUser } from "@/lib/firebase/session";

export function CallbackForm({ pieceSlug = "" }: { pieceSlug?: string }) {
  const notes = useQuery({ queryKey: ["house-notes"], queryFn: getHouseNotes });
  const cat = useQuery({ queryKey: ["catalog"], queryFn: () => getPublicCatalog() });
  const { user } = useHouseUser();
  const house = mergeHouse(cat.data?.settings, notes.data);
  const [name, setName] = useState(user?.displayName ?? "");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
        Message her now, or leave your number. She sees the name and the
        account on her desk.
      </p>
      <div className="mt-6">
        {waHref || house.phone || house.payment ? (
          <HouseContact house={{ ...house, waLink: waHref || house.waLink }} />
        ) : null}
      </div>
      {sent ? (
        <p className="mt-8 text-sm text-mute">Received. Natasha has your number.</p>
      ) : (
        <form
          className="mt-8 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await sendInquiry({
                name: name.trim() || user?.displayName || "Client",
                phone: phone.trim(),
                note: note.trim(),
                pieceSlug,
                email: user?.primaryEmail || "",
                accountId: user?.id || "",
                accountName: user?.displayName || user?.primaryEmail || "",
              });
              setSent(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not leave the number.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="text-[0.62rem] tracking-[0.2em] uppercase text-mute">Leave a number</p>
          <input
            required
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-line bg-paper px-3 py-3 text-sm outline-none"
          />
          <input
            required
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-line bg-paper px-3 py-3 text-sm outline-none"
          />
          <textarea
            placeholder="The look, and when to call"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-24 w-full border border-line bg-paper px-3 py-3 text-sm outline-none"
          />
          {user?.primaryEmail ? (
            <p className="text-xs text-mute">Signed in as {user.primaryEmail}</p>
          ) : (
            <p className="text-xs text-mute">No account needed. Sign in only if you want it attached.</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="bg-ink px-6 py-3 text-xs tracking-[0.2em] uppercase text-paper disabled:opacity-40"
          >
            {busy ? "Sending…" : "Leave number"}
          </button>
          {error ? <p className="text-sm text-mute">{error}</p> : null}
        </form>
      )}
    </div>
  );
}
