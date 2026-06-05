'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const AUTHORIZED_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

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

function getLoginAttempts(): { count: number; timestamp: number } {
  if (typeof window === 'undefined') return { count: 0, timestamp: 0 };
  const stored = localStorage.getItem('admin_login_attempts');
  if (!stored) return { count: 0, timestamp: 0 };
  try {
    return JSON.parse(stored);
  } catch {
    return { count: 0, timestamp: 0 };
  }
}

function setLoginAttempts(count: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_login_attempts', JSON.stringify({
    count,
    timestamp: Date.now()
  }));
}

function getAdminSession(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_session_token');
}

function setAdminSession(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_session_token', token);
}

function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_session_token');
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  useEffect(() => {
    const attempts = getLoginAttempts();
    const timeSinceLast = Date.now() - attempts.timestamp;

    if (attempts.count >= MAX_LOGIN_ATTEMPTS && timeSinceLast < LOCKOUT_DURATION) {
      setIsLocked(true);
      setLockoutTime(Math.ceil((LOCKOUT_DURATION - timeSinceLast) / 1000));
      return;
    } else if (timeSinceLast >= LOCKOUT_DURATION) {
      setLoginAttempts(0);
    }

    const sessionToken = getAdminSession();
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user?.email && session.user.email === AUTHORIZED_EMAIL) {
        setUserEmail(session.user.email);
        setAuthorized(true);
        if (adminPassword) {
          setAdminSession(adminPassword);
        }
      } else if (sessionToken && adminPassword && sessionToken === adminPassword) {
        setAuthorized(true);
        setUserEmail('admin@mindscape.local');
      } else {
        setUserEmail(null);
        setAuthorized(false);
      }
      setChecking(false);
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email && session.user.email === AUTHORIZED_EMAIL) {
        setUserEmail(session.user.email);
        setAuthorized(true);
        if (adminPassword) {
          setAdminSession(adminPassword);
        }
      } else if (sessionToken && adminPassword && sessionToken === adminPassword) {
        setAuthorized(true);
        setUserEmail('admin@mindscape.local');
      } else {
        setUserEmail(null);
        setAuthorized(false);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLocked) return;
    const timer = setInterval(() => {
      setLockoutTime(prev => {
        if (prev <= 1) {
          setIsLocked(false);
          setLoginAttempts(0);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLocked]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const attempts = getLoginAttempts();
    const timeSinceLast = Date.now() - attempts.timestamp;

    if (attempts.count >= MAX_LOGIN_ATTEMPTS && timeSinceLast < LOCKOUT_DURATION) {
      toast.error(`Too many attempts. Try again in ${lockoutTime} seconds.`);
      return;
    }

    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
    if (!adminPassword) {
      toast.error('Admin password not configured');
      return;
    }

    if (password === adminPassword) {
      setLoginAttempts(0);
      setAdminSession(adminPassword);
      setPassword('');
      setAuthorized(true);
      setUserEmail('admin@mindscape.local');
      toast.success('Access granted');
      router.push('/admin');
    } else {
      const newCount = timeSinceLast >= LOCKOUT_DURATION ? 1 : attempts.count + 1;
      setLoginAttempts(newCount);
      setPassword('');

      if (newCount >= MAX_LOGIN_ATTEMPTS) {
        setIsLocked(true);
        setLockoutTime(Math.ceil(LOCKOUT_DURATION / 1000));
        toast.error(`Too many failed attempts. Account locked for ${Math.ceil(LOCKOUT_DURATION / 1000)} seconds.`);
      } else {
        toast.error(`Invalid password. ${MAX_LOGIN_ATTEMPTS - newCount} attempts remaining.`);
      }
    }
  };

  const handleSignOut = async () => {
    clearAdminSession();
    await supabase.auth.signOut();
    setAuthorized(false);
    setUserEmail(null);
    router.push('/admin');
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
              Enter password to access the admin dashboard.
            </p>

            {isLocked ? (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  Account locked for {lockoutTime}s due to too many failed attempts.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLocked}
                  className="bg-background"
                />
                <Button
                  type="submit"
                  disabled={isLocked || !password}
                  className="bg-accent hover:bg-accent/90 text-white w-full"
                >
                  Sign In
                </Button>
              </form>
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
