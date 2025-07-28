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
      .from('test_questions')
      .select('*')
      .eq('question_type', 'essay')
      .eq('subject', 'Writing Prompts')
      .order('created_at', { ascending: false });

    if (difficulty) {
      const difficultyLevel = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
      query = query.eq('difficulty_level', difficultyLevel);
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
      .from('test_questions')
      .insert({
        type: 'vocabulary',
        subject: 'Writing Prompts', 
        difficulty_level: promptData.difficulty === 'easy' ? 1 : promptData.difficulty === 'medium' ? 2 : 3,
        question_text: promptData.prompt_text,
        question_type: 'essay',
        correct_answer: `This is a ${promptData.prompt_type?.toLowerCase() || 'writing'} essay prompt.`,
        explanation: `This prompt tests writing skills.`,
        time_limit_seconds: 1500,
        points: 25
      })
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