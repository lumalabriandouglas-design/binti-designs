import { createMiddleware } from "@tanstack/react-start";
import { verifyFirebaseToken } from "@/lib/server/firebase-verify";

export const firebaseAuthMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    let token: string | undefined;
    if (typeof window !== "undefined") {
      try {
        const { firebaseAuth } = await import("@/lib/firebase/app");
        const user = firebaseAuth()?.currentUser;
        token = (await user?.getIdToken()) ?? undefined;
      } catch {
        token = undefined;
      }
    }
    return next({ sendContext: { firebaseToken: token } });
  })
  .server(async ({ next, context }) => {
    let userId: string | null = null;
    let email: string | null = null;
    try {
      const session = await verifyFirebaseToken(
        (context as { firebaseToken?: string }).firebaseToken,
      );
      userId = session.userId || null;
      email = session.email;
    } catch {
      userId = null;
      email = null;
    }
    return next({ context: { userId, email } });
  });
