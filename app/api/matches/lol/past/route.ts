import { NextResponse } from 'next/server';
import { fetchPandaScore } from '../../../../../lib/pandascore';

export async function GET(request: Request) {
  try {
    const matches = await fetchPandaScore('/lol/matches/past', {
      sort: '-end_at', // Sort by most recently ended
      per_page: 50,
    });
    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error in API route /api/matches/lol/past:", error);
    return NextResponse.json(
      { error: 'Failed to fetch past LoL matches', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
