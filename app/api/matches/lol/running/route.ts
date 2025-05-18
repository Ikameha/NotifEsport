import { NextResponse } from 'next/server';
import { fetchPandaScore } from '../../../../../lib/pandascore';

export async function GET(request: Request) {
  try {
    const matches = await fetchPandaScore('/lol/matches/running', {
      sort: 'begin_at',
      per_page: 50,
    });
    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error in API route /api/matches/lol/running:", error);
    return NextResponse.json(
      { error: 'Failed to fetch running LoL matches', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
