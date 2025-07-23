import { NextRequest, NextResponse } from 'next/server'
import { generateTextOptimized, generateTextFast } from '@/lib/gemini-optimized'
import { generateTextWithCache } from '@/lib/ai-cache'
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

    // 获取用户的答题历史以了解弱点 - 使用正确的UUID格式
    let answersUserId = userId
    if (userId === 'demo-user-123') {
      answersUserId = '00000000-0000-0000-0000-000000000001'
    }
    
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select(`
        *,
        questions!inner(type, difficulty)
      `)
      .eq('user_id', answersUserId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (answersError) {
      console.error('User answers fetch error:', answersError)
    } else {
      console.log('Found', userAnswers?.length || 0, 'user answers for analysis')
    }

    // 获取需要复习的flashcard词汇（艾宾浩斯曲线）
    console.log('Fetching vocabulary due for spaced repetition review...')
    
    // 确保使用正确的UUID格式 - demo-user-123会导致UUID错误
    let finalUserId = userId
    if (userId === 'demo-user-123') {
      finalUserId = '00000000-0000-0000-0000-000000000001'
    }
    
    console.log(`Using user ID: ${finalUserId} (original: ${userId})`)
    
    // 直接从 flashcards 表获取用户的词汇
    const { data: vocabularyWords, error: vocabError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', finalUserId)
      .eq('type', 'vocabulary')
      .order('created_at', { ascending: false })
      .limit(20)
      
    // 如果有词汇，尝试获取进度信息 - 先尝试user_flashcard_progress，失败则尝试user_flashcard_reviews
    let vocabularyProgress: any[] = []
    if (!vocabError && vocabularyWords && vocabularyWords.length > 0) {
      const flashcardIds = vocabularyWords.map(w => w.id)
      
      // 尝试从user_flashcard_progress获取进度
      let { data: progressData, error: progressError } = await supabase
        .from('user_flashcard_progress')
        .select('*')
        .eq('user_id', finalUserId)
        .in('flashcard_id', flashcardIds)
      
      // 如果表不存在，尝试user_flashcard_reviews（根据错误提示）
      if (progressError && progressError.message?.includes('user_flashcard_reviews')) {
        const { data: reviewsData } = await supabase
          .from('user_flashcard_reviews')
          .select('*')
          .eq('user_id', finalUserId)
          .in('flashcard_id', flashcardIds)
        progressData = reviewsData
        progressError = null
      }
      
      vocabularyProgress = progressData || []
      
      if (progressError) {
        console.error('Progress fetch error details:', progressError)
      }
    }

    let prioritizedVocabulary: any[] = []
    if (!vocabError && vocabularyWords) {
      console.log('Found', vocabularyWords.length, 'vocabulary words for user')
      
      const now = new Date()
      
      // 按照艾宾浩斯曲线优先级排序
      prioritizedVocabulary = vocabularyWords
        .map(word => {
          // 查找对应的进度信息
          const progress = vocabularyProgress.find(p => p.flashcard_id === word.id) || {
            mastery_level: 0,
            times_seen: 0,
            times_correct: 0,
            last_seen: null,
            next_review_date: now.toISOString(),
            difficulty_rating: 3,
            interval_days: 1,
            ease_factor: 2.5,
            is_mastered: false
          }
          
          // 计算优先级（越小越优先）
          let priority = 0
          
          // 1. 首次学习的单词最优先
          if (progress.times_seen === 0) {
            priority = 1
          }
          // 2. 已到复习时间的单词
          else if (new Date(progress.next_review_date) <= now) {
            priority = 2 + (5 - progress.mastery_level) // 掌握度越低越优先
          }
          // 3. 错误率高的单词
          else if (progress.times_seen > 0 && (progress.times_correct / progress.times_seen) < 0.6) {
            priority = 8
          }
          // 4. 其他单词
          else {
            priority = 10
          }
          
          return {
            ...word,
            progress,
            priority,
            isOverdue: new Date(progress.next_review_date) <= now
          }
        })
        .sort((a, b) => a.priority - b.priority)
        .slice(0, Math.min(10, count || 5)) // 取最高优先级的单词
      
      console.log(`Prioritized ${prioritizedVocabulary.length} vocabulary words for spaced repetition`)
      console.log('Priority breakdown:', {
        newWords: prioritizedVocabulary.filter(w => w.priority === 1).length,
        overdueWords: prioritizedVocabulary.filter(w => w.priority >= 2 && w.priority <= 7).length,
        difficultWords: prioritizedVocabulary.filter(w => w.priority === 8).length,
        otherWords: prioritizedVocabulary.filter(w => w.priority === 10).length
      })
    } else if (vocabError) {
      console.error('Vocabulary fetch error:', vocabError)
    } else {
      console.log('No vocabulary words found for user')
    }

    // 构建基于用户材料的提示词
    const contextContent = knowledgeData && knowledgeData.length > 0 
      ? knowledgeData.map(kb => `${kb.title}: ${kb.content}`).join('\n\n')
      : ''

    const userWeaknesses = analyzeUserWeaknesses(userAnswers || [])
    
    // 构建词汇复习内容（优先使用艾宾浩斯曲线单词）
    const vocabularyContext = prioritizedVocabulary.length > 0 
      ? prioritizedVocabulary.map(word => {
          const reviewStatus = word.isOverdue ? 'OVERDUE' : 
                              word.priority === 1 ? 'NEW' : 
                              word.priority === 8 ? 'DIFFICULT' : 'REVIEW'
          return `Word: ${word.word}\nDefinition: ${word.definition}\nPronunciation: ${word.pronunciation || ''}\nExample: ${word.example_sentence || ''}\nSynonyms: ${word.synonyms || ''}\nMastery Level: ${word.progress.mastery_level}/5\nReview Status: ${reviewStatus}\nTimes Seen: ${word.progress.times_seen}\nSuccess Rate: ${word.progress.times_seen > 0 ? Math.round((word.progress.times_correct / word.progress.times_seen) * 100) : 0}%`
        }).join('\n\n')
      : ''
    
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

### [VOCABULARY WORDS DUE FOR SPACED REPETITION REVIEW]:
${vocabularyContext || 'No vocabulary words currently due for review.'}

**SPACED REPETITION PRIORITY**: ${prioritizedVocabulary.length > 0 ? `${prioritizedVocabulary.length} words found` : 'None'}
**REQUIRED VOCABULARY QUESTIONS**: ${Math.min(prioritizedVocabulary.length, Math.ceil(count * 0.6))} out of ${count} total questions

### [USER PERFORMANCE ANALYSIS]:
${userWeaknesses}

### [FINAL INSTRUCTIONS]:
1.  Generate **${count}** questions.
2.  **PRIORITY #1 - SPACED REPETITION VOCABULARY**: If vocabulary words are provided in **[VOCABULARY WORDS DUE FOR SPACED REPETITION REVIEW]**, you MUST create ${Math.min(prioritizedVocabulary.length, Math.ceil(count * 0.6))} vocabulary questions using these EXACT words. For each word:
   - Create SSAT-style synonym questions ("WORD : SYNONYM" format)
   - Create analogy questions if the word fits well
   - Create sentence completion questions using the word in context
   - Use the provided definition, pronunciation, and examples
   - Pay attention to the mastery level and review status to adjust difficulty
3.  **PRIORITY #2**: Use remaining question slots for questions based on **[CONTEXT FROM RAG]**.
4.  **PRIORITY #3**: Fill any remaining slots with questions targeting user weaknesses: **${userWeaknesses}**.
5.  **VOCABULARY QUESTION REQUIREMENTS**:
   - NEW words (first time): Create easier synonym or definition questions
   - OVERDUE words: Create more challenging analogy or context questions  
   - DIFFICULT words (low success rate): Create multiple formats to reinforce learning
   - Use EXACT words from the vocabulary list - do not substitute or modify them
6.  **STRICTLY** follow the JSON format and style of the **Golden Examples**. Every question MUST have a detailed \`explanation\`.

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
      console.log('Calling optimized Gemini API with cache and retry mechanism...')
      console.log(`Requesting ${count} questions with enhanced timeout handling...`)
      
      // 优化超时配置 - 针对题目生成场景
      const enhancedTimeoutConfig = {
        initialTimeout: 20000,  // 增加到20秒
        retryTimeout: 25000,    // 增加到25秒
        maxTimeout: 35000       // 增加到35秒
      }
      
      const enhancedRetryConfig = {
        maxRetries: 4,          // 增加重试次数
        baseDelay: 2000,        // 增加基础延迟
        maxDelay: 8000,         // 增加最大延迟
        backoffMultiplier: 1.5  // 减少退避倍数，更快重试
      }
      
      aiResponse = await generateTextWithCache(
        prompt,
        generateTextOptimized,
        20000, // 增加基础超时
        enhancedRetryConfig,
        enhancedTimeoutConfig,
        1800000 // 30分钟缓存
      )
      console.log('AI response received successfully, length:', aiResponse.length)
    } catch (aiError) {
      console.log('AI generation failed with enhanced retry, using fallback questions:', aiError)
      console.log('Error details:', {
        message: aiError instanceof Error ? aiError.message : 'Unknown error',
        stack: aiError instanceof Error ? aiError.stack : undefined
      })
      
      // 尝试使用更快的AI生成方法
      try {
        console.log('Attempting fast AI generation as secondary fallback...')
        aiResponse = await generateTextFast(prompt, 10000) // 10秒快速生成
        console.log('Fast AI generation succeeded, length:', aiResponse.length)
      } catch (fastError) {
        console.log('Fast AI generation also failed, using static fallback:', fastError)
        return await getFallbackQuestions(count, userId, questionType)
      }
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
            vocabularyWordsCount: vocabularyWords?.length || 0,
            hasVocabularyWords: (vocabularyWords?.length || 0) > 0,
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
  console.log(`Requested ${count} questions, ensuring adequate fallback coverage...`)
  
  try {
    // 调用动态题目生成API
    const dynamicResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/questions/dynamic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        questionType,
        count: Math.max(count, 20), // 确保至少生成20道题
        difficulty: 'mixed',
        avoidRecent: true
      })
    })

    if (dynamicResponse.ok) {
      const dynamicData = await dynamicResponse.json()
      if (dynamicData.success && dynamicData.questions && dynamicData.questions.length >= count) {
        console.log(`Generated ${dynamicData.questions.length} dynamic fallback questions`)
        
        return NextResponse.json({
          success: true,
          questions: dynamicData.questions.slice(0, count).map((q: any) => ({
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
            originalRequestedCount: count,
            actualGeneratedCount: dynamicData.questions.length
          }
        })
      }
    }
  } catch (dynamicError) {
    console.error('Dynamic fallback failed:', dynamicError)
  }

  // 如果动态系统也失败，使用增强的静态备用
  console.log('Dynamic fallback failed, using enhanced static questions...')
  
  // 增强的静态题目库 - 确保有足够的题目
  const enhancedBasicQuestions = [
    // Vocabulary questions
    {
      id: `basic_${Date.now()}_1`,
      type: 'vocabulary',
      question: "Which word means 'to make better'?",
      options: ["Improve", "Worsen", "Ignore", "Complicate", "Simplify"],
      correctAnswer: "Improve",
      explanation: "Improve means to make or become better."
    },
    {
      id: `basic_${Date.now()}_2`,
      type: 'vocabulary',
      question: "What is the synonym for 'enormous'?",
      options: ["Tiny", "Huge", "Average", "Small", "Medium"],
      correctAnswer: "Huge",
      explanation: "Enormous and huge both mean very large in size."
    },
    {
      id: `basic_${Date.now()}_3`,
      type: 'vocabulary',
      question: "Which word means 'to examine carefully'?",
      options: ["Ignore", "Scrutinize", "Forget", "Avoid", "Skip"],
      correctAnswer: "Scrutinize",
      explanation: "Scrutinize means to examine or inspect closely and thoroughly."
    },
    // Math questions
    {
      id: `basic_${Date.now()}_4`,
      type: 'math',
      question: "What is 25% of 80?",
      options: ["20", "25", "30", "40", "15"],
      correctAnswer: "20",
      explanation: "25% of 80 = 0.25 × 80 = 20"
    },
    {
      id: `basic_${Date.now()}_5`,
      type: 'math',
      question: "If 3x + 7 = 22, what is x?",
      options: ["3", "5", "7", "9", "11"],
      correctAnswer: "5",
      explanation: "3x + 7 = 22 → 3x = 15 → x = 5"
    },
    {
      id: `basic_${Date.now()}_6`,
      type: 'math',
      question: "What is the area of a rectangle with length 8 and width 6?",
      options: ["14", "28", "48", "56", "64"],
      correctAnswer: "48",
      explanation: "Area = length × width = 8 × 6 = 48"
    },
    // Reading questions
    {
      id: `basic_${Date.now()}_7`,
      type: 'reading',
      question: "What is the main idea of this passage?",
      options: ["Technology is harmful", "Education is important", "Nature is beautiful", "Sports are fun", "Music is relaxing"],
      correctAnswer: "Education is important",
      explanation: "The passage emphasizes the importance of education in personal development.",
      passage: "Education plays a crucial role in shaping individuals and societies. Through learning, people develop critical thinking skills, gain knowledge, and prepare for future challenges. The benefits of education extend beyond academic achievement to include personal growth and social responsibility."
    },
    {
      id: `basic_${Date.now()}_8`,
      type: 'reading',
      question: "Based on the passage, what can be inferred about the author's opinion?",
      options: ["Negative", "Positive", "Neutral", "Confused", "Uncertain"],
      correctAnswer: "Positive",
      explanation: "The author uses positive language and emphasizes benefits, indicating a positive opinion.",
      passage: "Regular exercise provides numerous health benefits. It strengthens the heart, improves mood, and increases energy levels. Studies show that people who exercise regularly live longer and have better quality of life."
    },
    // Writing questions
    {
      id: `basic_${Date.now()}_9`,
      type: 'writing',
      question: "Which sentence is grammatically correct?",
      options: ["Me and him went to the store", "Him and I went to the store", "He and I went to the store", "Me and he went to the store", "Him and me went to the store"],
      correctAnswer: "He and I went to the store",
      explanation: "When using compound subjects, use subject pronouns (he, I) rather than object pronouns (him, me)."
    },
    {
      id: `basic_${Date.now()}_10`,
      type: 'writing',
      question: "What is the best way to combine these sentences: 'The weather was cold. We decided to stay inside.'",
      options: ["The weather was cold, we decided to stay inside", "The weather was cold; we decided to stay inside", "The weather was cold and we decided to stay inside", "The weather was cold so we decided to stay inside", "The weather was cold, so we decided to stay inside"],
      correctAnswer: "The weather was cold, so we decided to stay inside",
      explanation: "Use a comma and coordinating conjunction 'so' to properly connect two independent clauses."
    }
  ]

  // 确保生成足够数量的题目
  const selectedQuestions = []
  for (let i = 0; i < count; i++) {
    const baseQuestion = enhancedBasicQuestions[i % enhancedBasicQuestions.length]
    selectedQuestions.push({
      ...baseQuestion,
      id: `basic_${Date.now()}_${i + 1}`,
      generatedAt: new Date().toISOString()
    })
  }
  
  console.log(`Generated ${selectedQuestions.length} enhanced static fallback questions`)
  
  return NextResponse.json({
    success: true,
    questions: selectedQuestions,
    metadata: {
      generatedAt: new Date().toISOString(),
      basedOnUserMaterials: false,
      userWeaknesses: 'Using enhanced static fallback due to system failures',
      isFallback: true,
      fallbackType: 'enhanced_static',
      originalRequestedCount: count,
      actualGeneratedCount: selectedQuestions.length
    }
  })
}