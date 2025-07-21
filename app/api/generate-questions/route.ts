import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'
import { supabase } from '@/lib/supabase'

interface Question {
  id: string
  type: 'vocabulary' | 'reading' | 'math' | 'writing'
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('API called: generate-questions at', new Date().toISOString())
    console.log('Environment:', process.env.NODE_ENV)
    
    const body = await request.json()
    const { userId, questionType = 'mixed', count = 5 } = body
    console.log('Request data:', { userId, questionType, count })

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // 获取用户上传的知识库内容
    console.log('Fetching user uploaded materials...')
    const { data: knowledgeData, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .select('*')
      .contains('tags', [userId])
      .limit(10)

    if (knowledgeError) {
      console.error('Knowledge fetch error:', knowledgeError)
    } else {
      console.log('Found', knowledgeData?.length || 0, 'knowledge entries for user')
    }

    // 获取用户的答题历史以了解弱点
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select(`
        *,
        questions!inner(type, difficulty)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (answersError) {
      console.error('User answers fetch error:', answersError)
    } else {
      console.log('Found', userAnswers?.length || 0, 'user answers for analysis')
    }

    // 构建基于用户材料的提示词
    const contextContent = knowledgeData && knowledgeData.length > 0 
      ? knowledgeData.map(kb => `${kb.title}: ${kb.content}`).join('\n\n')
      : ''

    const userWeaknesses = analyzeUserWeaknesses(userAnswers || [])
    
    let prompt = `Generate ${count} SSAT questions in JSON format based on the following study materials:`

    if (contextContent) {
      prompt += `

UPLOADED STUDY MATERIALS:
${contextContent.substring(0, 2000)}${contextContent.length > 2000 ? '\n... (content truncated)' : ''}

USER PERFORMANCE ANALYSIS:
${userWeaknesses}

Create questions that test understanding of the uploaded materials. Focus on:
- Key concepts and vocabulary from the materials
- Reading comprehension based on the content
- Math problems that relate to examples in the materials
- Areas where the user needs improvement`
    } else {
      prompt += `

No specific study materials uploaded. Generate general SSAT questions focusing on:
${userWeaknesses}`
    }

    prompt += `

Response format (JSON only):
{
  "questions": [
    {
      "id": "q1",
      "type": "vocabulary",
      "question": "Question text here",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Brief explanation"
    }
  ]
}

Generate exactly ${count} questions. Mix vocabulary, math, reading types.`

    // 首先尝试AI生成，如果失败使用备用题目
    let aiResponse: string
    try {
      console.log('Calling Gemini API with 12s timeout...')
      aiResponse = await generateText(prompt, 12000) // 12秒超时
      console.log('AI response received, length:', aiResponse.length)
    } catch (aiError) {
      console.log('AI generation failed, using fallback questions:', aiError)
      return getFallbackQuestions(count)
    }
    
    try {
      // 尝试解析AI响应为JSON
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim()
      const parsedResponse = JSON.parse(cleanResponse)
      
      if (parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
        // 为每个问题添加唯一ID
        const questionsWithIds = parsedResponse.questions.map((q: any, index: number) => ({
          ...q,
          id: `ai_${Date.now()}_${index}`,
          generatedAt: new Date().toISOString()
        }))

        return NextResponse.json({
          success: true,
          questions: questionsWithIds,
          metadata: {
            generatedAt: new Date().toISOString(),
            basedOnUserMaterials: (knowledgeData?.length || 0) > 0,
            userMaterialsCount: knowledgeData?.length || 0,
            userHistoryAnalyzed: (userAnswers?.length || 0) > 0,
            userWeaknesses: userWeaknesses,
            isFallback: false
          }
        })
      } else {
        throw new Error('Invalid response format from AI')
      }
    } catch (parseError) {
      console.error('AI response parsing error:', parseError)
      console.log('Raw AI response:', aiResponse)
      
      // 如果AI响应解析失败，返回错误但包含原始响应用于调试
      return NextResponse.json(
        { 
          error: 'Failed to parse AI response',
          details: 'AI generated content but in unexpected format',
          rawResponse: aiResponse.substring(0, 500) + '...'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error generating questions:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function analyzeUserWeaknesses(userAnswers: any[]): string {
  if (!userAnswers || userAnswers.length === 0) {
    return 'No previous performance data available. Generate a balanced mix of question types.'
  }

  const typeStats: { [key: string]: { correct: number, total: number } } = {}
  const difficultyStats: { [key: string]: { correct: number, total: number } } = {}

  userAnswers.forEach(answer => {
    const type = answer.questions?.type || 'unknown'
    const difficulty = answer.questions?.difficulty || 'medium'
    
    if (!typeStats[type]) typeStats[type] = { correct: 0, total: 0 }
    if (!difficultyStats[difficulty]) difficultyStats[difficulty] = { correct: 0, total: 0 }
    
    typeStats[type].total++
    difficultyStats[difficulty].total++
    
    if (answer.is_correct) {
      typeStats[type].correct++
      difficultyStats[difficulty].correct++
    }
  })

  const weakTypes = Object.entries(typeStats)
    .filter(([_, stats]) => stats.total >= 3 && (stats.correct / stats.total) < 0.7)
    .map(([type, stats]) => `${type} (${Math.round(stats.correct / stats.total * 100)}%)`)

  const analysis = [
    `Recent performance across ${userAnswers.length} questions:`,
    weakTypes.length > 0 ? `Weak areas: ${weakTypes.join(', ')}` : 'No clear weak areas identified',
    'Focus questions on identified weak areas to help improve performance.'
  ].join('\n')

  return analysis
}

// 备用题目生成函数
function getFallbackQuestions(count: number) {
  const fallbackQuestions: Question[] = [
    {
      id: 'fallback_1',
      type: 'vocabulary',
      question: "Which word is closest in meaning to 'abundant'?",
      options: ["Scarce", "Plentiful", "Difficult", "Simple"],
      correctAnswer: "Plentiful",
      explanation: "Abundant means existing in large quantities; plentiful."
    },
    {
      id: 'fallback_2',
      type: 'math',
      question: "If x + 8 = 15, what is x?",
      options: ["7", "8", "15", "23"],
      correctAnswer: "7",
      explanation: "To solve x + 8 = 15, subtract 8 from both sides: x = 7."
    },
    {
      id: 'fallback_3',
      type: 'vocabulary',
      question: "What does 'meticulous' mean?",
      options: ["Careless", "Very careful and precise", "Fast", "Loud"],
      correctAnswer: "Very careful and precise",
      explanation: "Meticulous means showing great attention to detail; very careful and precise."
    },
    {
      id: 'fallback_4',
      type: 'reading',
      question: "In the phrase 'a deafening silence,' what literary device is being used?",
      options: ["Simile", "Metaphor", "Oxymoron", "Alliteration"],
      correctAnswer: "Oxymoron",
      explanation: "An oxymoron combines contradictory terms. 'Deafening silence' combines loud (deafening) with quiet (silence)."
    },
    {
      id: 'fallback_5',
      type: 'math',
      question: "What is 30% of 50?",
      options: ["15", "20", "25", "30"],
      correctAnswer: "15",
      explanation: "30% of 50 = 0.30 × 50 = 15."
    }
  ]

  const selectedQuestions = fallbackQuestions.slice(0, count)
  
  return NextResponse.json({
    success: true,
    questions: selectedQuestions.map((q, index) => ({
      ...q,
      id: `fallback_${Date.now()}_${index}`,
      generatedAt: new Date().toISOString()
    })),
    metadata: {
      generatedAt: new Date().toISOString(),
      basedOnUserMaterials: false,
      userWeaknesses: 'Using fallback questions due to AI timeout',
      isFallback: true
    }
  })
}