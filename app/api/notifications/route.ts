// app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUpcomingMatches } from '@/lib/pandascore-client';
import { transformPandaScoreMatch, PandaScoreMatch } from '@/lib/pandascore';

// Vérification des variables d'environnement requises
const requiredEnvVars = [
  'RESEND_API_KEY',
  'PANDASCORE_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Variable d'environnement manquante: ${envVar}`);
  }
}

// Définir le type pour les matchs transformés
type TransformedMatch = {
  id: string | number;  // PandaScore utilise des nombres, mais notre système attend des strings
  team1: string;
  team2: string;
  game: string;
  game_id: string;
  league_slug?: string; // Rendre cette propriété optionnelle
  league_id: string;
  scheduled_at: string;
  dateObj: Date;
  [key: string]: any; // Pour les autres propriétés optionnelles
};

// Désactiver le cache pour cet endpoint
export const dynamic = 'force-dynamic';

// Fonction pour formater la date en français
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Fonction utilitaire pour valider un objet TransformedMatch
function isValidTransformedMatch(match: any): match is TransformedMatch {
  return (
    match &&
    (typeof match.id === 'string' || typeof match.id === 'number') &&
    typeof match.team1 === 'string' &&
    typeof match.team2 === 'string' &&
    typeof match.game === 'string' &&
    typeof match.game_id === 'string' &&
    (match.league_slug === undefined || typeof match.league_slug === 'string') &&
    typeof match.league_id === 'string' &&
    typeof match.scheduled_at === 'string' &&
    match.dateObj instanceof Date
  );
}

// Types pour la base de données
interface User {
  email: string;
  email_notifications: boolean;
}

interface UserPreference {
  user_id: string;
  users: {
    email: string;
    email_notifications: boolean;
  } | null;
}

interface Match {
  id: string | number;
  team1: string | { name: string } | null;
  team2: string | { name: string } | null;
  scheduled_at: string;
  game_id?: string; // Rendre optionnel pour correspondre à la structure réelle
  game_name: string | null;
  game?: string;
  league_id: string;
  league_name: string | null;
  league_slug?: string;
  dateObj?: Date;
  [key: string]: any; // Pour les autres propriétés dynamiques
}

export async function GET(request: Request) {
  // Déclarer les variables au début de la fonction
  let totalNotifications = 0;
  let matchesStartingSoon: TransformedMatch[] = [];
  
  // Vérifier que les variables d'environnement requises sont définies
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    console.error('Variables d\'environnement manquantes:', missingEnvVars);
    return NextResponse.json(
      { 
        error: 'Configuration serveur incomplète',
        details: `Variables manquantes: ${missingEnvVars.join(', ')}`
      },
      { status: 500 }
    );
  }
  
  try {
    // Vérifier la clé API si elle est définie
    const apiKey = request.headers.get('x-api-key');
    if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
      console.warn('Tentative d\'accès non autorisée à l\'endpoint de notifications');
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const now = new Date();
    
    // Définir la plage de temps pour les notifications (maintenant jusqu'à 24h plus tard)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`Recherche des matchs entre ${now.toISOString()} et ${tomorrow.toISOString()}`);

    // Récupérer les matchs depuis PandaScore
    let pandaMatches: any[];
    try {
      const result = await getUpcomingMatches();
      
      // Vérifier que le résultat est un tableau
      if (!Array.isArray(result)) {
        console.error('Erreur: getUpcomingMatches n\'a pas retourné un tableau');
        return NextResponse.json({
          error: 'Erreur lors de la récupération des matchs',
          details: 'Format de données invalide: tableau attendu'
        }, { status: 500 });
      }
      
      // S'assurer que chaque élément du tableau a les propriétés minimales requises
      pandaMatches = result.filter(match => 
        match && 
        (match.id !== undefined) && 
        (match.team1 !== undefined || match.opponents?.[0]?.team) &&
        (match.team2 !== undefined || match.opponents?.[1]?.team) &&
        match.scheduled_at
      );
      
      if (pandaMatches.length === 0 && result.length > 0) {
        console.warn('Aucun match valide trouvé dans les données retournées par PandaScore');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des matchs depuis PandaScore:', error);
      return NextResponse.json({
        error: 'Erreur lors de la récupération des matchs',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, { status: 500 });
    }
    
    const matches: TransformedMatch[] = [];
    
    // Vérifier que pandaMatches est défini et est un tableau
    if (!pandaMatches || !Array.isArray(pandaMatches)) {
      console.error('Aucun match valide à traiter');
      return NextResponse.json({
        message: 'Aucun match valide à notifier',
        matchCount: 0,
        notificationCount: 0
      });
    }

    for (const pandaMatch of pandaMatches) {
      try {
        const transformed = transformPandaScoreMatch(pandaMatch);
        if (!transformed) continue;

        // Vérifier et formater les noms d'équipes
        const getTeamName = (team: any): string => {
          if (!team) return 'Équipe inconnue';
          if (typeof team === 'string') return team;
          if (typeof team === 'object' && team !== null && 'name' in team) {
            return team.name || 'Équipe inconnue';
          }
          return 'Équipe inconnue';
        };
        
        const team1Name = getTeamName(transformed.team1);
        const team2Name = getTeamName(transformed.team2);

        // Créer la date prévue en utilisant dateObj ou la date actuelle comme fallback
        const scheduledDate = transformed.dateObj && !isNaN(transformed.dateObj.getTime())
          ? transformed.dateObj
          : new Date();
          
        // Créer un objet partiel pour éviter les erreurs de typage
        const matchData: Partial<TransformedMatch> = {
          id: transformed.id?.toString() || 'unknown',
          team1: team1Name,
          team2: team2Name,
          game: typeof transformed.game === 'string' ? transformed.game : 'unknown',
          league_id: transformed.league_slug || 'unknown',
          league_slug: transformed.league_slug,
          scheduled_at: scheduledDate.toISOString(),
          dateObj: scheduledDate,
          // Initialiser game_id avec une valeur par défaut
          game_id: 'unknown'
        };
        
        // Ajouter game_id s'il est défini dans l'objet transformé
        if ('game_id' in transformed && typeof transformed.game_id === 'string') {
          matchData.game_id = transformed.game_id;
        } else if ('game' in transformed && typeof transformed.game === 'string') {
          // Utiliser le nom du jeu comme fallback
          matchData.game_id = transformed.game.toLowerCase();
        }
        
        // Convertir en TransformedMatch
        const transformedMatch: TransformedMatch = {
          id: matchData.id!,
          team1: matchData.team1!,
          team2: matchData.team2!,
          game: matchData.game!,
          game_id: matchData.game_id!,
          league_id: matchData.league_id!,
          scheduled_at: matchData.scheduled_at!,
          dateObj: matchData.dateObj!,
          ...(matchData.league_slug && { league_slug: matchData.league_slug })
        };
        
        // Valider le match transformé avant de l'ajouter
        if (isValidTransformedMatch(transformedMatch)) {
          matches.push(transformedMatch);
        } else {
          console.error('Match transformé invalide, ignoré:', transformedMatch);
        }
      } catch (error) {
        console.error('Erreur lors de la transformation du match:', error);
      }
    }

    console.log(`${matches.length} matchs trouvés`);

    // Vérifier les utilisateurs
    console.log('Vérification des utilisateurs:');
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, created_at')
        .limit(5);
        
      if (usersError) {
        console.error('Erreur lors de la récupération des utilisateurs:', usersError);
      } else {
        console.log('Utilisateurs trouvés:', users?.length || 0);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des utilisateurs:', error);
    }

    // Vérifier la structure de la table user_preferences
    console.log('Structure de la table user_preferences:');
    const { data: tableInfo } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'user_preferences');
    console.log('Colonnes de user_preferences:', tableInfo);

    // Afficher un exemple de préférences utilisateur pour le débogage
    console.log('Exemple de préférences utilisateur:');
    const { data: samplePrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .limit(1)
      .maybeSingle();
    console.log('Préférences échantillon:', JSON.stringify(samplePrefs, null, 2));

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        message: 'Aucun match à notifier',
        matchCount: 0,
        notificationCount: 0
      });
    }

    // 3. Vérifier s'il y a des matchs qui commencent dans 5 minutes
    if (!matches || !Array.isArray(matches)) {
      console.error('Erreur: la variable matches n\'est pas un tableau valide');
      return NextResponse.json({
        error: 'Erreur interne du serveur',
        details: 'Données de matchs invalides'
      }, { status: 500 });
    }
    
    matchesStartingSoon = matches.filter(match => {
      const matchTime = new Date(match.scheduled_at);
      const timeUntilMatch = matchTime.getTime() - now.getTime();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes en millisecondes
      return timeUntilMatch <= fiveMinutes && timeUntilMatch > 0; // Entre maintenant et 5 minutes
    });

    if (matchesStartingSoon.length === 0) {
      console.log('Aucun match qui commence dans les 5 prochaines minutes');
      return NextResponse.json({
        message: 'Aucun match à notifier dans les 5 prochaines minutes',
        matchCount: 0,
        notificationCount: 0
      });
    }

    // 2. Pour chaque match qui commence bientôt, trouver les utilisateurs intéressés
    if (!matchesStartingSoon || !Array.isArray(matchesStartingSoon)) {
      console.error('Erreur: matchesStartingSoon n\'est pas un tableau valide');
      return NextResponse.json({
        error: 'Erreur interne du serveur',
        details: 'Données de matchs à venir invalides'
      }, { status: 500 });
    }
    
    // S'assurer que matchesStartingSoon est bien un tableau avant de l'itérer
    const matchesToProcess = Array.isArray(matchesStartingSoon) ? matchesStartingSoon : [];
    
    for (const match of matchesToProcess) {
      // Fonction utilitaire pour formater les noms d'équipe
      const formatTeamName = (team: any): string => {
        if (typeof team === 'string') return team;
        if (team && typeof team === 'object' && 'name' in team) return team.name;
        return 'Équipe inconnue';
      };
      
      const matchId = match?.id?.toString() || 'inconnu';
      const team1Name = formatTeamName(match?.team1);
      const team2Name = formatTeamName(match?.team2);
      
      console.log(`Traitement du match ${team1Name} vs ${team2Name} (${matchId}) qui commence dans 5 minutes`);
      
      // Récupérer les utilisateurs intéressés par ce match
      let usersByGame = [];
      let usersByLeague = [];
      let gameError = null;
      let leagueError = null;
      
      try {
        // Récupérer les utilisateurs intéressés par le jeu
        const gameResult = await supabase.rpc('get_users_by_preference', {
          pref_key: 'games',
          pref_value: match.game_id
        });
        usersByGame = gameResult.data || [];
        gameError = gameResult.error;

        // Récupérer les utilisateurs intéressés par la ligue
        const leagueResult = await supabase.rpc('get_users_by_preference', {
          pref_key: 'leagues',
          pref_value: match.league_id
        });
        usersByLeague = leagueResult.data || [];
        leagueError = leagueResult.error;
      } catch (error) {
        console.error(`Erreur lors de la récupération des préférences pour le match ${match.id}:`, error);
        continue;
      }
      
      console.log('Utilisateurs par jeu:', usersByGame);
      console.log('Utilisateurs par ligue:', usersByLeague);

      if (gameError || leagueError) {
        console.error(`Erreur lors de la récupération des préférences pour le match ${match.id}:`, { gameError, leagueError });
        continue;
      }

      // Afficher les données brutes pour le débogage
      console.log('Utilisateurs par jeu:', usersByGame);
      console.log('Utilisateurs par ligue:', usersByLeague);

      // Fusionner les résultats et éliminer les doublons
      const allUsers = [...(usersByGame || []), ...(usersByLeague || [])];
      
      // Définir les types
      type DbUser = {
        user_id: string;
        email: string | null;
        email_notifications: boolean | null;
      };

      type FormattedUser = {
        user_id: string;
        users: {
          email: string;
          email_notifications: boolean;
        };
      };

      // Créer une Map pour éliminer les doublons par user_id
      const uniqueUsersMap = (allUsers as DbUser[]).reduce<Map<string, DbUser>>((map, user) => {
        if (user?.email && !map.has(user.user_id)) {
          map.set(user.user_id, {
            user_id: user.user_id,
            email: user.email,
            email_notifications: user.email_notifications === true
          });
        }
        return map;
      }, new Map());

      // Convertir et filtrer les utilisateurs
      const userPreferences: FormattedUser[] = Array.from(uniqueUsersMap.values())
        .filter((user): user is DbUser & { email: string; email_notifications: boolean } => 
          user.email !== null && user.email_notifications === true
        )
        .map(user => ({
          user_id: user.user_id,
          users: {
            email: user.email,
            email_notifications: user.email_notifications
          }
        }));

      console.log('Utilisateurs uniques avec notifications activées:', userPreferences);

      if (!userPreferences || userPreferences.length === 0) {
        console.log(`Aucun utilisateur intéressé par le match ${match.id}`);
        continue;
      }
      
      // Itérer sur les préférences utilisateur
      for (const pref of userPreferences) {
        if (!pref?.users) {
          console.warn('Préférence utilisateur invalide, ignorée');
          continue;
        }
        
        const user = pref.users;
        const email = user.email;
        if (!email) {
          console.warn(`Utilisateur ${pref.user_id} sans email`);
          continue;
        }
        
        try {
          // S'assurer que la date est valide avant de la formater
          let matchDate = 'Date non disponible';
          
          if (match.scheduled_at) {
            try {
              const dateValue = new Date(match.scheduled_at);
              if (!isNaN(dateValue.getTime())) {
                matchDate = formatDate(dateValue);
              }
            } catch (error) {
              console.error('Erreur lors du formatage de la date:', error);
            }
          }
          
          // S'assurer que les propriétés sont définies avant de les utiliser dans l'email
          const leagueName = (typeof match.league_name === 'string' && match.league_name.trim() !== '') 
            ? match.league_name 
            : 'Compétition inconnue';
            
          const gameName = (typeof match.game_name === 'string' && match.game_name.trim() !== '')
            ? match.game_name
            : (typeof match.game_id === 'string' ? match.game_id : 'Jeu inconnu');
            
          const team1NameDisplay = typeof match.team1 === 'string' ? match.team1 : 'Équipe 1';
          const team2NameDisplay = typeof match.team2 === 'string' ? match.team2 : 'Équipe 2';
          
          const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
              <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 20px;">Match à venir: ${team1Name} vs ${team2Name}</h1>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                  ${team1NameDisplay} vs ${team2NameDisplay}
                </p>
                <p style="margin: 0 0 10px 0; color: #4b5563;">
                  <span style="font-weight: 600;">Compétition:</span> ${leagueName}<br>
                  <span style="font-weight: 600;">Date:</span> ${matchDate}<br>
                  <span style="font-weight: 600;">Jeu:</span> ${gameName}
                </p>
                <a href="https://notifesport.fr/calendar" 
                   style="display: inline-block; background-color: #2563eb; color: white; 
                          padding: 10px 20px; text-decoration: none; border-radius: 4px; 
                          margin-top: 10px; font-weight: 500;">
                  Voir le calendrier
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                Vous recevez cet email car vous suivez ${gameName} ou ${leagueName}.
                <a href="https://notifesport.fr/settings" 
                   style="color: #2563eb; text-decoration: none; margin-left: 5px;">
                  Gérer mes préférences
                </a>
              </p>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
                <p> 2023 NotifEsport. Tous droits réservés.</p>
                <p>
                  <a href="https://notifesport.fr" style="color: #6b7280; text-decoration: none;">Accueil</a> | 
                  <a href="https://notifesport.fr/settings" style="color: #6b7280; text-decoration: none; margin: 0 10px;">Préférences</a> | 
                  <a href="mailto:support@notifesport.fr" style="color: #6b7280; text-decoration: none;">Support</a>
                </p>
              </div>

            </div>
          `;

          // Ajouter l'email à la file d'attente
          try {
            if (!user.email) {
              throw new Error('Email utilisateur non défini');
            }
            
            const emailTeam1Name = typeof match.team1 === 'string' ? match.team1 : 'Équipe 1';
            const emailTeam2Name = typeof match.team2 === 'string' ? match.team2 : 'Équipe 2';
            const emailSubject = `${emailTeam1Name} vs ${emailTeam2Name} commence bientôt !`;
            
            // Valider le contenu de l'email
            if (!emailSubject || !emailContent) {
              throw new Error('Sujet ou contenu de l\'email invalide');
            }
            
            try {
              const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                  from: 'notifications@notifesport.com',
                  to: user.email,
                  subject: emailSubject,
                  html: emailContent,
                }),
              });

              if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
              }
              
              console.log(`Email envoyé à ${user.email} pour le match ${matchId}`);
              totalNotifications++;
            } catch (error) {
              console.error(`Erreur lors de l'envoi de l'email à ${user.email}:`, error);
            }
            
          } catch (error) {
            const userEmail = user?.email || 'email_non_defini';
            console.error(`Erreur lors de l'ajout de l'email à la file d'attente pour ${userEmail}:`, error);
            // On continue avec le prochain utilisateur même en cas d'échec
            continue;
          }
        } catch (error) {
          const userEmail = (pref?.users?.email) || 'email_non_defini';
          console.error(`Erreur lors de l'envoi de la notification pour ${userEmail}:`, error);
          // On continue avec le prochain utilisateur même en cas d'échec
          continue;
        }
      }
    }
    
    // S'assurer que les valeurs sont valides avant de les utiliser
    const finalMatchCount = Array.isArray(matchesStartingSoon) ? matchesStartingSoon.length : 0;
    const finalNotificationCount = typeof totalNotifications === 'number' ? totalNotifications : 0;
    
    return NextResponse.json({
      message: 'Notifications traitées avec succès',
      matchCount: finalMatchCount,
      notificationCount: finalNotificationCount,
    });
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors du traitement des notifications',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}