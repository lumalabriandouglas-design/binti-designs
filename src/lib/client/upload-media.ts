import { requestMediaPut, storeMedia } from "@/lib/server/upload";
import {
  blobToDataUrl,
  compressImageVariants,
  compressVideoFile,
} from "@/lib/media";

export type StoredStill = {
  thumb: string;
  display: string;
  master: string;
  preview?: string;
};

async function putBlob(token: string, filename: string, blob: Blob, kind: "image" | "video") {
  const contentType = blob.type || (kind === "video" ? "video/webm" : "image/jpeg");
  const ticket = await requestMediaPut({
    data: { token, filename, contentType, kind },
  });
  if (ticket.ok) {
    const sent = await fetch(ticket.putUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    if (sent.ok) return ticket.key;
  }
  const dataUrl = await blobToDataUrl(blob);
  const stored = await storeMedia({
    data: { token, filename, contentType, dataUrl },
  });
  return stored.url;
}

export async function uploadStill(token: string, file: File): Promise<StoredStill> {
  const variants = await compressImageVariants(file);
  const preview = URL.createObjectURL(variants.display);
  const base = file.name.replace(/\.[^.]+$/, "") || "look";
  const [thumb, display, master] = await Promise.all([
    putBlob(token, `${base}-thumb.jpg`, variants.thumb, "image"),
    putBlob(token, `${base}-display.jpg`, variants.display, "image"),
    putBlob(token, `${base}-master.jpg`, variants.master, "image"),
  ]);
  return { thumb, display, master, preview };
}

export async function uploadFilm(token: string, file: File) {
  const compressed = await compressVideoFile(file);
  return putBlob(token, file.name || "look.webm", compressed, "video");
}
