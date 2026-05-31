import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isAdminEmail, signOutAdmin } from '../lib/auth';
import { supabase } from '../lib/supabase';

type AuthContextValue = {
  email: string | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const userEmail = data.session?.user.email ?? null;
      setEmail(isAdminEmail(userEmail) ? userEmail : null);
      if (userEmail && !isAdminEmail(userEmail)) void signOutAdmin();
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const userEmail = session?.user.email ?? null;
      setEmail(isAdminEmail(userEmail) ? userEmail : null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await signOutAdmin();
    setEmail(null);
  }, []);

  const value = useMemo(
    () => ({
      email,
      loading,
      isAdmin: isAdminEmail(email),
      signOut,
    }),
    [email, loading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
