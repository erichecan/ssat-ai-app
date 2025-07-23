import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { questionBank, filterQuestions } from '@/lib/question-bank'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface Question {
  id: string
  type: string
  difficulty: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  passage?: string
  tags?: string[]
}

// 动态生成多样化的练习题
export async function POST(request: NextRequest) {
  try {
    const { 
      userId = 'demo-user-123',
      questionType = 'mixed', 
      count = 10,
      difficulty = 'mixed',
      avoidRecent = true
    } = await request.json()

    console.log('Generating dynamic questions:', { userId, questionType, count, difficulty })

    let questions: Question[] = []

    // 1. 尝试从数据库获取用户特定的题目
    try {
      const { data: dbQuestions, error: dbError } = await supabase
        .from('questions')
        .select('*')
        .limit(count * 2) // 获取更多题目用于随机选择
        .order('created_at', { ascending: false })

      if (!dbError && dbQuestions && dbQuestions.length > 0) {
        // 将数据库题目转换为标准格式
        const formattedQuestions = dbQuestions.map(q => ({
          id: q.id,
          type: q.type,
          difficulty: q.difficulty,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          passage: q.passage,
          tags: q.tags || []
        }))

        // 根据类型和难度筛选
        let filteredQuestions = formattedQuestions
        if (questionType !== 'mixed') {
          filteredQuestions = filteredQuestions.filter(q => q.type === questionType)
        }
        if (difficulty !== 'mixed') {
          filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty)
        }

        // 随机选择
        questions = shuffleArray(filteredQuestions).slice(0, count)
        console.log(`Got ${questions.length} questions from database`)
      }
    } catch (dbError) {
      console.error('Database query failed:', dbError)
    }

    // 2. 如果数据库题目不够，从question bank补充
    if (questions.length < count) {
      const remainingCount = count - questions.length
      const bankQuestions = generateVariedQuestionsFromBank(questionType, difficulty, remainingCount, userId)
      questions = [...questions, ...bankQuestions]
      console.log(`Added ${bankQuestions.length} varied questions from bank`)
    }

    // 3. 如果还是不够，生成程序化变体题目
    if (questions.length < count) {
      const remainingCount = count - questions.length
      const proceduralQuestions = generateProceduralQuestions(questionType, remainingCount, userId)
      questions = [...questions, ...proceduralQuestions]
      console.log(`Added ${proceduralQuestions.length} procedural questions`)
    }

    // 4. 最终随机打乱
    questions = shuffleArray(questions).slice(0, count)

    // 5. 记录生成的题目（避免重复）
    if (avoidRecent) {
      await recordGeneratedQuestions(userId, questions.map(q => q.id))
    }

    return NextResponse.json({
      success: true,
      questions,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalCount: questions.length,
        sources: {
          database: Math.max(0, Math.min(questions.length, count - (questions.length - Math.min(questions.length, count)))),
          questionBank: 'varied',
          procedural: 'as_needed'
        },
        userId,
        requestedType: questionType,
        requestedDifficulty: difficulty
      }
    })

  } catch (error) {
    console.error('Dynamic questions API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate dynamic questions' },
      { status: 500 }
    )
  }
}

// 从question bank生成多样化的题目
function generateVariedQuestionsFromBank(
  questionType: string, 
  difficulty: string, 
  count: number,
  userId: string
): Question[] {
  let availableQuestions = [...questionBank]

  // 按类型筛选
  if (questionType !== 'mixed') {
    availableQuestions = availableQuestions.filter(q => q.type === questionType)
  }

  // 按难度筛选
  if (difficulty !== 'mixed') {
    availableQuestions = availableQuestions.filter(q => q.difficulty === difficulty)
  }

  // 创建变体：修改选项顺序、数值、措辞等
  const variedQuestions: Question[] = []
  for (let i = 0; i < count && availableQuestions.length > 0; i++) {
    const baseQuestion = availableQuestions[i % availableQuestions.length]
    const variedQuestion = createQuestionVariant(baseQuestion, i, userId)
    variedQuestions.push(variedQuestion)
  }

  return shuffleArray(variedQuestions)
}

// 创建题目变体
function createQuestionVariant(baseQuestion: any, variantIndex: number, userId: string): Question {
  const timestamp = Date.now()
  const newQuestion = { ...baseQuestion }

  // 生成唯一ID
  newQuestion.id = `varied_${baseQuestion.id}_${timestamp}_${variantIndex}`

  // 针对不同类型题目创建变体
  switch (baseQuestion.type) {
    case 'math':
      newQuestion = createMathVariant(newQuestion, variantIndex)
      break
    case 'vocabulary':
      newQuestion = createVocabularyVariant(newQuestion, variantIndex)
      break
    case 'reading':
      // 阅读题保持原样，但打乱选项顺序
      newQuestion.options = shuffleArray([...baseQuestion.options])
      break
    default:
      newQuestion.options = shuffleArray([...baseQuestion.options])
  }

  return newQuestion
}

