import { fetchPandaScore } from './pandascore';

export async function getUpcomingMatches() {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Formater les dates au format attendu par l'API (sans millisecondes)
    const formatDateForAPI = (date: Date) => date.toISOString().split('.')[0] + 'Z';
    
    const matches = await fetchPandaScore('/matches/upcoming', {
      // Utiliser les paramètres de plage directement dans l'URL
      range: `begin_at=${formatDateForAPI(now)},${formatDateForAPI(in24Hours)}`,
      sort: 'begin_at',
      per_page: 50
    });

    return matches || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs PandaScore:', error);
    return [];
  }
}
