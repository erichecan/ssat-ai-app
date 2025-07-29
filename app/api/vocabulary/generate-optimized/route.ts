import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { 
      userId = '00000000-0000-0000-0000-000000000001', 
      batchSize = 50,
      difficulty = 'mixed' 
    } = await request.json()
    
    console.log(`🚀 Starting optimized vocabulary generation: ${batchSize} words`)
    
    const supabaseAdmin = getSupabaseAdmin()
    
    // 1. 获取现有词汇用于去重
    const { data: existingWords, error: fetchError } = await supabaseAdmin
      .from('flashcards')
      .select('word')
      .eq('user_id', userId)
      .eq('type', 'vocabulary')
    
    if (fetchError) {
      console.error('Error fetching existing words:', fetchError)
      return NextResponse.json({ 
        success: false, 
        error: fetchError.message 
      }, { status: 500 })
    }
    
    const existingWordsSet = new Set(
      existingWords?.map(w => w.word?.toLowerCase()) || []
    )
    
    console.log(`Found ${existingWordsSet.size} existing words for deduplication`)
    
    // 2. 简化的AI提示词（提高成功率）
    const optimizedPrompt = `Generate ${batchSize} SAT vocabulary words in JSON format:

{
  "words": [
    {"word": "perspicacious", "definition": "having keen insight", "difficulty": "hard"},
    {"word": "ephemeral", "definition": "lasting very briefly", "difficulty": "medium"},
    {"word": "ubiquitous", "definition": "existing everywhere", "difficulty": "medium"}
  ]
}

Requirements:
- SAT/SSAT level vocabulary words
- Clear, short definitions (5-15 words)
- Mix of difficulty: medium, hard, very hard
- Return only JSON, no other text
- Make sure all words are different and appropriate for test prep

Generate exactly ${batchSize} words.`

    // 3. AI生成词汇
    let attempts = 0
    let generatedWords = []
    const maxAttempts = 3
    
    while (attempts < maxAttempts && generatedWords.length < batchSize) {
      try {
        attempts++
        console.log(`Attempt ${attempts}: Generating words with Gemini AI...`)
        
        const aiResponse = await generateText(optimizedPrompt, 60000) // 60秒超时
        
        // 清理响应
        let cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim()
        if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim()
        }
        
        const parsedResponse = JSON.parse(cleanResponse)
        
        if (parsedResponse.words && Array.isArray(parsedResponse.words)) {
          // 过滤并验证词汇
          const validWords = parsedResponse.words.filter(word => {
            return (
              word.word && 
              word.definition &&
              word.word.length > 2 &&
              word.definition.length > 10 &&
              !existingWordsSet.has(word.word.toLowerCase()) &&
              /^[a-zA-Z]+$/.test(word.word) // 只包含字母
            )
          })
          
          // 去重新生成的词汇
          const uniqueNewWords = []
          const seenWords = new Set()
          
          for (const word of validWords) {
            const lowerWord = word.word.toLowerCase()
            if (!seenWords.has(lowerWord)) {
              seenWords.add(lowerWord)
              uniqueNewWords.push(word)
              existingWordsSet.add(lowerWord) // 防止后续重复
            }
          }
          
          generatedWords.push(...uniqueNewWords)
          console.log(`Attempt ${attempts}: Generated ${uniqueNewWords.length} valid unique words`)
          
          if (generatedWords.length >= batchSize) {
            generatedWords = generatedWords.slice(0, batchSize)
            break
          }
        }
        
      } catch (parseError) {
        console.error(`Attempt ${attempts} failed:`, parseError)
        if (attempts === maxAttempts) {
          throw new Error(`Failed to generate words after ${maxAttempts} attempts`)
        }
      }
    }
    
    if (generatedWords.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate any valid words',
        attempts
      }, { status: 500 })
    }
    
    // 4. 批量插入数据库
    const wordsToInsert = generatedWords.map(word => ({
      user_id: userId,
      word: word.word.toLowerCase(),
      definition: word.definition,
      type: 'vocabulary',
      subject: 'SSAT Vocabulary',
      difficulty_level: word.difficulty === 'medium' ? 2 : word.difficulty === 'very hard' ? 4 : 3,
      question: `What does "${word.word}" mean?`,
      answer: word.definition,
      explanation: word.definition,
      pronunciation: word.pronunciation || '',
      part_of_speech: word.part_of_speech || '',
      example_sentence: word.example || '',
      memory_tip: word.etymology || '',
      synonyms: word.synonyms || [],
      antonyms: [],
      etymology: word.etymology || '',
      category: 'vocabulary',
      frequency_score: 75, // 高质量词汇
      source_type: 'ai_generated_optimized',
      source_context: `Optimized AI generation - ${new Date().toISOString()}`,
      tags: ['vocabulary', 'ssat', 'optimized'],
      is_public: true,
      usage_count: 0,
      avg_rating: 0
    }))
    
    console.log(`Inserting ${wordsToInsert.length} words into database...`)
    
    const { data: insertedWords, error: insertError } = await supabaseAdmin
      .from('flashcards')
      .insert(wordsToInsert)
      .select('word, difficulty_level')
    
    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Failed to insert words into database',
        details: insertError.message,
        generatedCount: generatedWords.length
      }, { status: 500 })
    }
    
    // 5. 统计结果
    const successCount = insertedWords?.length || 0
    
    return NextResponse.json({
      success: true,
      message: `Successfully generated and inserted ${successCount} vocabulary words`,
      stats: {
        requested: batchSize,
        generated: generatedWords.length,
        inserted: successCount,
        attempts,
        duplicatesFiltered: generatedWords.length - successCount
      },
      sampleWords: generatedWords.slice(0, 5).map(w => ({
        word: w.word,
        definition: w.definition,
        difficulty: w.difficulty
      })),
      performance: {
        avgWordsPerAttempt: Math.round(generatedWords.length / attempts),
        successRate: Math.round((successCount / batchSize) * 100) + '%'
      }
    })
    
  } catch (error) {
    console.error('Optimized generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Optimized vocabulary generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for testing and configuration
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const testMode = searchParams.get('test') === 'true'
  
  if (testMode) {
    // 测试模式：生成5个词汇
    return POST(new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchSize: 5, userId: '00000000-0000-0000-0000-000000000001' })
    }))
  }
  
  return NextResponse.json({
    success: true,
    info: {
      endpoint: 'Optimized Vocabulary Generation API',
      features: [
        'Advanced deduplication',
        'Optimized AI prompts',
        'Quality validation',
        'Batch processing',
        'Error recovery'
      ],
      usage: {
        POST: 'Generate vocabulary words',
        'GET?test=true': 'Test generation with 5 words'
      },
      parameters: {
        batchSize: 'Number of words to generate (default: 50)',
        userId: 'User ID (default: demo user)',
        difficulty: 'Word difficulty preference (default: mixed)'
      }
    }
  })
}