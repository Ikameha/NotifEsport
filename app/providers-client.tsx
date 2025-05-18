'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ce code ne s'exécute que côté client
  const supabase = createClient();

  useEffect(() => {
    // Vérifier l'état d'authentification au chargement
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // Vérifier la session actuelle
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase.auth]);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Export AuthProvider as default
export default AuthProvider;

// Export useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProviderClient');
  }
  return context;
};
