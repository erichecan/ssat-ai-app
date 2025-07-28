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
      .from('knowledge_base')
      .select('*')
      .eq('type', 'concept')
      .order('created_at', { ascending: false });

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data: articles, error } = await query.limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({ articles: articles || [] });

  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const articleData = await request.json();
    
    const { data: article, error } = await supabase
      .from('knowledge_base')
      .insert({
        ...articleData,
        type: 'concept'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ article });

  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}