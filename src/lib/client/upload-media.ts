import { requestMediaPut, storeMedia } from "@/lib/server/upload";
import {
  blobToDataUrl,
  compressImageVariants,
  compressVideoFile,
} from "@/lib/media";
import { firebaseAuth } from "@/lib/firebase/app";

export type StoredStill = {
  thumb: string;
  display: string;
  master: string;
  preview?: string;
};

async function houseToken() {
  try {
    return (await firebaseAuth()?.currentUser?.getIdToken()) || "";
  } catch {
    return "";
  }
}

async function putBlob(token: string, filename: string, blob: Blob, kind: "image" | "video") {
  const contentType = blob.type || (kind === "video" ? "video/webm" : "image/jpeg");
  const idToken = await houseToken();
  try {
    const ticket = await requestMediaPut({
      data: { token, idToken, filename, contentType, kind },
    });
    if (ticket.ok) {
      const sent = await fetch(ticket.putUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: blob,
      });
      if (sent.ok) return ticket.readUrl || ticket.key;
    }
  } catch {
    /* fall through to the house put */
  }
  const dataUrl = await blobToDataUrl(blob);
  const stored = await storeMedia({
    data: { token, idToken, filename, contentType, dataUrl },
  });
  if (!stored.url || stored.url.startsWith("data:")) {
    throw new Error("The archive would not take that file.");
  }
  return stored.url;
}

export async function uploadStill(token: string, file: File): Promise<StoredStill> {
  const variants = await compressImageVariants(file);
  const preview = URL.createObjectURL(variants.display);
  const base = file.name.replace(/\.[^.]+$/, "") || "look";
  const display = await putBlob(token, `${base}-display.jpg`, variants.display, "image");
  let thumb = display;
  let master = display;
  try {
    thumb = await putBlob(token, `${base}-thumb.jpg`, variants.thumb, "image");
  } catch {
    thumb = display;
  }
  try {
    master = await putBlob(token, `${base}-master.jpg`, variants.master, "image");
  } catch {
    master = display;
  }
  return { thumb, display, master, preview };
}

export async function uploadFilm(token: string, file: File) {
  const compressed = await compressVideoFile(file);
  return putBlob(token, file.name || "look.webm", compressed, "video");
}
