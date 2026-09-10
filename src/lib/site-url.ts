export const PUBLIC_SITE_URL = (
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_SITE_URL) ||
  "https://binti-designs.vercel.app"
).replace(/\/$/, "");

export const HOUSE_BIO_LINE = "BINTI DESIGNS — East African atelier";

export function publicUrl(path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (clean === "/") return PUBLIC_SITE_URL;
  return `${PUBLIC_SITE_URL}${clean}`;
}

export function liveOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return PUBLIC_SITE_URL;
}
