import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { flashcards as staticFlashcards } from '@/lib/flashcard-bank'
import { questionBank, filterQuestions } from '@/lib/question-bank'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 生成重点关注flashcard词汇的练习题
export async function POST(request: NextRequest) {
  try {
    const { userId = 'demo-user-123', count = 10 } = await request.json()

    console.log('Generating vocabulary-focused questions for user:', userId)

    // 1. 获取需要复习的flashcard词汇
    const { data: dueFlashcards, error: flashcardError } = await supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review', new Date().toISOString())
      .eq('is_mastered', false)
      .order('next_review', { ascending: true })
      .limit(Math.min(count, 20)) // 最多20个待复习词汇

    if (flashcardError) {
      console.error('Error fetching due flashcards:', flashcardError)
    }

    const focusWords: string[] = []
    
    // 2. 从待复习的flashcards中提取词汇
    if (dueFlashcards && dueFlashcards.length > 0) {
      focusWords.push(...dueFlashcards.map(f => f.flashcard_id))
      console.log('Found due flashcards:', focusWords)
    }

    // 3. 如果没有待复习的，选择一些低掌握度的词汇
    if (focusWords.length === 0) {
      const { data: learningWords, error: learningError } = await supabase
        .from('user_flashcard_progress')
        .select('*')
        .eq('user_id', userId)
        .lt('mastery_level', 3)
        .eq('is_mastered', false)
        .order('mastery_level', { ascending: true })
        .limit(10)

      if (!learningError && learningWords && learningWords.length > 0) {
        focusWords.push(...learningWords.map(f => f.flashcard_id))
        console.log('Found learning words:', focusWords)
      }
    }

    // 4. 生成基于重点词汇的题目
    const vocabularyQuestions = await generateVocabularyQuestions(focusWords, count)

    return NextResponse.json({
      success: true,
      questions: vocabularyQuestions,
      focusWords: focusWords,
      message: `Generated ${vocabularyQuestions.length} vocabulary-focused questions`
    })

  } catch (error) {
    console.error('Vocabulary-focused questions API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate vocabulary-focused questions' },
      { status: 500 }
    )
  }
}

// 基于重点词汇生成题目
async function generateVocabularyQuestions(focusWords: string[], count: number): Promise<any[]> {
  const generatedQuestions: any[] = []

  // 1. 为每个重点词汇生成题目
  for (let i = 0; i < Math.min(focusWords.length, count); i++) {
    const word = focusWords[i]
    const flashcard = staticFlashcards.find(f => f.id === word || f.word === word)

    if (flashcard) {
      // 生成多种类型的词汇题目
      const questionTypes = ['definition', 'synonym', 'context', 'antonym']
      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)]

      let question: any = null

      switch (questionType) {
        case 'definition':
          question = generateDefinitionQuestion(flashcard)
          break
        case 'synonym':
          question = generateSynonymQuestion(flashcard)
          break
        case 'context':
          question = generateContextQuestion(flashcard)
          break
        case 'antonym':
          question = generateAntonymQuestion(flashcard)
          break
      }

      if (question) {
        generatedQuestions.push(question)
      }
    }
  }

  // 2. 如果生成的题目不够，用常规vocabulary题目补充
  const remainingCount = count - generatedQuestions.length
  if (remainingCount > 0) {
    const regularVocabQuestions = filterQuestions('vocabulary', 'medium', undefined, remainingCount)
    generatedQuestions.push(...regularVocabQuestions)
  }

  return generatedQuestions.slice(0, count)
}

function generateDefinitionQuestion(flashcard: any) {
  // 创建其他选项
  const otherFlashcards = staticFlashcards.filter(f => f.id !== flashcard.id)
  const wrongOptions = otherFlashcards
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(f => f.definition)

  const options = [flashcard.definition, ...wrongOptions]
    .sort(() => Math.random() - 0.5)

  return {
    id: `vocab_def_${flashcard.id}_${Date.now()}`,
    type: 'vocabulary',
    difficulty: flashcard.difficulty || 'medium',
    question: `What does "${flashcard.word}" mean?`,
    options: options,
    correct_answer: flashcard.definition,
    explanation: `"${flashcard.word}" means ${flashcard.definition}. ${flashcard.etymology || ''}`,
    passage: null,
    tags: ['vocabulary', 'definition', 'flashcard_review'],
    focus_word: flashcard.word,
    created_at: new Date().toISOString()
  }
}

function generateSynonymQuestion(flashcard: any) {
  if (!flashcard.synonyms || flashcard.synonyms.length === 0) {
    return generateDefinitionQuestion(flashcard) // 回退到定义题
  }

  const correctSynonym = flashcard.synonyms[0]
  const wrongOptions = staticFlashcards
    .filter(f => f.id !== flashcard.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(f => f.word)

  const options = [correctSynonym, ...wrongOptions]
    .sort(() => Math.random() - 0.5)

  return {
    id: `vocab_syn_${flashcard.id}_${Date.now()}`,
    type: 'vocabulary',
    difficulty: flashcard.difficulty || 'medium',
    question: `Which word is most similar in meaning to "${flashcard.word}"?`,
    options: options,
    correct_answer: correctSynonym,
    explanation: `"${correctSynonym}" is a synonym for "${flashcard.word}". Both mean ${flashcard.definition}`,
    passage: null,
    tags: ['vocabulary', 'synonym', 'flashcard_review'],
    focus_word: flashcard.word,
    created_at: new Date().toISOString()
  }
}

function generateContextQuestion(flashcard: any) {
  const wrongOptions = staticFlashcards
    .filter(f => f.id !== flashcard.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(f => f.word)

  const options = [flashcard.word, ...wrongOptions]
    .sort(() => Math.random() - 0.5)

  // 使用example_sentence或memory_tip作为上下文
  const context = flashcard.example_sentence || flashcard.memory_tip || 
    `The student showed ${flashcard.word} behavior during the examination.`

  return {
    id: `vocab_ctx_${flashcard.id}_${Date.now()}`,
    type: 'vocabulary',
    difficulty: flashcard.difficulty || 'medium',
    question: `Choose the word that best fits in the context: "${context.replace(flashcard.word, '______')}"`,
    options: options,
    correct_answer: flashcard.word,
    explanation: `"${flashcard.word}" means ${flashcard.definition}, which fits perfectly in this context.`,
    passage: null,
    tags: ['vocabulary', 'context', 'flashcard_review'],
    focus_word: flashcard.word,
    created_at: new Date().toISOString()
  }
}

function generateAntonymQuestion(flashcard: any) {
  if (!flashcard.antonyms || flashcard.antonyms.length === 0) {
    return generateDefinitionQuestion(flashcard) // 回退到定义题
  }

  const correctAntonym = flashcard.antonyms[0]
  const wrongOptions = staticFlashcards
    .filter(f => f.id !== flashcard.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(f => f.word)

  const options = [correctAntonym, ...wrongOptions]
    .sort(() => Math.random() - 0.5)

  return {
    id: `vocab_ant_${flashcard.id}_${Date.now()}`,
    type: 'vocabulary',
    difficulty: flashcard.difficulty || 'medium',
    question: `Which word is most opposite in meaning to "${flashcard.word}"?`,
    options: options,
    correct_answer: correctAntonym,
    explanation: `"${correctAntonym}" is an antonym of "${flashcard.word}". While "${flashcard.word}" means ${flashcard.definition}, "${correctAntonym}" means the opposite.`,
    passage: null,
    tags: ['vocabulary', 'antonym', 'flashcard_review'],
    focus_word: flashcard.word,
    created_at: new Date().toISOString()
  }
}