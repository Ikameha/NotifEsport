"use client"

import { useState, useEffect } from "react"
import { Save, Check, Loader2, Mail } from "lucide-react"
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email";

// Types
type GameId = "lol" | "valorant" | "cs2" | "rl"

type Game = {
  id: GameId
  name: string
  enabled: boolean
}

type League = {
  id: string
  name: string
  game: GameId
  enabled: boolean
}

type UserPreferences = {
  games: Game[]
  leagues: League[]
  favoriteTeams: string[]
}

export default function EmailSettings() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  
  // États d'authentification
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // États pour les jeux et ligues
  const [games, setGames] = useState<Game[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);

  // Fonction pour envoyer un email de confirmation
  const sendNotificationPreference = async () => {
    if (!user?.email) return;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Vos préférences ont été mises à jour - NotifEsport',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
            <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 20px;">Préférences mises à jour</h1>
            <p>Bonjour,</p>
            <p>Vos préférences de notification ont été mises à jour avec succès :</p>
            
            <h2 style="margin: 24px 0 12px 0; font-size: 18px; color: #111827; font-weight: 600;">Jeux sélectionnés :</h2>
            <ul style="margin: 0; padding-left: 20px;">
              ${games.map(game => 
                `<li style="margin-bottom: 8px;">${game.name}${game.enabled ? ' ✅' : ' ❌'}</li>`
              ).join('')}
            </ul>

            <h2 style="margin: 24px 0 12px 0; font-size: 18px; color: #111827; font-weight: 600;">Ligues sélectionnées :</h2>
            <ul style="margin: 0; padding-left: 20px;">
              ${leagues.filter(l => games.some(g => g.id === l.game && g.enabled)).map(league => 
                `<li style="margin-bottom: 8px;">${league.name}${league.enabled ? ' ✅' : ' ❌'}</li>`
              ).join('')}
            </ul>

            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <a href="https://notifesport.fr/parametres" 
                style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; 
                      text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 16px;">
                Modifier mes préférences
              </a>
            </div>

            <p style="margin-top: 32px; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">
              Si vous n'avez pas effectué cette modification, veuillez nous contacter immédiatement à l'adresse 
              <a href="mailto:support@notifesport.fr" style="color: #2563eb; text-decoration: none;"> support@notifesport.fr</a>.
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la confirmation', error);
      throw error;
    }
  };
  
  // Initialiser le client Supabase
  useEffect(() => {
    const initSupabase = async () => {
      const client = await createClient();
      setSupabase(client);
    };
    
    initSupabase();
  }, []);

  // Charger les données utilisateur et préférences
  useEffect(() => {
    if (!supabase) return;

    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Charger les préférences utilisateur
          const { data: preferences } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

          // Initialiser les états avec les préférences
          if (preferences) {
            // Mettre à jour les jeux et ligues en fonction des préférences
            // (à adapter selon votre structure de données)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setIsLoading(false);
        setAuthLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  // Fonction pour sauvegarder les préférences
  const handleSave = async () => {
    if (!user?.id || !supabase) {
      setNotification({
        type: 'error',
        message: 'Veuillez vous connecter pour sauvegarder vos préférences.'
      });
      return;
    }

    setIsSaving(true);
    setNotification(null);

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            preferences: {
              games: games.filter(g => g.enabled).map(g => g.id),
              leagues: leagues.filter(l => l.enabled).map(l => l.id),
            },
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) {
        throw error;
      }
      
      // Envoyer l'email de confirmation
      await sendNotificationPreference();
      
      setShowSuccess(true);
      setNotification({
        type: 'success',
        message: 'Préférences sauvegardées avec succès. Un email de confirmation a été envoyé.'
      });
      
      setTimeout(() => setShowSuccess(false), 5000);
      
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde des préférences:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Une erreur est survenue lors de la sauvegarde des préférences.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Fonction pour gérer la déconnexion
  const handleLogout = async () => {
    if (!supabase) return;
    
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Paramètres de notification</h1>
      
      {notification && (
        <div 
          className={`p-4 mb-6 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Jeux</h2>
        <div className="space-y-3">
          {games.map((game) => (
            <div key={game.id} className="flex items-center">
              <input
                type="checkbox"
                id={`game-${game.id}`}
                checked={game.enabled}
                onChange={() => {
                  setGames(games.map(g => 
                    g.id === game.id ? { ...g, enabled: !g.enabled } : g
                  ));
                }}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor={`game-${game.id}`} className="ml-2 text-gray-700">
                {game.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Ligues</h2>
        <div className="space-y-3">
          {leagues.map((league) => {
            const game = games.find(g => g.id === league.game);
            return (
              <div 
                key={league.id} 
                className={`flex items-center ${!game?.enabled ? 'opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  id={`league-${league.id}`}
                  checked={league.enabled}
                  onChange={() => {
                    setLeagues(leagues.map(l => 
                      l.id === league.id ? { ...l, enabled: !l.enabled } : l
                    ));
                  }}
                  disabled={!game?.enabled}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label 
                  htmlFor={`league-${league.id}`} 
                  className={`ml-2 ${!game?.enabled ? 'text-gray-400' : 'text-gray-700'}`}
                >
                  {league.name}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-red-600 hover:text-red-800 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              Déconnexion...
            </>
          ) : (
            'Se déconnecter'
          )}
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              Sauvegarde...
            </>
          ) : showSuccess ? (
            <>
              <Check className="h-5 w-5" />
              Sauvegardé !
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Sauvegarder les modifications
            </>
          )}
        </button>
      </div>
    </div>
  );
}
