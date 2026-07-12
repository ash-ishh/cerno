import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initializeApp, getApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  ConvexProviderWithAuth,
  type ConvexReactClient,
} from "convex/react";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

type FirebaseSession = {
  user: User | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const FirebaseSessionContext = createContext<FirebaseSession | null>(null);

export function useOptionalFirebaseSession() {
  return useContext(FirebaseSessionContext);
}

export function useFirebaseSession() {
  const session = useOptionalFirebaseSession();
  if (!session) throw new Error("FirebaseSessionProvider is missing.");
  return session;
}

function useAuthFromFirebase() {
  const { user, isLoading } = useFirebaseSession();
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      return user ? await user.getIdToken(forceRefreshToken) : null;
    },
    [user],
  );

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated: user !== null,
      fetchAccessToken,
    }),
    [fetchAccessToken, isLoading, user],
  );
}

export function FirebaseConvexProvider({
  client,
  children,
}: {
  client: ConvexReactClient;
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => onIdTokenChanged(firebaseAuth, (nextUser) => {
    setUser(nextUser);
    setIsLoading(false);
  }), []);

  const signIn = useCallback(async () => {
    await signInWithPopup(firebaseAuth, googleProvider);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(firebaseAuth);
  }, []);

  const session = useMemo(
    () => ({ user, isLoading, signIn, signOut }),
    [isLoading, signIn, signOut, user],
  );

  return (
    <FirebaseSessionContext.Provider value={session}>
      <ConvexProviderWithAuth client={client} useAuth={useAuthFromFirebase}>
        {children}
      </ConvexProviderWithAuth>
    </FirebaseSessionContext.Provider>
  );
}
