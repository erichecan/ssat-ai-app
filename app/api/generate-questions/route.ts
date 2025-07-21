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
    console.log('API called: generate-questions')
    const { userId, questionType = 'mixed', count = 5 } = await request.json()
    console.log('Request data:', { userId, questionType, count })

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // 暂时跳过数据库查询以简化调试
    console.log('Skipping database queries for debugging')
    
    const prompt = `
You are an expert SSAT test question generator. Generate ${count} high-quality SSAT questions.

QUESTION REQUIREMENTS:
1. Generate ${count} questions of mixed types (vocabulary, reading, math)
2. Each question should have exactly 4 multiple choice options
3. Questions should be similar in style and difficulty to real SSAT questions
4. Include detailed explanations for the correct answer

RESPONSE FORMAT (JSON only, no markdown):
{
  "questions": [
    {
      "id": "unique_id",
      "type": "vocabulary",
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Detailed explanation"
    }
  ]
}

Generate exactly ${count} questions. Only return the JSON, no other text.
`

    console.log('Calling Gemini API...')
    const aiResponse = await generateText(prompt)
    console.log('AI response received, length:', aiResponse.length)
    
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
            userWeaknesses: userWeaknesses
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