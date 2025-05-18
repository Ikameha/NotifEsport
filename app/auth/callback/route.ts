import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  
  if (!code) {
    const redirectUrl = new URL('/auth/signin', request.url);
    redirectUrl.searchParams.set('error', 'Code de vérification manquant');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // Créer le client Supabase avec la configuration PKCE
    const supabase = await createClient();

    // Dans Next.js 14, les cookies sont gérés automatiquement par Supabase
    // via les en-têtes de requête/réponse
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Supabase auth error:', error);
      throw new Error(`Failed to exchange code for session: ${error.message}`);
    }
    
    console.log('Session exchange successful');
    
    // Créer la réponse de redirection
    const response = NextResponse.redirect(new URL(next, request.url));
    
    // Supprimer le code_verifier après utilisation
    response.cookies.delete('sb-code-verifier');
    
    return response;
  } catch (error) {
    console.error('Error in auth callback:', error);
    
    // En cas d'erreur, rediriger vers la page de connexion avec un message d'erreur
    const loginUrl = new URL('/auth/signin', request.url);
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la connexion. Veuillez réessayer.';
    loginUrl.searchParams.set('error', errorMessage);
    return NextResponse.redirect(loginUrl);
  }
}
