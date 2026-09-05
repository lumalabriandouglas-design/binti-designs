import { requestMediaPut, storeMedia } from "@/lib/server/upload";
import {
  blobToDataUrl,
  compressImageVariants,
  compressVideoFile,
} from "@/lib/media";
import { firebaseAuth, getFirebaseStorage } from "@/lib/firebase/app";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

function archiveMessage(err: unknown) {
  const text = err instanceof Error ? err.message : String(err || "");
  if (/access denied/i.test(text) || /AccessDenied/i.test(text)) {
    return "The R2 key was refused. The still was sent to the house archive instead.";
  }
  return text || "The archive would not take that file.";
}

async function putFirebase(filename: string, blob: Blob) {
  const storage = getFirebaseStorage();
  const user = firebaseAuth()?.currentUser;
  if (!storage || !user) throw new Error("Sign in with the house Google first.");
  const path = `looks/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, blob, { contentType: blob.type || "image/jpeg" });
  return getDownloadURL(fileRef);
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
    /* try the house put, then Firebase */
  }
  try {
    const dataUrl = await blobToDataUrl(blob);
    const stored = await storeMedia({
      data: { token, idToken, filename, contentType, dataUrl },
    });
    if (stored.url && !stored.url.startsWith("data:")) return stored.url;
  } catch (err) {
    try {
      return await putFirebase(filename, blob);
    } catch {
      throw new Error(archiveMessage(err));
    }
  }
  try {
    return await putFirebase(filename, blob);
  } catch (err) {
    throw new Error(archiveMessage(err));
  }
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
