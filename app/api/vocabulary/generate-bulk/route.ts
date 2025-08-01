import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, batchSize = 50, totalTarget = 3000 } = await request.json()
    
    // Fix UUID format for demo user - 2024-12-19 17:15:00
    let finalUserId = userId
    if (!userId || userId === 'demo-user-123') {
      finalUserId = '00000000-0000-0000-0000-000000000001' // Valid UUID format for demo user
    }
    
    console.log(`Starting bulk vocabulary generation: ${totalTarget} words in batches of ${batchSize} for user: ${finalUserId}`)
    
    // 检查环境变量
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('Missing GOOGLE_GEMINI_API_KEY')
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Database service not configured' },
        { status: 500 }
      )
    }

    // 使用admin客户端绕过RLS策略
    const supabaseAdmin = getSupabaseAdmin()

    // 检查现有词汇数量
    const { data: existingWords, error: countError } = await supabaseAdmin
      .from('flashcards')
      .select('word')
      .eq('user_id', finalUserId)
      .eq('type', 'vocabulary')

    if (countError) {
      console.error('Error counting existing words:', countError)
    }

    const existingCount = existingWords?.length || 0
    const remainingWords = Math.max(0, totalTarget - existingCount)
    
    console.log(`Existing words: ${existingCount}, Target: ${totalTarget}, Remaining: ${remainingWords}`)

    if (remainingWords <= 0) {
      return NextResponse.json({
        success: true,
        message: `Already have ${existingCount} words, target reached!`,
        existingCount,
        totalTarget
      })
    }

    // 分批生成避免超时 - 增加每批词汇数量
    const actualBatchSize = Math.min(batchSize, 5) // 每批最多5个词
    const maxWordsPerRequest = Math.min(remainingWords, 30) // 单次请求最多30个词
    const numBatches = Math.ceil(maxWordsPerRequest / actualBatchSize)

    // 简化的AI提示词，更可靠
    const prompt = `Generate ${actualBatchSize} SSAT vocabulary words as JSON:

{
  "words": [
    {
      "word": "perspicacious",
      "definition": "Having keen insight and understanding",
      "pronunciation": "/ˌpɜːrspɪˈkeɪʃəs/",
      "part_of_speech": "adjective",
      "difficulty": "hard",
      "example_sentence": "The perspicacious student quickly understood the complex problem.",
      "synonyms": ["perceptive", "insightful"],
      "antonyms": ["obtuse", "dull"],
      "memory_tip": "Think of 'perspective' - someone with good perspective is perspicacious"
    }
  ]
}

Requirements:
- SSAT/SAT level words
- Clear definitions
- Valid pronunciation guides
- Real example sentences

Return only valid JSON.`

    let generatedWords = []
    let successfulBatches = 0
    let totalGenerated = 0
    
    for (let batch = 0; batch < numBatches; batch++) {
      try {
        console.log(`Generating batch ${batch + 1}/${numBatches}...`)
        
        const aiResponse = await generateText(prompt, 45000) // 45秒超时，给AI足够时间生成词汇
        const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim()
        const parsedResponse = JSON.parse(cleanResponse)

        if (parsedResponse.words && Array.isArray(parsedResponse.words)) {
          const batchWords = parsedResponse.words.filter((word: any) => 
            word.word && word.definition && word.pronunciation
          )

          // 插入到数据库 - 使用简化的字段结构
          const wordsToInsert = batchWords.map((word: any) => ({
            user_id: finalUserId,
            word: word.word.toLowerCase(),
            definition: word.definition,
            type: 'vocabulary',
            subject: 'SSAT Vocabulary',
            difficulty_level: word.difficulty === 'easy' ? 1 : word.difficulty === 'hard' ? 3 : 2,
            question: `What does "${word.word}" mean?`,
            answer: word.definition,
            explanation: word.definition,
            pronunciation: word.pronunciation || '',
            part_of_speech: word.part_of_speech || '',
            example_sentence: word.example_sentence || '',
            memory_tip: word.memory_tip || '',
            synonyms: word.synonyms || [],
            antonyms: word.antonyms || [],
            etymology: '',
            category: 'vocabulary',
            frequency_score: 50,
            source_type: 'ai_generated',
            source_context: `AI generated vocabulary - batch ${batch + 1}`,
            tags: ['vocabulary', 'ssat'],
            is_public: true,
            usage_count: 0,
            avg_rating: 0
          }))

          console.log(`Attempting to insert ${wordsToInsert.length} words into database...`)
          console.log('Sample word to insert:', JSON.stringify(wordsToInsert[0], null, 2))

          const { data: insertedWords, error: insertError } = await supabaseAdmin
            .from('flashcards')
            .insert(wordsToInsert)
            .select('word')

          if (insertError) {
            console.error(`Batch ${batch + 1} insert error:`, {
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code
            })
            console.error('Failed to insert words:', wordsToInsert.map((w: any) => w.word))
          } else {
            successfulBatches++
            totalGenerated += insertedWords?.length || 0
            console.log(`Batch ${batch + 1} completed: ${insertedWords?.length} words inserted`)
            console.log('Inserted words:', insertedWords?.map(w => w.word))
            generatedWords.push(...batchWords)
          }
        }

        // 短暂延迟避免API限制
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (batchError) {
        console.error(`Batch ${batch + 1} failed:`, batchError)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk vocabulary generation completed`,
      stats: {
        batchesProcessed: numBatches,
        successfulBatches,
        totalGenerated,
        existingWords: existingCount,
        newTotal: existingCount + totalGenerated,
        targetRemaining: Math.max(0, totalTarget - existingCount - totalGenerated)
      },
      sampleWords: generatedWords.slice(0, 5).map((w: any) => ({
        word: w.word,
        definition: w.definition,
        difficulty: w.difficulty
      }))
    })

  } catch (error) {
    console.error('Bulk vocabulary generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate bulk vocabulary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // Fix UUID format for demo user - 2024-12-19 17:15:00
    let finalUserId = userId
    if (!userId || userId === 'demo-user-123') {
      finalUserId = '00000000-0000-0000-0000-000000000001' // Valid UUID format for demo user
    }
    
    console.log('Fetching vocabulary stats for user:', finalUserId)
    
    // 检查数据库配置
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase configuration in GET endpoint')
      return NextResponse.json({ 
        error: 'Database service not configured',
        success: false 
      }, { status: 500 })
    }

    // 使用admin客户端绕过RLS策略
    const supabaseAdmin = getSupabaseAdmin()

    const { data: words, error } = await supabaseAdmin
      .from('flashcards')
      .select('word, difficulty_level, category, source_type, created_at')
      .eq('user_id', finalUserId)
      .eq('type', 'vocabulary')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vocabulary stats:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ 
        error: 'Failed to fetch stats',
        details: error.message,
        success: false 
      }, { status: 500 })
    }
    
    console.log(`Found ${words?.length || 0} vocabulary words for user ${finalUserId}`)

    const stats = {
      total: words?.length || 0,
      byDifficulty: {
        easy: words?.filter(w => w.difficulty_level === 1).length || 0,
        medium: words?.filter(w => w.difficulty_level === 2).length || 0,
        hard: words?.filter(w => w.difficulty_level === 3).length || 0
      },
      bySource: {
        static: words?.filter(w => w.source_type === 'static_import').length || 0,
        aiGenerated: words?.filter(w => w.source_type === 'ai_generated_ssat').length || 0,
        userAdded: words?.filter(w => w.source_type === 'user_added').length || 0
      },
      recent: words?.slice(0, 10) || []
    }

    return NextResponse.json({
      success: true,
      stats,
      progressToTarget: {
        current: stats.total,
        target: 3000,
        percentage: Math.round((stats.total / 3000) * 100)
      }
    })

  } catch (error) {
    console.error('Vocabulary stats error:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}