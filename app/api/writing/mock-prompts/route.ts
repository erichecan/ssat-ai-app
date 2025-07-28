import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('mock_test_prompts')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('prompt_type', type);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data: prompts, error } = await query.limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({ prompts: prompts || [] });

  } catch (error) {
    console.error('Error fetching mock prompts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const promptData = await request.json();
    
    const { data: prompt, error } = await supabase
      .from('mock_test_prompts')
      .insert(promptData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ prompt });

  } catch (error) {
    console.error('Error creating mock prompt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}