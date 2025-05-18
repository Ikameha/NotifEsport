import { useState, useEffect } from 'react';

export interface PandaLeague {
  id: number;
  name: string;
  slug: string;
  image_url?: string | null;
}

interface UseGameLeaguesReturn {
  leagues: PandaLeague[];
  isLoadingLeagues: boolean;
  leaguesError: Error | null;
}

const API_SLUG_MAP: { [key: string]: string } = {
  lol: "league-of-legends",
  csgo: "cs-go",
};

export const useGameLeagues = (gameSlug: string): UseGameLeaguesReturn => {
  const [leagues, setLeagues] = useState<PandaLeague[]>([]);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState<boolean>(false);
  const [leaguesError, setLeaguesError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLeaguesData = async () => {
      if (!gameSlug || gameSlug === 'all' || !process.env.NEXT_PUBLIC_PANDA_API_TOKEN) {
        console.log(
          `[useGameLeagues] Early exit: slug='${gameSlug}', tokenPresent=${!!process.env.NEXT_PUBLIC_PANDA_API_TOKEN}`
        );
        setLeagues([]);
        setIsLoadingLeagues(false);
        setLeaguesError(null);
        return;
      }

      // Bloc temporaire supprimé

      console.log(`[useGameLeagues] Fetching leagues for game slug: ${gameSlug}`);
      setIsLoadingLeagues(true);
      setLeaguesError(null);

      const apiSlugToUse = API_SLUG_MAP[gameSlug] || gameSlug;
      const currentPandaApiToken = process.env.NEXT_PUBLIC_PANDA_API_TOKEN;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_PANDA_API_URL}/videogames/${apiSlugToUse}/leagues?sort=name&per_page=100`,
          {
            headers: {
              Authorization: `Bearer ${currentPandaApiToken}`,
              Accept: 'application/json',
            },
          }
        );

        console.log(
          `[useGameLeagues] API Request for ${gameSlug} (using ${apiSlugToUse}): ${process.env.NEXT_PUBLIC_PANDA_API_URL}/videogames/${apiSlugToUse}/leagues?sort=name&per_page=100`
        );
        console.log(
          `[useGameLeagues] API Response Status for ${gameSlug}: ${response.status}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `[useGameLeagues] API Error for ${gameSlug} (slug ${apiSlugToUse}). Status: ${response.status}. Response: ${errorText}`
          );
          let errorMessage = `Failed to fetch leagues for ${gameSlug}. Status: ${response.status}`;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = `${errorMessage}. Message: ${errorData.error || errorText}`;
          } catch (e) {
            errorMessage = `${errorMessage}. Message: ${errorText}`;
          }
          setLeaguesError(new Error(errorMessage));
          setLeagues([]);
          setIsLoadingLeagues(false);
          return;
        }

        const data: PandaLeague[] = await response.json();
        console.log(`[useGameLeagues] Data received for ${gameSlug}:`, data.length);

        const validLeagues = data.filter(
          (league) => league && league.name && league.slug && league.image_url
        );
        console.log(
          `[useGameLeagues] Valid leagues for ${gameSlug} (after filtering): ${validLeagues.length}`
        );
        setLeagues(validLeagues);

      } catch (error) {
        console.error(`[useGameLeagues] Catch block error for ${gameSlug}:`, error);
        setLeaguesError(
          new Error(
            `Network or other error fetching leagues for ${gameSlug}: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        setLeagues([]);
      } finally {
        setIsLoadingLeagues(false);
      }
    };

    fetchLeaguesData();
  }, [gameSlug]); // Dépendance unique: gameSlug

  return { leagues, isLoadingLeagues, leaguesError };
};

export default useGameLeagues;
