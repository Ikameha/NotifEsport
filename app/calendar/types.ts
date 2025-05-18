// General filter types
export type Game = "lol" | "valorant" | "csgo" | "rl" | "dota2" | "all";
export type League = string;
export type MatchStatus = "upcoming" | "live" | "completed" | "all";
export type DateFilter = "all" | "today" | "tomorrow" | "thisWeek" | "nextWeek";
export type ViewMode = "list" | "calendar" | "week";
export type SortOption = "time" | "league" | "game";

// Specific types for Match structure
export type TeamStats = {
  winRate: number;
  streak: string; // ex: "W3" ou "L2"
  lastGames: ("W" | "L")[];
  ranking?: number;
};

export type Match = {
  id: number;
  team1: {
    name: string;
    logo: string;
    score?: number;
    stats?: TeamStats;
  };
  team2: {
    name: string;
    logo: string;
    score?: number;
    stats?: TeamStats;
  };
  date: string;
  dateObj: Date; // Pour faciliter les manipulations de date
  time: string;
  league: League; // Uses the League type from above
  league_slug?: string; // Slug de la ligue pour le filtrage
  game: "lol" | "valorant" | "csgo" | "rl" | "dota2"; // Specific to a match
  status: "upcoming" | "live" | "completed"; // Specific to a match
  streamUrl?: string; // URL du stream Twitch ou YouTube
};
