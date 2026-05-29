'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AUTHORIZED_EMAIL = 'djetk777@gmail.com';

interface AuthContextType {
  authorized: boolean;
  userEmail: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  authorized: false,
  userEmail: null,
  signOut: async () => {},
});

export const useAdminAuth = () => useContext(AuthContext);

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setAuthorized(session.user.email === AUTHORIZED_EMAIL);
      }
      setChecking(false);
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setAuthorized(session.user.email === AUTHORIZED_EMAIL);
      } else {
        setUserEmail(null);
        setAuthorized(false);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin`
      }
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (checking) {
    return (
      <div className="pt-24 pb-20 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!userEmail || !authorized) {
    return (
      <div className="pt-24 pb-20">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Admin Access</h1>
            <p className="text-muted-foreground mb-6">
              {userEmail && userEmail !== AUTHORIZED_EMAIL
                ? 'You are not authorized to access this admin panel.'
                : 'Sign in to access the admin dashboard.'}
            </p>
            {userEmail && userEmail !== AUTHORIZED_EMAIL && (
              <p className="text-sm text-muted-foreground mb-4">
                Signed in as: <span className="font-medium">{userEmail}</span>
              </p>
            )}
            <Button
              onClick={handleGoogleSignIn}
              className="bg-accent hover:bg-accent/90 text-white w-full gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>
            {userEmail && (
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full mt-3"
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ authorized, userEmail, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}
