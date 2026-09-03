import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "./app";
import { HOUSE_EMAIL } from "./firebase";

export type HouseUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
};

const SessionContext = createContext<{
  user: HouseUser | null;
  isPending: boolean;
  getIdToken: () => Promise<string | null>;
}>({ user: null, isPending: true, getIdToken: async () => null });

function mapUser(user: User | null): HouseUser | null {
  if (!user) return null;
  return {
    id: user.uid,
    displayName: user.displayName,
    primaryEmail: user.email,
    profileImageUrl: user.photoURL,
  };
}

export function FirebaseSession({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<HouseUser | null>(null);
  const [isPending, setPending] = useState(true);

  useEffect(() => {
    const auth = firebaseAuth();
    if (!auth) {
      setPending(false);
      return;
    }
    void getRedirectResult(auth).catch(() => undefined);
    return onAuthStateChanged(auth, (next) => {
      setUser(mapUser(next));
      setPending(false);
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      isPending,
      getIdToken: async () => {
        const auth = firebaseAuth();
        if (!auth?.currentUser) return null;
        return auth.currentUser.getIdToken();
      },
    }),
    [user, isPending],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useHouseUser() {
  return useContext(SessionContext);
}

export function HouseSignedIn({ children }: { children: ReactNode }) {
  const { user } = useHouseUser();
  return user ? <>{children}</> : null;
}

export function HouseSignedOut({ children }: { children: ReactNode }) {
  const { user, isPending } = useHouseUser();
  if (isPending || user) return null;
  return <>{children}</>;
}

export async function houseSignIn(email: string, password: string) {
  const auth = firebaseAuth();
  if (!auth) throw new Error("Accounts are not ready.");
  await signInWithEmailAndPassword(auth, email, password);
}

export async function houseSignUp(email: string, password: string, name: string) {
  const auth = firebaseAuth();
  if (!auth) throw new Error("Accounts are not ready.");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
}

export async function houseGoogle() {
  const auth = firebaseAuth();
  if (!auth) throw new Error("Accounts are not ready.");
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch {
    await signInWithRedirect(auth, provider);
  }
}

export async function houseGoogleStrict() {
  const auth = firebaseAuth();
  if (!auth) throw new Error("Accounts are not ready.");
  const provider = new GoogleAuthProvider();
  try {
    const cred = await signInWithPopup(auth, provider);
    const email = cred.user.email?.trim().toLowerCase();
    if (email !== HOUSE_EMAIL) {
      await firebaseSignOut(auth);
      throw new Error("Access denied.");
    }
  } catch (err) {
    if (err instanceof Error && err.message === "Access denied.") throw err;
    await signInWithRedirect(auth, provider);
  }
}

export async function houseSignOut() {
  const auth = firebaseAuth();
  if (!auth) return;
  await firebaseSignOut(auth);
}
