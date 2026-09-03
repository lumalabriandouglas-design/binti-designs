import { useState } from "react";
import { sendInquiry } from "@/lib/firebase/catalog";
import { requestCallback } from "@/lib/server/boutique";

export function CallbackForm({ pieceSlug = "" }: { pieceSlug?: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (sent) {
    return (
      <p className="text-sm leading-relaxed text-mute">
        Received. The house will call you back.
      </p>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          try {
            await sendInquiry({ name, phone, note, pieceSlug });
          } catch {
            await requestCallback({
              data: { name, phone, note, piece_slug: pieceSlug },
            });
          }
          setSent(true);
        } catch {
          setError("Could not send. Check the number.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="eyebrow">Private request</p>
      <h3 className="display text-3xl">Leave a request</h3>
      <p className="text-sm leading-relaxed text-mute">
        A number is enough. No account required.
      </p>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border border-line bg-transparent px-3 py-3 text-sm outline-none"
      />
      <input
        required
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full border border-line bg-transparent px-3 py-3 text-sm outline-none"
      />
      <textarea
        placeholder="The look, and when to call"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-24 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none"
      />
      <button
        type="submit"
        disabled={busy}
        className="bg-ink px-6 py-3 text-xs tracking-[0.22em] uppercase text-paper"
      >
        {busy ? "Sending…" : "Send request"}
      </button>
      {error ? <p className="text-sm text-mute">{error}</p> : null}
    </form>
  );
}
