"use client"

import { useState, useEffect } from "react"
import { Save, Check, Loader2, Mail, LogOut, LogIn, User } from "lucide-react"
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
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
  games: string[]
  leagues: string[]
  favoriteTeams: string[]
}

type NotificationType = 'success' | 'error' | 'info';

const DEFAULT_GAMES: Game[] = [
  { id: 'lol', name: 'League of Legends', enabled: false },
  { id: 'valorant', name: 'Valorant', enabled: false },
  { id: 'cs2', name: 'Counter-Strike 2', enabled: false },
  { id: 'rl', name: 'Rocket League', enabled: false },
];

const DEFAULT_LEAGUES: League[] = [
  { id: 'lol-worlds', name: 'Worlds Championship', game: 'lol', enabled: false },
  { id: 'lol-lec', name: 'LEC', game: 'lol', enabled: false },
  { id: 'valorant-champions', name: 'Champions Tour', game: 'valorant', enabled: false },
  { id: 'cs2-majors', name: 'CS2 Majors', game: 'cs2', enabled: false },
  { id: 'rlcs', name: 'RLCS', game: 'rl', enabled: false },
];

export default function SettingsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  
  // États d'authentification
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: NotificationType; message: string } | null>(null);
  
  // États pour les jeux et ligues
  const [games, setGames] = useState<Game[]>(DEFAULT_GAMES);
  const [leagues, setLeagues] = useState<League[]>(DEFAULT_LEAGUES);
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>([]);

  // Initialiser Supabase
  useEffect(() => {
    const initSupabase = async () => {
      const sb = createClient();
      setSupabase(sb);
      
      // Vérifier l'état d'authentification
      const { data: { session }, error } = await sb.auth.getSession();
      
      if (error) {
        console.error('Erreur lors de la vérification de la session:', error);
      }
      
      setUser(session?.user ?? null);
      setAuthLoading(false);
    };
    
    initSupabase();
  }, []);

  // Charger les préférences utilisateur
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user || !supabase) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('user_preferences')
          .select('preferences')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data?.preferences) {
          const { games: savedGames = [], leagues: savedLeagues = [], favoriteTeams: savedTeams = [] } = data.preferences;
          
          // Mettre à jour les jeux
          setGames(prevGames => 
            prevGames.map(game => ({
              ...game,
              enabled: savedGames.includes(game.id)
            }))
          );
          
          // Mettre à jour les ligues
          setLeagues(prevLeagues => 
            prevLeagues.map(league => ({
              ...league,
              enabled: savedLeagues.includes(league.id)
            }))
          );
          
          setFavoriteTeams(savedTeams);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error);
        setNotification({
          type: 'error',
          message: 'Impossible de charger vos préférences. Veuillez réessayer.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserPreferences();
  }, [user, supabase]);

  // Fonction pour envoyer un email de confirmation
const sendNotificationPreference = async (userEmail: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const selectedGames = games.filter(g => g.enabled).map(g => g.name);
    const selectedLeagues = leagues.filter(l => l.enabled).map(l => l.name);
    
    const emailContent = `
      <h2>Confirmation de vos préférences NotifEsport</h2>
      <p>Bonjour,</p>
      <p>Vous avez mis à jour vos préférences de notification :</p>
      
      <h3>Jeux sélectionnés :</h3>
      <ul>${selectedGames.map(game => `<li>${game}</li>`).join('') || '<li>Aucun jeu sélectionné</li>'}</ul>
      
      <h3>Ligues sélectionnées :</h3>
      <ul>${selectedLeagues.map(league => `<li>${league}</li>`).join('') || '<li>Aucune ligue sélectionnée</li>'}</ul>
      
      <p>Merci d'utiliser NotifEsport !</p>
    `;
    
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: userEmail,
        subject: 'Confirmation de vos préférences NotifEsport',
        html: emailContent,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'envoi de l\'email' 
    };
  }
};

