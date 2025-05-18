import { NextResponse } from 'next/server';
import { fetchPandaScore } from '../../../../../lib/pandascore';

export async function GET(request: Request) {
  try {
    const matches = await fetchPandaScore('/csgo/matches/running', {
      sort: 'begin_at',
      per_page: 50,
    });
    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error in API route /api/matches/csgo/running:", error);
    return NextResponse.json(
      { error: 'Failed to fetch running CS:GO matches', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
