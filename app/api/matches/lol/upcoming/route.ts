import { NextResponse } from 'next/server';
import { fetchPandaScore } from '../../../../../lib/pandascore';

export async function GET(request: Request) {
  try {
    // Fetch upcoming LoL matches. 
    // You can customize pagination with page and per_page parameters in the options.
    // Sorting by 'begin_at' to get the soonest matches first.
    const matches = await fetchPandaScore('/lol/matches/upcoming', {
      sort: 'begin_at',
      per_page: 50, // Adjust as needed
    });
    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error in API route /api/matches/lol/upcoming:", error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming LoL matches', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}