// Gérer la sauvegarde des préférences
const savePreferences = async () => {
  if (!user || !supabase || !user.email) {
    setNotification({
      type: 'error',
      message: 'Veuillez vous connecter pour sauvegarder vos préférences'
    });
    return;
  }

  try {
    setIsSaving(true);
    
    // 1. Vérifier l'utilisateur auth
    const { data: { user: authUser }, error: authError } = 
      await supabase.auth.getUser();
    
    if (authError || !authUser) {
      throw new Error('Erreur d\'authentification. Veuillez vous reconnecter.');
    }

    // 2. Vérifier/créer l'utilisateur dans public.users
    const { data: publicUser, error: userError } = await supabase
      .from('users')
      .select('id, email, email_notifications')
      .eq('id', user.id)
      .single();

    if (userError?.code !== 'PGRST116' && userError) { // PGRST116 = no rows returned
      console.error('Erreur vérification utilisateur:', userError);
      throw new Error('Erreur lors de la vérification du profil utilisateur');
    }

    if (!publicUser) {
      // Créer l'utilisateur avec l'email de l'auth
      const { error: createError } = await supabase
        .from('users')
        .insert([{ 
          id: user.id, 
          email: user.email,
          email_notifications: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.error('Erreur création utilisateur:', createError);
        throw new Error('Erreur lors de la création du profil utilisateur');
      }
    }

    // 3. Sauvegarder les préférences
    const preferences = {
      games: games.filter(g => g.enabled).map(g => g.id),
      leagues: leagues.filter(l => l.enabled).map(l => l.id),
      favoriteTeams: favoriteTeams
    };

    const { error: upsertError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Erreur sauvegarde préférences:', upsertError);
      throw new Error('Erreur lors de la sauvegarde des préférences');
    }

    // 4. Envoyer l'email de confirmation
    const emailResult = await sendNotificationPreference(user.email);
    if (!emailResult.success) {
      console.warn('Email non envoyé:', emailResult.error);
      // Ne pas échouer pour une erreur d'email
    }

    setNotification({
      type: 'success',
      message: 'Vos préférences ont été enregistrées avec succès !'
    });

  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    setNotification({
      type: 'error',
      message: error instanceof Error ? error.message : 'Une erreur inattendue est survenue'
    });
  } finally {
    setIsSaving(false);
  }
};

  // Gérer la déconnexion
  const handleLogout = async () => {
    if (!supabase) return;
    
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setNotification({
        type: 'error',
        message: 'Une erreur est survenue lors de la déconnexion. Veuillez réessayer.'
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Gérer la connexion
  const handleLogin = () => {
    router.push('/login');
  };

  // Gérer le changement d'état d'un jeu
  const toggleGame = (gameId: GameId) => {
    setGames(games.map(game => 
      game.id === gameId ? { ...game, enabled: !game.enabled } : game
    ));
  };

  // Gérer le changement d'état d'une ligue
  const toggleLeague = (leagueId: string) => {
    setLeagues(leagues.map(league => 
      league.id === leagueId ? { ...league, enabled: !league.enabled } : league
    ));
  };

  // Filtrer les ligues en fonction des jeux activés
  const filteredLeagues = leagues.filter(league => 
    games.some(game => game.id === league.game && game.enabled)
  );

  // Afficher un indicateur de chargement pendant la vérification de l'authentification ou le chargement des préférences
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, afficher un message
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Connectez-vous pour gérer vos préférences</h1>
        <button
          onClick={handleLogin}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 mx-auto"
        >
          <LogIn className="w-4 h-4" />
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mes préférences</h1>
        <div className="flex items-center">
          {user.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt="Profil"
              className="w-10 h-10 rounded-full mr-3"
            />
          )}
          <div>
            <p className="font-medium">{user.email}</p>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Déconnexion...
                </>
              ) : (
                <>
                  <LogOut className="w-3 h-3" />
                  Se déconnecter
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div 
          className={`mb-6 p-4 rounded-md ${
            notification.type === 'error' ? 'bg-red-100 text-red-700' : 
            notification.type === 'success' ? 'bg-green-100 text-green-700' :
            'bg-blue-100 text-blue-700'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="space-y-8">
        {/* Section des jeux */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Jeux</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games.map((game) => (
              <div
                key={game.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  game.enabled
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                }`}
                onClick={() => toggleGame(game.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{game.name}</span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      game.enabled
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {game.enabled && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section des ligues */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Ligues suivies</h2>
          {filteredLeagues.length === 0 ? (
            <p className="text-gray-500">
              Activez au moins un jeu pour voir les ligues disponibles.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLeagues.map((league) => (
                <div
                  key={league.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    league.enabled
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => toggleLeague(league.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{league.name}</span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        league.enabled
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {league.enabled && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bouton Enregistrer */}
        <div className="flex justify-end">
          <button
            onClick={savePreferences}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium ${
              isSaving
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
