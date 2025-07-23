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
    
    let prompt = `You are an expert SSAT/SAT test question generator. Generate ${count} high-quality questions in JSON format that closely match the official SSAT/SAT style and difficulty.`

    if (contextContent) {
      prompt += `

## UPLOADED STUDY MATERIALS:
${contextContent.substring(0, 3000)}${contextContent.length > 3000 ? '\n... (content truncated for length)' : ''}

## USER PERFORMANCE ANALYSIS:
${userWeaknesses}

## QUESTION GENERATION REQUIREMENTS:

**PRIORITY 1 - Use Uploaded Materials:**
- Extract key vocabulary words from the uploaded content for vocabulary questions
- Use passages or concepts from the materials for reading comprehension questions
- Base math word problems on scenarios mentioned in the materials when possible
- Reference specific facts, ideas, or examples from the uploaded content

**PRIORITY 2 - SSAT Format Adherence:**
- Vocabulary: Test word meaning, synonyms, analogies in context
- Reading: Ask about main ideas, inference, author's tone, literary devices
- Math: Include algebra, geometry, data analysis with clear problem-solving steps
- Writing: Test grammar, sentence structure, paragraph organization

**PRIORITY 3 - User-Targeted Difficulty:**
Focus extra attention on areas identified as weak: ${userWeaknesses}`
    } else {
      prompt += `

## NO UPLOADED MATERIALS - GENERATE STANDARD SSAT QUESTIONS

## USER PERFORMANCE ANALYSIS:
${userWeaknesses}

## QUESTION GENERATION REQUIREMENTS:
Generate authentic SSAT-style questions covering:
- **Vocabulary**: Advanced words typical for grades 8-11 with context clues
- **Reading**: Passages with main idea, inference, and literary analysis questions  
- **Math**: Pre-algebra through geometry problems similar to actual SSAT
- **Writing**: Grammar and usage questions testing standard conventions

Focus on areas where the user needs improvement: ${userWeaknesses}`
    }

    prompt += `

## OUTPUT FORMAT (JSON only - no markdown):
{
  "questions": [
    {
      "id": "q1",
      "type": "vocabulary|reading|math|writing",
      "question": "Actual question text exactly as it would appear on the SSAT",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Clear explanation of why the answer is correct and others are wrong",
      "difficulty": "easy|medium|hard",
      "passage": "Include only for reading questions - the passage text",
      "tags": ["keyword1", "keyword2"]
    }
  ]
}

## EXAMPLES OF GOOD SSAT QUESTIONS:

**Vocabulary Example:**
"The politician's speech was so VERBOSE that many audience members left before it ended. VERBOSE most nearly means:"
A) Brief  B) Wordy  C) Unclear  D) Persuasive

**Reading Example:** 
[Passage about nature/history/science] "The author's primary purpose in this passage is to:"
A) Entertain readers with anecdotes  B) Argue for policy changes  C) Explain a scientific concept  D) Compare different viewpoints

**Math Example:**
"If 3x + 7 = 22, what is the value of x - 4?"
A) 1  B) 3  C) 5  D) 11

Generate exactly ${count} questions with this level of quality and authenticity.`

    // 首先尝试AI生成，如果失败使用备用题目
    let aiResponse: string
    try {
      console.log('Calling Gemini API with 12s timeout...')
      aiResponse = await generateText(prompt, 12000) // 12秒超时
      console.log('AI response received, length:', aiResponse.length)
    } catch (aiError) {
      console.log('AI generation failed, using fallback questions:', aiError)
      return await getFallbackQuestions(count, userId, questionType)
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

// 动态备用题目生成函数
async function getFallbackQuestions(count: number, userId: string, questionType: string) {
  console.log('AI generation failed, using dynamic fallback system...')
  
  try {
    // 调用动态题目生成API
    const dynamicResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/questions/dynamic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        questionType,
        count,
        difficulty: 'mixed',
        avoidRecent: true
      })
    })

    if (dynamicResponse.ok) {
      const dynamicData = await dynamicResponse.json()
      if (dynamicData.success && dynamicData.questions) {
        console.log(`Generated ${dynamicData.questions.length} dynamic fallback questions`)
        
        return NextResponse.json({
          success: true,
          questions: dynamicData.questions.map((q: any) => ({
            id: q.id,
            type: q.type,
            question: q.question,
            options: q.options,
            correctAnswer: q.correct_answer,
            explanation: q.explanation,
            passage: q.passage,
            generatedAt: new Date().toISOString()
          })),
          metadata: {
            generatedAt: new Date().toISOString(),
            basedOnUserMaterials: false,
            userWeaknesses: 'Using dynamic fallback questions due to AI timeout',
            isFallback: true,
            fallbackType: 'dynamic_varied',
            originalRequestedCount: count
          }
        })
      }
    }
  } catch (dynamicError) {
    console.error('Dynamic fallback failed:', dynamicError)
  }

  // 如果动态系统也失败，使用最基础的静态备用
  console.log('Dynamic fallback failed, using basic static questions...')
  const basicQuestions = [
    {
      id: `basic_${Date.now()}_1`,
      type: 'vocabulary',
      question: "Which word means 'to make better'?",
      options: ["Improve", "Worsen", "Ignore", "Complicate"],
      correctAnswer: "Improve",
      explanation: "Improve means to make or become better."
    },
    {
      id: `basic_${Date.now()}_2`,
      type: 'math',
      question: "What is 25% of 80?",
      options: ["20", "25", "30", "40"],
      correctAnswer: "20",
      explanation: "25% of 80 = 0.25 × 80 = 20"
    }
  ]

  // 随机选择和重复以满足count要求
  const selectedQuestions = []
  for (let i = 0; i < count; i++) {
    const baseQuestion = basicQuestions[i % basicQuestions.length]
    selectedQuestions.push({
      ...baseQuestion,
      id: `basic_${Date.now()}_${i}`,
      generatedAt: new Date().toISOString()
    })
  }
  
  return NextResponse.json({
    success: true,
    questions: selectedQuestions,
    metadata: {
      generatedAt: new Date().toISOString(),
      basedOnUserMaterials: false,
      userWeaknesses: 'Using basic static fallback due to system failures',
      isFallback: true,
      fallbackType: 'basic_static'
    }
  })
}