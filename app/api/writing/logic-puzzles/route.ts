import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('logic_puzzles')
      .select('*')
      .order('created_at', { ascending: false });

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data: puzzles, error } = await query.limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({ puzzles: puzzles || [] });

  } catch (error) {
    console.error('Error fetching logic puzzles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const puzzleData = await request.json();
    
    const { data: puzzle, error } = await supabase
      .from('logic_puzzles')
      .insert(puzzleData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ puzzle });

  } catch (error) {
    console.error('Error creating logic puzzle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}