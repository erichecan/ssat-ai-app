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
      .eq('topic', 'SSAT Writing Practice') // 只获取专门为写作练习生成的文章
      .order('created_at', { ascending: false });

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data: rawArticles, error } = await query.limit(limit);

    if (error) {
      throw error;
    }

    // 将数据库格式转换为前端期望的格式
    const articles = (rawArticles || []).map(article => ({
      id: article.id,
      title: article.title,
      content: article.content,
      topic: article.source?.replace('AI Generated - ', '') || 'General', // 从source中提取原始主题
      description: article.content.split('.')[0] + '.', // 使用第一句话作为概括的临时方案
      tags: article.tags || [],
      difficulty: article.difficulty,
      created_at: article.created_at,
      updated_at: article.updated_at
    }));

    return NextResponse.json({ articles });

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