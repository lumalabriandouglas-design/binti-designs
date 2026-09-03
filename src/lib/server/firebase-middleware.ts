import { createMiddleware } from "@tanstack/react-start";
import { verifyFirebaseToken } from "@/lib/server/firebase-verify";

export const firebaseAuthMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    let token: string | undefined;
    if (typeof window !== "undefined") {
      try {
        const { firebaseAuth } = await import("@/lib/firebase/app");
        token = (await firebaseAuth()?.currentUser?.getIdToken()) ?? undefined;
      } catch {
        token = undefined;
      }
    }
    return next({ sendContext: { firebaseToken: token } });
  })
  .server(async ({ next, context }) => {
    const session = await verifyFirebaseToken(context.firebaseToken);
    return next({ context: { userId: session.userId, email: session.email } });
  });
