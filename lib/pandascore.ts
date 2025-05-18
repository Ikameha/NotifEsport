// lib/pandascore.ts

const PANDASCORE_API_URL = "https://api.pandascore.co";
const API_KEY = process.env.PANDASCORE_API_KEY;

interface FetchPandaScoreOptions {
  token?: string;
  page?: number;
  per_page?: number;
  sort?: string;
  filter?: Record<string, any>;
  range?: Record<string, any>;
  search?: Record<string, any>;
}

export async function fetchPandaScore(endpoint: string, options: FetchPandaScoreOptions = {}) {
  if (!API_KEY) {
    throw new Error("PandaScore API key is not configured. Please set PANDASCORE_API_KEY in your environment variables.");
  }

  const url = new URL(`${PANDASCORE_API_URL}${endpoint}`);
  
  // Add query parameters from options
  if (options.page) url.searchParams.append("page", options.page.toString());
  if (options.per_page) url.searchParams.append("per_page", options.per_page.toString());
  if (options.sort) url.searchParams.append("sort", options.sort);
  if (options.filter) {
    Object.entries(options.filter).forEach(([key, value]) => {
      url.searchParams.append(`filter[${key}]`, value.toString());
    });
  }
  if (options.range) {
    Object.entries(options.range).forEach(([key, value]) => {
      url.searchParams.append(`range[${key}]`, value.toString());
    });
  }
  if (options.search) {
    Object.entries(options.search).forEach(([key, value]) => {
      url.searchParams.append(`search[${key}]`, value.toString());
    });
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("PandaScore API Error:", errorData);
      throw new Error(`PandaScore API request failed with status ${response.status}: ${errorData.error || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching data from PandaScore:", error);
    throw error;
  }
}

// Types pour les données brutes de l'API PandaScore
// IMPORTANT: Ces structures sont des suppositions basées sur des conventions communes.
// VEUILLEZ VÉRIFIER ET AJUSTER AVEC LA DOCUMENTATION OFFICIELLE DE PANDASCORE OU LES DONNÉES RÉELLES DE L'API.


// Types pour les données brutes de l'API PandaScore
// IMPORTANT: Ces structures sont des suppositions basées sur des conventions communes.
// VEUILLEZ VÉRIFIER ET AJUSTER AVEC LA DOCUMENTATION OFFICIELLE DE PANDASCORE OU LES DONNÉES RÉELLES DE L'API.

export interface PandaScoreTeam {
  id: number;
  name: string;
  image_url: string | null;
  // slug: string; // Souvent présent
  // acronym: string | null; // Souvent présent
}

export interface PandaScoreLeague {
  id: number;
  name: string;
  image_url: string | null;
  slug: string;
}

export interface PandaScoreGame { // Dans PandaScore, cela s'appelle souvent "videogame"
  id: number;
  name: string; // e.g., "League of Legends", "Valorant"
  slug: string; // e.g., "lol", "valorant"
}

export interface PandaScoreOpponentContainer { // Structure typique pour les opposants
  opponent: PandaScoreTeam;
  // type: "team" | "player"; // Peut exister
  // score: number | null; // Le score est parfois ici, ou dans un objet 'results' séparé
}

export interface PandaScoreStream {
  language: string;
  main: boolean;
  official: boolean;
  raw_url: string;
  // embed_url: string | null;
}

export interface PandaScoreResult {
  team_id: number | null; // L'ID de l'équipe concernée par ce score
  score: number;
}

export interface PandaScoreMatch {
  id: number;
  name: string; // Souvent une description comme "Team A vs Team B"
  scheduled_at: string | null; // Date ISO UTC
  begin_at: string | null; // Date ISO UTC, quand le match a réellement commencé
  end_at: string | null; // Date ISO UTC, quand le match s'est terminé
  status: 'canceled' | 'finished' | 'not_started' | 'postponed' | 'running'; // Statuts de PandaScore
  league_id: number;
  league: PandaScoreLeague;
  serie_id: number;
  // serie: PandaScoreSerie; // Pourrait exister
  tournament_id: number;
  // tournament: PandaScoreTournament; // Pourrait exister
  videogame: PandaScoreGame;
  opponents: PandaScoreOpponentContainer[]; // Typiquement un tableau de deux équipes
  results: PandaScoreResult[]; // Scores finaux
  streams_list?: PandaScoreStream[];
  live_embed_url?: string | null;
  // ... et potentiellement beaucoup d'autres champs
}

// Importation de nos types internes
// Le chemin est relatif à lib/pandascore.ts
import { Match, League as OurLeagueInternal, TeamStats, Game as OurGameInternal } from '../app/calendar/types';

// Fonction pour obtenir les stats d'une équipe (à implémenter si besoin)
function getTeamStats(apiTeamData: PandaScoreTeam | undefined /*, autresDonneesApi?: any*/): TeamStats | undefined {
  // Pour l'instant, on ne dérive pas de stats complexes depuis l'API pour cet exemple
  // Si l'API PandaScore fournit directement winRate, streak etc. pour une équipe dans le contexte du match,
  // on pourrait les mapper ici. Sinon, ces stats sont généralement calculées séparément.
  return undefined; // ou une structure par défaut si nécessaire
}

// Fonction de transformation principale
export function transformPandaScoreMatch(apiMatch: PandaScoreMatch): Match | null {
  if (!apiMatch || !apiMatch.opponents || apiMatch.opponents.length !== 2) {
    // console.warn('Invalid match data from API (missing opponents), skipping:', apiMatch);
    return null;
  }

  const team1Container = apiMatch.opponents[0];
  const team2Container = apiMatch.opponents[1];

  if (!team1Container?.opponent || !team2Container?.opponent) {
    // console.warn('Invalid match data from API (missing opponent details), skipping:', apiMatch);
    return null;
  }
  
  const team1Data = team1Container.opponent;
  const team2Data = team2Container.opponent;
  
  const scheduledAt = apiMatch.scheduled_at || apiMatch.begin_at; // Utiliser scheduled_at ou begin_at
  if (!scheduledAt) {
    // console.warn('Invalid match data from API (missing date), skipping:', apiMatch);
    return null; // Un match sans date n'est pas très utile
  }
  const dateObj = new Date(scheduledAt);

  let ourStatus: 'upcoming' | 'live' | 'completed';
  switch (apiMatch.status) {
    case 'finished':
      ourStatus = 'completed';
      break;
    case 'running':
      ourStatus = 'live';
      break;
    case 'not_started':
    case 'postponed': // On peut considérer postponed comme upcoming pour l'instant
      ourStatus = 'upcoming';
      break;
    case 'canceled':
      return null; // On ignore les matchs annulés
    default:
      // console.warn(`Unknown API match status: ${apiMatch.status}`, apiMatch);
      return null; // Ignorer les statuts inconnus
  }

  let gameName: OurGameInternal;
  // PandaScore utilise des slugs comme "lol", "valorant", "csgo", "dota-2", "rl"
  // Notre type Game est "lol" | "valorant" | "csgo" | "rl" | "dota2" | "all"
  const apiGameSlug = apiMatch.videogame.slug.toLowerCase();
  if (apiGameSlug === 'lol' || apiGameSlug === 'league-of-legends') gameName = 'lol';
  else if (apiGameSlug === 'valorant') gameName = 'valorant';
  else if (apiGameSlug === 'csgo' || apiGameSlug === 'cs-go' || apiGameSlug === 'counter-strike-global-offensive') gameName = 'csgo';
  else if (apiGameSlug === 'rl' || apiGameSlug === 'rocket-league') gameName = 'rl';
  else if (apiGameSlug === 'dota2' || apiGameSlug === 'dota-2') gameName = 'dota2';
  else {
    // console.warn(`Unknown videogame slug: ${apiGameSlug}`, apiMatch);
    return null; // Si le jeu n'est pas géré, on ignore le match
  }
  
  // Pour la ligue, c'est plus complexe car nos types sont des noms spécifiques (LEC, LFL etc.)
  // L'API renvoie un objet `league` avec `id`, `name`, `slug`.
  // Il faudrait une logique de mappage plus robuste ici, peut-être basée sur `league.id` ou `league.slug`.
  // Pour l'instant, on utilise un placeholder ou le nom de la ligue de l'API si possible.
  // Notre type League est "LEC" | "LFL" | "VCT EMEA" | "VCT Americas" | "LCK" | "all"
  // C'est un exemple simpliste, à améliorer GRANDEMENT.
  

  const team1ApiScore = apiMatch.results?.find(r => r.team_id === team1Data.id)?.score;
  const team2ApiScore = apiMatch.results?.find(r => r.team_id === team2Data.id)?.score;

  return {
    id: apiMatch.id,
    team1: {
      name: team1Data.name || 'Team 1',
      logo: team1Data.image_url || '/placeholder.svg',
      score: team1ApiScore,
      stats: getTeamStats(team1Data),
    },
    team2: {
      name: team2Data.name || 'Team 2',
      logo: team2Data.image_url || '/placeholder.svg',
      score: team2ApiScore,
      stats: getTeamStats(team2Data),
    },
    date: dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    dateObj,
    time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    league: apiMatch.league.name,
    league_slug: apiMatch.league.slug,
    game: gameName,
    status: ourStatus,
    streamUrl: apiMatch.streams_list?.find(s => s.main && s.official)?.raw_url || apiMatch.streams_list?.find(s => s.main)?.raw_url || apiMatch.live_embed_url || undefined,
  };
}
