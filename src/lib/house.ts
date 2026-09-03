export const HOUSE_EMAIL = "bintidesigns442@gmail.com";

export function isHouseAccount(email?: string | null, adminEmail?: string | null) {
  const allowed = (adminEmail || HOUSE_EMAIL).trim().toLowerCase();
  return Boolean(email && email.trim().toLowerCase() === allowed);
}
