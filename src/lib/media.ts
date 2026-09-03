export const MAX_STILLS = 8;

export type ImageVariants = {
  thumb: string;
  display: string;
  master: string;
};

async function paint(file: Blob, maxEdge: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not prepare the image.");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (out) => (out ? resolve(out) : reject(new Error("Could not compress the still."))),
      "image/jpeg",
      quality,
    );
  });
  return blob;
}

export async function compressImageVariants(file: File): Promise<{
  thumb: Blob;
  display: Blob;
  master: Blob;
}> {
  const [thumb, display, master] = await Promise.all([
    paint(file, 900, 0.72),
    paint(file, 2560, 0.88),
    paint(file, 3840, 0.92),
  ]);
  return { thumb, display, master };
}

export async function compressImageFile(file: File): Promise<string> {
  const blob = await paint(file, 2560, 0.88);
  return blobToDataUrl(blob);
}

export async function compressVideoFile(file: File): Promise<Blob> {
  if (typeof window === "undefined") return file;
  if (file.size < 2.5 * 1024 * 1024) return file;

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not read the film."));
    });

    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "";
    if (!mime || typeof (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream !== "function") {
      return file;
    }

    await video.play();
    const stream = (video as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream();
    const bits = video.videoWidth >= 1920 ? 3_200_000 : 2_200_000;
    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: bits,
    });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    const done = new Promise<Blob>((resolve, reject) => {
      recorder.onerror = () => reject(new Error("The house could not compress this film."));
      recorder.onstop = () => resolve(new Blob(chunks, { type: mime.split(";")[0] }));
    });
    recorder.start(250);
    await new Promise<void>((resolve) => {
      video.onended = () => resolve();
      window.setTimeout(resolve, Math.min(90_000, (video.duration || 12) * 1000 + 400));
    });
    if (recorder.state !== "inactive") recorder.stop();
    video.pause();
    const blob = await done;
    if (blob.size < 800) return file;
    return blob;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function readVideoFile(file: File): Promise<string> {
  const compressed = await compressVideoFile(file);
  if (compressed.size > 12 * 1024 * 1024) {
    throw new Error("Even after compressing, that film is still too heavy. Try a shorter clip.");
  }
  return blobToDataUrl(compressed);
}

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

export function parseGallery(raw: string): Array<Record<string, string>> {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
