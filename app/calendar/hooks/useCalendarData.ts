import { useState, useEffect, useCallback } from 'react';
import { Match } from '../types'; // Import Match type
import { PandaScoreMatch, transformPandaScoreMatch } from '../../../lib/pandascore'; // Import from lib

interface UseCalendarDataReturn {
  matches: Match[];
  isLoading: boolean;
  error: string | null;
}

export function useCalendarData(): UseCalendarDataReturn {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllMatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const endpoints = [
      '/api/matches/lol/upcoming',
      '/api/matches/lol/running',
      '/api/matches/lol/past',
      '/api/matches/valorant/upcoming',
      '/api/matches/valorant/running',
      '/api/matches/valorant/past',
      '/api/matches/rl/upcoming',
      '/api/matches/rl/running',
      '/api/matches/rl/past',
      '/api/matches/csgo/upcoming', // Ajouté
      '/api/matches/csgo/running',  // Ajouté
      '/api/matches/csgo/past',     // Ajouté
    ];

    try {
      const results = await Promise.allSettled(
        endpoints.map(endpoint =>
          fetch(endpoint).then(res => {
            if (!res.ok) {
              throw new Error(`Failed to fetch ${endpoint}: ${res.status} ${res.statusText}`);
            }
            return res.json();
          })
        )
      );

      let allMatches: Match[] = [];
      let fetchErrors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const rawMatches = result.value as PandaScoreMatch[];
          // Ensure transformPandaScoreMatch handles potential undefined fields gracefully
          const transformed = rawMatches.map(match => transformPandaScoreMatch(match)).filter(m => m !== null) as Match[];
          allMatches = allMatches.concat(transformed);
        } else {
          console.error(`Error fetching from ${endpoints[index]}:`, result.reason);
          fetchErrors.push(result.reason?.message || `Unknown error fetching ${endpoints[index]}`);
        }
      });

      if (fetchErrors.length > 0 && allMatches.length === 0) {
        setError(`Failed to fetch all match data. Errors: ${fetchErrors.join(', ')}`);
      } else if (fetchErrors.length > 0) {
        // Partial success, log errors but proceed with fetched data
        console.warn(`Some match data failed to load: ${fetchErrors.join(', ')}`);
      }
      
      setMatches(allMatches);

    } catch (e: any) {
      console.error("Error in fetchAllMatches:", e);
      setError(e.message || 'An unexpected error occurred while fetching matches.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllMatches();
  }, [fetchAllMatches]);

  return { matches, isLoading, error };
}
