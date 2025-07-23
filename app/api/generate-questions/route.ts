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
    
    let prompt = `You are an expert SSAT (Secondary School Admission Test) question generation engine. Your SOLE aim is to create ${count} high-quality, authentic SSAT-style questions in a strict JSON format, based PRIMARILY on the context provided.

## --------------------
## ❗ CORE DIRECTIVE ❗
## --------------------
**HIGHEST PRIORITY**: You MUST base the generated questions on the **[CONTEXT FROM RAG]** provided below. This context contains vectorized excerpts from official SSAT materials. Your task is to use these specific passages, vocabulary, and problem structures to create new questions. Do NOT generate questions from your general knowledge if relevant context is available.

## --------------------
## SSAT STYLE GUIDE & RULES
## --------------------
You MUST adhere to the following style guide, which is derived from official SSAT standards.

1.  **Vocabulary**:
    *   **Synonyms**: A single capitalized word followed by five single-word choices. The correct answer is the closest synonym.
    *   **Analogies**: A pair of capitalized words with a clear logical relationship (e.g., Part:Whole, Cause:Effect, Type:Kind). The answer is the pair with the most similar relationship.

2.  **Reading Comprehension**:
    *   **Passage Style**: Short, dense passages (150-300 words) from literature, humanities, and science.
    *   **Question Types**: Focus on Main Idea, Inference, Author's Tone, Vocabulary in Context, and Specific Detail.

3.  **Quantitative (Math)**:
    *   **Format**: Word problems testing conceptual understanding are preferred over simple calculations.
    *   **Content**: Pre-algebra, Algebra I, Geometry (areas, angles, coordinates), Data Analysis (charts, mean, median), and Probability.

4.  **Writing Sample**:
    *   **Format**: Provide a thought-provoking, open-ended prompt that requires the user to form an argument or narrative supported by examples. Avoid simple "what is your favorite" questions.

## --------------------
## ⭐ GOLDEN EXAMPLES (Your output MUST match this style and quality) ⭐
## --------------------

**1. Vocabulary (Analogy) Example:**
{
  "question": "MICROSCOPE : SEE ::",
  "options": { "A": "LOUDSPEAKER : HEAR", "B": "CAMERA : RECORD", "C": "TELESCOPE : MAGNIFY", "D": "SONG : LISTEN", "E": "BANDAGE : HEAL" },
  "answer": "A",
  "metadata": {
    "questionType": "Vocabulary-Analogy", "difficulty": "Medium", "keyConcept": "Tool:Function Relationship",
    "explanation": "A MICROSCOPE is a tool used to SEE things that are too small. A LOUDSPEAKER is a tool used to HEAR sounds that are too quiet. This 'Tool for Enhancing a Sense' relationship is the strongest match. While a telescope magnifies, its primary function is to see distant objects, making 'HEAR' a more parallel verb to 'SEE'."
  }
}

**2. Reading (Inference) Example:**
{
  "question": "Based on the passage, which of the following can be inferred about the author's attitude toward the subject?",
  "options": { "A": "Skeptical disapproval", "B": "Cautious optimism", "C": "Enthusiastic endorsement", "D": "Objective neutrality", "E": "Resigned acceptance" },
  "answer": "B",
  "passage": "While the new technology shows promise, researchers emphasize the need for extensive testing before implementation. The potential benefits are significant, but we must proceed carefully to ensure safety and effectiveness.",
  "metadata": {
    "questionType": "Reading-Inference", "difficulty": "Medium", "keyConcept": "Author's Tone and Attitude",
    "explanation": "The author uses phrases like 'shows promise' and 'potential benefits are significant' indicating optimism, but also emphasizes 'need for extensive testing' and 'proceed carefully,' showing caution. This combination indicates cautious optimism."
  }
}

**3. Quantitative (Math) Example:**
{
  "question": "A rectangular garden has a length of 12 feet and a width of 5 feet. A fence is to be built around the garden, and a gate 3 feet wide will be installed. If the fencing costs $10 per foot, what is the total cost of the fencing required?",
  "options": { "A": "$310", "B": "$340", "C": "$570", "D": "$600", "E": "$630" },
  "answer": "A",
  "metadata": {
    "questionType": "Math-Geometry", "difficulty": "Easy", "keyConcept": "Perimeter and Problem Solving",
    "explanation": "First, calculate the total perimeter of the garden: P = 2 * (length + width) = 2 * (12 + 5) = 2 * 17 = 34 feet. The fence will cover the entire perimeter except for the 3-foot gate. So, the length of the fencing needed is 34 - 3 = 31 feet. The total cost is the length of the fencing multiplied by the cost per foot: 31 feet * $10/foot = $310."
  }
}

**4. Writing Sample Example:**
{
  "question": "Is it more important to be a good listener or a good speaker? Support your position with examples from your own experience, history, or literature.",
  "options": {}, "answer": null,
  "metadata": { "questionType": "Writing-Prompt", "difficulty": "N/A", "keyConcept": "Argumentation and Support" }
}

## --------------------
## 🎯 GENERATION TASK 🎯
## --------------------

### [CONTEXT FROM RAG]:
${contextContent || 'No specific context provided - generate standard SSAT questions targeting user weaknesses.'}

### [USER PERFORMANCE ANALYSIS]:
${userWeaknesses}

### [FINAL INSTRUCTIONS]:
1.  Generate **${count}** questions.
2.  **PRIORITY #1**: Base your questions **DIRECTLY** on the provided **[CONTEXT FROM RAG]**. Use its text for reading passages, its words for vocabulary, and its scenarios for math problems.
3.  **PRIORITY #2**: If the context is insufficient for a certain question type, generate a standard question but ensure it targets the user's weak areas: **${userWeaknesses}**.
4.  **STRICTLY** follow the JSON format and style of the **Golden Examples**. Every question MUST have a detailed \`explanation\`.

## OUTPUT FORMAT (JSON only - no markdown):
{
  "questions": [
    {
      "id": "q1",
      "type": "vocabulary|reading|math|writing",
      "question": "Question text exactly as it would appear on the SSAT",
      "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D", "E": "Option E"},
      "correctAnswer": "A",
      "explanation": "Detailed explanation of why the answer is correct and others are wrong",
      "difficulty": "easy|medium|hard",
      "passage": "Include only for reading questions - the passage text",
      "tags": ["keyword1", "keyword2"],
      "metadata": {
        "questionType": "Specific-Type",
        "keyConcept": "Main concept being tested"
      }
    }
  ]
}

Begin generation.`

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