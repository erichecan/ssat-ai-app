import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, batchSize = 10, maxWords = 50 } = await request.json()
    
    // Fix UUID format for demo user
    let finalUserId = userId
    if (!userId || userId === 'demo-user-123') {
      finalUserId = '00000000-0000-0000-0000-000000000001'
    }
    
    console.log(`Generating vocabulary from uploaded files for user: ${finalUserId}`)
    
    // Check environment variables
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

    // Use admin client to bypass RLS policies
    const supabaseAdmin = getSupabaseAdmin()

    // Get uploaded content from knowledge_base
    const { data: uploads, error: uploadError } = await supabaseAdmin
      .from('knowledge_base')
      .select('content, source, title')
      .or('tags.cs.{user_upload}, source.not.is.null, topic.eq.uploaded_document')
      .limit(50) // Limit to avoid too much content

    if (uploadError) {
      console.error('Error fetching uploads:', uploadError)
      return NextResponse.json(
        { error: 'Failed to fetch uploaded content' },
        { status: 500 }
      )
    }

    if (!uploads || uploads.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No uploaded files found to extract vocabulary from'
      })
    }

    console.log(`Found ${uploads.length} uploaded content chunks`)

    // Combine content from uploads
    const combinedContent = uploads
      .map(chunk => chunk.content || '')
      .join(' ')
      .substring(0, 8000) // Limit content length for AI processing

    console.log(`Processing ${combinedContent.length} characters of uploaded content`)

    // Extract vocabulary words directly from the content
    const vocabularyWords = extractVocabularyWords(combinedContent)
    
    console.log(`Extracted ${vocabularyWords.length} potential vocabulary words`)

    if (vocabularyWords.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No suitable vocabulary words found in uploaded content'
      })
    }

    // Select a diverse set of words
    const selectedWords = selectDiverseWords(vocabularyWords, maxWords)
    console.log(`Selected ${selectedWords.length} words for flashcard generation`)

    // Generate flashcards in batches
    const actualBatchSize = Math.min(batchSize, 5) // Max 5 words per batch
    const numBatches = Math.ceil(selectedWords.length / actualBatchSize)

    let generatedWords = []
    let successfulBatches = 0
    let totalGenerated = 0
    
    for (let batch = 0; batch < numBatches; batch++) {
      try {
        const batchWords = selectedWords.slice(
          batch * actualBatchSize,
          (batch + 1) * actualBatchSize
        )
        
        console.log(`Generating batch ${batch + 1}/${numBatches}: ${batchWords.join(', ')}`)
        
        const prompt = `Create vocabulary flashcards for these words found in SSAT practice tests: ${batchWords.join(', ')}

These words were extracted from actual uploaded SSAT test materials. Create comprehensive flashcards with:

{
  "words": [
    {
      "word": "perspicacious",
      "definition": "Having keen insight and understanding",
      "pronunciation": "/ˌpɜːrspɪˈkeɪʃəs/",
      "part_of_speech": "adjective",
      "difficulty": "hard",
      "example_sentence": "The perspicacious student quickly grasped the hidden meaning in the passage.",
      "synonyms": ["perceptive", "insightful"],
      "antonyms": ["obtuse", "dull"],
      "memory_tip": "Think of 'perspective' - someone with good perspective is perspicacious"
    }
  ]
}

Requirements:
- SSAT/SAT appropriate definitions for middle school students
- Clear pronunciation guides
- Age-appropriate example sentences
- Useful memory tips
- Accurate synonyms and antonyms

Return only valid JSON.`

        const aiResponse = await generateText(prompt, 30000) // 30 second timeout
        const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim()
        const parsedResponse = JSON.parse(cleanResponse)

        if (parsedResponse.words && Array.isArray(parsedResponse.words)) {
          const batchVocabWords = parsedResponse.words.filter((word: any) => 
            word.word && word.definition && word.part_of_speech
          )

          // Insert to database using flashcards table structure
          const wordsToInsert = batchVocabWords.map((word: any) => ({
            user_id: finalUserId,
            word: word.word.toLowerCase(),
            definition: word.definition,
            type: 'vocabulary',
            subject: 'SSAT Vocabulary from Uploads',
            difficulty_level: getDifficultyLevel(word.difficulty),
            question: `What does "${word.word}" mean?`,
            answer: word.definition,
            explanation: `${word.word} (${word.part_of_speech}): ${word.definition}\n\nExample: ${word.example_sentence}${word.memory_tip ? `\n\nMemory Tip: ${word.memory_tip}` : ''}`,
            pronunciation: word.pronunciation || '',
            part_of_speech: word.part_of_speech || '',
            example_sentence: word.example_sentence || '',
            memory_tip: word.memory_tip || '',
            synonyms: word.synonyms || [],
            antonyms: word.antonyms || [],
            etymology: '',
            category: 'vocabulary',
            frequency_score: 70, // Higher score for words from actual test materials
            source_type: 'uploaded_content',
            source_context: `Extracted from uploaded SSAT test materials: ${uploads.map(u => u.source).filter(Boolean).join(', ')}`,
            tags: ['vocabulary', 'ssat', 'uploaded-content'],
            is_public: true,
            usage_count: 0,
            avg_rating: 0
          }))

          console.log(`Attempting to insert ${wordsToInsert.length} words from uploaded content...`)

          const { data: insertedWords, error: insertError } = await supabaseAdmin
            .from('flashcards')
            .upsert(wordsToInsert, { 
              onConflict: 'word,user_id',
              ignoreDuplicates: true 
            })
            .select('word')

          if (insertError) {
            console.error(`Batch ${batch + 1} insert error:`, insertError)
          } else {
            successfulBatches++
            totalGenerated += insertedWords?.length || 0
            console.log(`Batch ${batch + 1} completed: ${insertedWords?.length} words inserted from uploads`)
            generatedWords.push(...batchVocabWords)
          }
        }

        // Short delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (batchError) {
        console.error(`Batch ${batch + 1} failed:`, batchError)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${totalGenerated} vocabulary words from uploaded SSAT test materials`,
      stats: {
        uploadedChunks: uploads.length,
        extractedWords: vocabularyWords.length,
        selectedWords: selectedWords.length,
        batchesProcessed: numBatches,
        successfulBatches,
        totalGenerated,
        sourceFiles: Array.from(new Set(uploads.map(u => u.source).filter(Boolean)))
      },
      sampleWords: generatedWords.slice(0, 5).map((w: any) => ({
        word: w.word,
        definition: w.definition,
        difficulty: w.difficulty,
        source: 'uploaded_content'
      }))
    })

  } catch (error) {
    console.error('Generate from uploads error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate vocabulary from uploads',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function extractVocabularyWords(text: string): string[] {
  if (!text) return []
  
  // Extract words suitable for SSAT vocabulary
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length >= 6 && // Minimum length for SSAT words
      word.length <= 15 && // Not too long
      /^[a-z]+$/.test(word) && // Only letters
      !commonWords.has(word) && // Not common words
      !testSpecificWords.has(word) && // Not test-specific terms
      isLikelyVocabularyWord(word) // Quality check
    )
  
  // Remove duplicates and sort
  return Array.from(new Set(words)).sort()
}

function selectDiverseWords(words: string[], maxWords: number): string[] {
  // Group by length for diversity
  const short = words.filter(w => w.length >= 6 && w.length <= 8)
  const medium = words.filter(w => w.length >= 9 && w.length <= 11)
  const long = words.filter(w => w.length >= 12)
  
  // Select proportionally from each group
  const shortCount = Math.floor(maxWords * 0.4)
  const mediumCount = Math.floor(maxWords * 0.4)
  const longCount = maxWords - shortCount - mediumCount
  
  const selected = [
    ...short.slice(0, shortCount),
    ...medium.slice(0, mediumCount),
    ...long.slice(0, longCount)
  ]
  
  // Shuffle for variety
  return selected.sort(() => Math.random() - 0.5)
}

function isLikelyVocabularyWord(word: string): boolean {
  // Additional quality checks
  if (/(.)\1{2,}/.test(word)) return false // Skip repeated letters
  if (/\d/.test(word)) return false // Skip words with numbers
  
  // Prefer words with common patterns
  const hasVocabPattern = /ing$|tion$|ness$|ment$|able$|ible$|ful$|less$|ous$|ive$|ary$|ism$|ist$|ize$|ify$/.test(word)
  const hasPrefix = /^un|re|pre|dis|mis|over|under|sub|super|anti|auto|co|counter|extra|inter|micro|multi|non|post|pro|semi|trans|ultra/.test(word)
  
  return word.length >= 8 || hasVocabPattern || hasPrefix
}

function getDifficultyLevel(difficulty: string): number {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 1
    case 'hard': return 3
    default: return 2 // medium
  }
}

// Common words to exclude
const commonWords = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use',
  'about', 'after', 'again', 'also', 'another', 'any', 'because', 'been', 'before', 'being', 'between', 'both', 'came', 'come', 'could', 'does', 'each', 'even', 'every', 'first', 'from', 'give', 'good', 'great', 'here', 'into', 'just', 'know', 'last', 'left', 'life', 'like', 'look', 'made', 'make', 'many', 'more', 'most', 'move', 'much', 'must', 'name', 'need', 'only', 'other', 'over', 'part', 'place', 'right', 'said', 'same', 'school', 'should', 'since', 'small', 'some', 'still', 'such', 'take', 'than', 'that', 'their', 'them', 'there', 'these', 'they', 'thing', 'think', 'this', 'those', 'through', 'time', 'under', 'until', 'very', 'want', 'water', 'well', 'went', 'were', 'what', 'when', 'where', 'which', 'while', 'with', 'work', 'would', 'write', 'year', 'your'
])

// Test-specific terms to exclude
const testSpecificWords = new Set([
  'ssat', 'test', 'answer', 'question', 'option', 'choice', 'passage', 'section', 'verbal', 'quantitative', 'reading', 'math', 'multiple', 'select', 'indicate', 'following', 'paragraph', 'sentence', 'according', 'author', 'best', 'correct', 'evidence', 'support', 'suggest', 'likely', 'probably', 'possible', 'example', 'context', 'meaning', 'word', 'phrase', 'line', 'lines', 'column', 'columns', 'figure', 'table', 'chart', 'graph', 'diagram', 'picture', 'image'
])

// GET endpoint to check uploaded content status
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // Check uploaded content
    const { data: uploads, error } = await supabaseAdmin
      .from('knowledge_base')
      .select('source, title, created_at')
      .or('tags.cs.{user_upload}, source.not.is.null, topic.eq.uploaded_document')
    
    if (error) {
      console.error('Error checking uploads:', error)
    }
    
    const fileCount = uploads ? new Set(uploads.map(u => u.source).filter(Boolean)).size : 0
    
    return NextResponse.json({
      success: true,
      message: 'Upload-based vocabulary generation ready',
      uploadedFiles: fileCount,
      totalChunks: uploads?.length || 0,
      sourceFiles: uploads ? Array.from(new Set(uploads.map(u => u.source).filter(Boolean))) : [],
      lastUpload: uploads?.[0]?.created_at || null
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check upload status',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}