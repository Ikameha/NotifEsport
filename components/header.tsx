"use client";

import Link from "next/link"
import { Trophy, Loader2, User } from "lucide-react"
import { useAuth } from "@/app/providers"
import { createClient } from "@/lib/supabase/client"

export default function Header() {
  const { user, isLoading } = useAuth()
  const supabase = createClient()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="border-b border-forest/20 bg-light/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-forest font-bold text-xl">
          <Trophy className="w-6 h-6" />
          <span>NotifSport</span>
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center p-2">
            <Loader2 className="h-5 w-5 animate-spin text-forest" />
          </div>
        ) : (
          <nav className="flex items-center gap-6">
            <Link href="/calendar" className="text-dark/80 hover:text-forest transition-colors">
              Calendrier
            </Link>
            <Link href="/settings" className="text-dark/80 hover:text-forest transition-colors">
              Préférences
            </Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-dark/80">
                  <User className="w-5 h-5" />
                  <span>{user.email?.split('@')[0]}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-forest text-light px-4 py-2 rounded-md hover:bg-forest/90 transition-colors"
              >
                Connexion
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
