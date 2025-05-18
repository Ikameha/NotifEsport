import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Vérifier si on est côté navigateur
  if (typeof window === 'undefined') {
    // En environnement serveur, on retourne un client minimal
    // qui sera remplacé côté client
    return {
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getSession: async () => ({ data: { session: null } }),
        signOut: async () => ({}),
      },
    } as any;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Anon Key');
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
