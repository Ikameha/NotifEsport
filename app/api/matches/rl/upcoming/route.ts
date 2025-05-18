import { NextResponse } from 'next/server';
import { fetchPandaScore } from '../../../../../lib/pandascore';

export async function GET(request: Request) {
  try {
    const matches = await fetchPandaScore('/rl/matches/upcoming', { // Changé pour /rl/
      sort: 'begin_at',
      per_page: 50,
    });
    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error in API route /api/matches/rl/upcoming:", error); // Changé pour /rl/
    return NextResponse.json(
      { error: 'Failed to fetch upcoming Rocket League matches', details: error instanceof Error ? error.message : String(error) }, // Changé pour Rocket League
      { status: 500 }
    );
  }
}
