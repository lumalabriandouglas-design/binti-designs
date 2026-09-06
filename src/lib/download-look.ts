import type { Look } from "@/lib/firebase/catalog";

function extFrom(url: string, fallback: string) {
  const clean = url.split("?")[0] || "";
  const match = clean.match(/\.(jpe?g|png|webp|gif|mp4|webm|mov)$/i);
  return match ? match[1].toLowerCase() : fallback;
}

async function saveUrl(url: string, filename: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch");
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export async function downloadLookFiles(look: Look) {
  const urls = [look.cover_url, ...(look.gallery ?? []), look.video_url].filter(Boolean);
  const unique = [...new Set(urls)];
  const base = (look.slug || look.title || "look").replace(/[^a-z0-9-]+/gi, "-");
  for (let i = 0; i < unique.length; i += 1) {
    const url = unique[i];
    const video = /video|\.mp4|\.webm|\.mov/i.test(url);
    await saveUrl(url, `${base}-${i + 1}.${extFrom(url, video ? "mp4" : "jpg")}`);
  }
}

export async function downloadStill(url: string, name = "still") {
  if (!url) return;
  await saveUrl(url, `${name}.${extFrom(url, "jpg")}`);
}
