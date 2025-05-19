import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Chemins accessibles sans authentification
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
  '/api/auth/error',
  '/favicon.ico',
  '/image', // ✅ permet l'accès public au dossier /image/*
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Supabase client pour vérifier la session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    // Tente de récupérer l'utilisateur (et rafraîchir la session si expirée)
    await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()

    const pathname = request.nextUrl.pathname

    // ✅ autorise tous les chemins commençant par un des PUBLIC_PATHS
    const isPublicPath = PUBLIC_PATHS.some(path =>
      pathname === path || pathname.startsWith(path + '/')
    )

    if (!session && !isPublicPath) {
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
