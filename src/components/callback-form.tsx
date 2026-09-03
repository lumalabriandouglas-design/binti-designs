import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { requestCallback } from "@/lib/server/boutique";

export function CallbackForm({ pieceSlug = "" }: { pieceSlug?: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const save = useMutation({
    mutationFn: () =>
      requestCallback({
        data: { name, phone, note, piece_slug: pieceSlug },
      }),
  });

  if (save.isSuccess) {
    return (
      <p className="text-sm leading-relaxed text-mute">
        Received. The house will call you back.
      </p>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <p className="eyebrow">Private request</p>
      <h3 className="display text-3xl">Ask for a call</h3>
      <p className="text-sm leading-relaxed text-mute">
        Leave a number. No account required.
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
        placeholder="When should we call, and which look?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-24 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none"
      />
      <button
        type="submit"
        disabled={save.isPending}
        className="bg-ink px-6 py-3 text-xs tracking-[0.22em] uppercase text-paper"
      >
        {save.isPending ? "Sending…" : "Request a call"}
      </button>
      {save.isError ? (
        <p className="text-sm text-mute">Could not send. Check the number.</p>
      ) : null}
    </form>
  );
}