// 创建数学题变体
function createMathVariant(question: any, variantIndex: number): Question {
  // 为简单的代数题创建数值变体
  if (question.question.includes('x +') || question.question.includes('x-')) {
    const variations = [
      { add: 3, result: 18 }, // x + 3 = 18, x = 15
      { add: 7, result: 22 }, // x + 7 = 22, x = 15  
      { add: 4, result: 19 }, // x + 4 = 19, x = 15
      { add: 6, result: 21 }, // x + 6 = 21, x = 15
      { add: 9, result: 24 }  // x + 9 = 24, x = 15
    ]
    
    const variant = variations[variantIndex % variations.length]
    const answer = variant.result - variant.add
    
    return {
      ...question,
      question: `If x + ${variant.add} = ${variant.result}, what is the value of x?`,
      options: [
        answer.toString(),
        (answer + 2).toString(),
        (answer - 2).toString(),
        variant.result.toString()
      ].sort(() => Math.random() - 0.5),
      correct_answer: answer.toString(),
      explanation: `To solve x + ${variant.add} = ${variant.result}, subtract ${variant.add} from both sides: x = ${variant.result} - ${variant.add} = ${answer}`
    }
  }

  // 对于其他数学题，只打乱选项顺序
  return {
    ...question,
    options: shuffleArray([...question.options])
  }
}

// 创建词汇题变体
function createVocabularyVariant(question: any, variantIndex: number): Question {
  // 对于词汇题，可以改变问题的措辞
  const questionVariations = [
    (word: string) => `What does "${word}" mean?`,
    (word: string) => `Choose the correct definition of "${word}":`,
    (word: string) => `Which of the following best defines "${word}"?`,
    (word: string) => `The word "${word}" is closest in meaning to:`,
    (word: string) => `Select the most accurate meaning of "${word}":`
  ]

  // 提取单词（假设格式为 "What does 'word' mean?"）
  const wordMatch = question.question.match(/'([^']+)'/)
  const word = wordMatch ? wordMatch[1] : 'the word'

  const variationFunc = questionVariations[variantIndex % questionVariations.length]
  
  return {
    ...question,
    question: variationFunc(word),
    options: shuffleArray([...question.options])
  }
}

// 生成程序化题目（更多样化）
function generateProceduralQuestions(questionType: string, count: number, userId: string): Question[] {
  const questions: Question[] = []
  const timestamp = Date.now()

  for (let i = 0; i < count; i++) {
    if (questionType === 'mixed' || questionType === 'math') {
      // 生成简单的数学题变体
      const a = Math.floor(Math.random() * 20) + 5
      const b = Math.floor(Math.random() * 15) + 5
      const correct = a + b
      const wrong1 = correct + Math.floor(Math.random() * 5) + 1
      const wrong2 = correct - Math.floor(Math.random() * 5) - 1
      const wrong3 = a * b

      questions.push({
        id: `proc_math_${timestamp}_${i}`,
        type: 'math',
        difficulty: 'medium',
        question: `What is ${a} + ${b}?`,
        options: [correct, wrong1, wrong2, wrong3].map(n => n.toString()).sort(() => Math.random() - 0.5),
        correct_answer: correct.toString(),
        explanation: `${a} + ${b} = ${correct}`,
        tags: ['procedural', 'addition']
      })
    }

    if (questionType === 'mixed' || questionType === 'vocabulary') {
      // 生成基础词汇题
      const basicWords = [
        { word: 'enhance', meaning: 'to improve or increase', wrong: ['to decrease', 'to confuse', 'to ignore'] },
        { word: 'analyze', meaning: 'to examine carefully', wrong: ['to create', 'to destroy', 'to ignore'] },
        { word: 'synthesize', meaning: 'to combine parts into a whole', wrong: ['to separate', 'to copy', 'to delete'] }
      ]

      const wordData = basicWords[i % basicWords.length]
      const options = [wordData.meaning, ...wordData.wrong].sort(() => Math.random() - 0.5)

      questions.push({
        id: `proc_vocab_${timestamp}_${i}`,
        type: 'vocabulary',
        difficulty: 'medium',
        question: `What does "${wordData.word}" mean?`,
        options,
        correct_answer: wordData.meaning,
        explanation: `"${wordData.word}" means ${wordData.meaning}.`,
        tags: ['procedural', 'vocabulary']
      })
    }
  }

  return questions.slice(0, count)
}

// 记录生成的题目ID以避免重复
async function recordGeneratedQuestions(userId: string, questionIds: string[]) {
  try {
    // 这里可以记录到数据库或缓存中，避免短时间内重复出现相同题目
    console.log(`Recording generated questions for user ${userId}:`, questionIds)
  } catch (error) {
    console.error('Failed to record generated questions:', error)
  }
}

// 数组随机打乱工具函数
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}