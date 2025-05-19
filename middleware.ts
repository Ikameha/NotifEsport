import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const PUBLIC_PATHS = [
  '/',
  '/auth/callback',
  '/auth/signin',
  '/api/auth/callback',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/auth/verify-request',
  '/image',                          // <-- ou autorise tout le dossier si tu veux
  '/api/auth/error'
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Créer un client Supabase avec la configuration pour gérer les cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Mettre à jour les cookies pour la requête
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Mettre à jour les cookies pour la réponse
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Supprimer le cookie dans la requête
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Supprimer le cookie dans la réponse
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // Rafraîchir la session si elle a expiré
    await supabase.auth.getUser()
    
    // Récupérer la session mise à jour
    const { data: { session } } = await supabase.auth.getSession()
    
    // Si c'est une route publique, laisser passer la requête
    if (PUBLIC_PATHS.some(path => 
      path === request.nextUrl.pathname || 
      (path.endsWith('*') && request.nextUrl.pathname.startsWith(path.replace('*', '')))
    )) {
      return response;
    }
    
    // Si c'est la route de callback de l'application, laisser passer la requête
    if (request.nextUrl.pathname.startsWith('/auth/callback')) {
      return response
    }

    // Si l'utilisateur n'est pas connecté et n'est pas sur une page publique, rediriger vers la page de connexion
    const isPublicPath = PUBLIC_PATHS.some(path => 
      request.nextUrl.pathname === path
    )
    
    if (!session && !isPublicPath) {
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // En cas d'erreur, rediriger vers la page d'accueil
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
