import { useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { HOUSE_BIO_LINE } from "@/lib/site-url";

export function ShareLink({
  url,
  label = HOUSE_BIO_LINE,
  caption,
}: {
  url: string;
  label?: string;
  caption?: string;
}) {
  const [note, setNote] = useState("");

  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNote(done);
    } catch {
      setNote("Select the line and copy.");
    }
  }

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "BINTI DESIGNS", text: label, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    await copy(url, "Link copied.");
  }

  return (
    <div className="space-y-3">
      <p className="break-all border border-line bg-paper px-3 py-3 text-sm text-ink">{url}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 border border-ink px-4 py-3 text-[11px] uppercase tracking-[0.18em]"
          onClick={() => copy(url, "Link copied.")}
        >
          <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
          Copy link
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 bg-ink px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-paper"
          onClick={() => void share()}
        >
          <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          Share
        </button>
        {caption ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 border border-line px-4 py-3 text-[11px] uppercase tracking-[0.18em]"
            onClick={() => copy(caption, "Caption copied.")}
          >
            Copy caption
          </button>
        ) : null}
      </div>
      {note ? <p className="text-sm text-mute">{note}</p> : null}
    </div>
  );
}
