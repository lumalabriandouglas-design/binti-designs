import { HOUSE_EMAIL } from "@/lib/firebase/firebase";

export function isHouseAccount(email?: string | null, _adminEmail?: string | null) {
  return Boolean(email && email.trim().toLowerCase() === HOUSE_EMAIL);
}
