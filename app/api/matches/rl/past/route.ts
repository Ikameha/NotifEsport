import { NextResponse } from 'next/server';
import { fetchPandaScore } from '../../../../../lib/pandascore';

export async function GET(request: Request) {
  try {
    const matches = await fetchPandaScore('/rl/matches/past', { // Endpoint pour past
      sort: '-end_at', // Tri par fin la plus récente
      per_page: 50,
    });
    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error in API route /api/matches/rl/past:", error);
    return NextResponse.json(
      { error: 'Failed to fetch past Rocket League matches', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
