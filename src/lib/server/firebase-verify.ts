import { createRemoteJWKSet, jwtVerify } from "jose";

const projectId =
  process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
  process.env.FIREBASE_PROJECT_ID?.trim() ||
  "bunti-designs";

const jwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export async function verifyFirebaseToken(token?: string | null) {
  if (!token) throw new Error("Unauthorized");
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  const userId = typeof payload.sub === "string" ? payload.sub : "";
  if (!userId) throw new Error("Unauthorized");
  return {
    userId,
    email: typeof payload.email === "string" ? payload.email : null,
  };
}
