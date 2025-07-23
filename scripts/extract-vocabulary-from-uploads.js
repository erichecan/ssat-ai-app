/**
 * Extract vocabulary words from uploaded files by frequency
 * Run with: node scripts/extract-vocabulary-from-uploads.js
 */

const { createClient } = require('@supabase/supabase-js')
const { GoogleGenerativeAI } = require('@google/generative-ai')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)

const supabase = createClient(supabaseUrl, supabaseKey)

// Common words to exclude (articles, prepositions, etc.)
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 
  'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 
  'by', 'from', 'they', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 
  'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 
  'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 
  'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 
  'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 
  'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 
  'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 
  'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are'
])

// SSAT/SAT level words that are worth including
const isAcademicWord = (word) => {
  return word.length >= 6 && // At least 6 characters
         /^[a-zA-Z]+$/.test(word) && // Only letters
         !STOP_WORDS.has(word.toLowerCase()) &&
         !word.match(/^(ing|ed|er|est|ly|tion|sion)$/i) // Not just suffixes
}

const extractWordsFromText = (text) => {
  if (!text || typeof text !== 'string') return []
  
  // Extract words, clean them, and count frequency
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word => word && isAcademicWord(word))
  
  const wordCount = {}
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a) // Sort by frequency descending
    .map(([word, count]) => ({ word, count }))
}

const generateFlashcardContent = async (word, context = '') => {
  try {
    console.log(`Generating content for: ${word}`)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const prompt = `You are a vocabulary expert creating a comprehensive flashcard for SSAT/SAT test preparation.

Word: "${word}"
Context: "${context || 'Academic vocabulary'}"

Create a detailed flashcard with the following information (respond in valid JSON format only):

{
  "definition": "Clear, concise definition suitable for high school students",
  "pronunciation": "IPA pronunciation in /.../ format",
  "part_of_speech": "noun/verb/adjective/adverb/etc",
  "example_sentence": "Natural example sentence using the word in context",
  "synonyms": ["synonym1", "synonym2", "synonym3"],
  "antonyms": ["antonym1", "antonym2"],
  "etymology": "Brief word origin if interesting/helpful",
  "memory_tip": "Helpful mnemonic or memory technique",
  "difficulty": "easy/medium/hard (based on SSAT/SAT level)"
}

Ensure the content is appropriate for SSAT/SAT test preparation and focuses on academic vocabulary usage.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    
    // Remove markdown code blocks if present
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    return JSON.parse(text)
  } catch (error) {
    console.error(`Failed to generate content for ${word}:`, error)
    return {
      definition: `Definition for "${word}" - please update`,
      pronunciation: '',
      part_of_speech: 'unknown',
      example_sentence: `Example sentence with ${word}.`,
      synonyms: [],
      antonyms: [],
      etymology: '',
      memory_tip: '',
      difficulty: 'medium'
    }
  }
}

const addWordsToVocabulary = async (words, userId = '00000000-0000-0000-0000-000000000001') => {
  const results = []
  
  for (const { word, count } of words.slice(0, 50)) { // Limit to top 50 words
    try {
      // Check if word already exists
      const { data: existing } = await supabase
        .from('flashcards')
        .select('id')
        .eq('user_id', userId)
        .eq('word', word.toLowerCase())
        .eq('type', 'vocabulary')
        .maybeSingle()

      if (existing) {
        console.log(`Skipping ${word} - already exists`)
        continue
      }

      // Generate AI content
      const content = await generateFlashcardContent(word, `Found ${count} times in uploaded materials`)
      
      // Insert into database
      const { data: newCard, error } = await supabase
        .from('flashcards')
        .insert({
          user_id: userId,
          word: word.toLowerCase(),
          definition: content.definition,
          type: 'vocabulary',
          subject: 'Advanced Vocabulary',
          difficulty_level: content.difficulty === 'easy' ? 1 : content.difficulty === 'medium' ? 2 : 3,
          question: `What does "${word}" mean?`,
          answer: content.definition,
          explanation: `${content.definition}. ${content.etymology ? `Etymology: ${content.etymology}` : ''}`,
          tags: ['upload_extraction', 'vocabulary', 'high_frequency'],
          pronunciation: content.pronunciation,
          part_of_speech: content.part_of_speech,
          example_sentence: content.example_sentence,
          synonyms: content.synonyms,
          antonyms: content.antonyms,
          etymology: content.etymology,
          memory_tip: content.memory_tip,
          category: 'vocabulary',
          frequency_score: Math.min(count * 10, 100),
          source_type: 'upload_extraction',
          source_context: `Found ${count} times in uploaded materials`
        })
        .select()
        .single()

      if (error) {
        console.error(`Error inserting ${word}:`, error)
      } else {
        console.log(`✓ Added ${word} (frequency: ${count})`)
        results.push({ word, count, success: true })
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error(`Error processing ${word}:`, error)
      results.push({ word, count, success: false, error: error.message })
    }
  }
  
  return results
}

const main = async () => {
  try {
    console.log('🔍 Fetching uploaded files...')
    
    // Use the uploaded-files API endpoint instead of direct DB access
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/uploaded-files?userId=demo-user-123`)
    const result = await response.json()

    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${result.error || 'Unknown error'}`)
    }

    const files = result.files || []
    if (files.length === 0) {
      console.log('No uploaded files found.')
      return
    }

    console.log(`Found ${files.length} uploaded files`)

    // Extract text from all files and combine
    let allText = ''
    for (const file of files) {
      console.log(`Processing: ${file.fileName} (${file.totalWords} words)`)
      
      // Extract text from chunks
      if (file.chunks && Array.isArray(file.chunks)) {
        for (const chunk of file.chunks) {
          if (chunk.preview) {
            allText += ' ' + chunk.preview
          }
        }
      }
    }

    if (!allText.trim()) {
      console.log('No text content found in uploaded files.')
      return
    }

    console.log(`📖 Analyzing ${allText.length} characters of text...`)

    // Extract words by frequency
    const words = extractWordsFromText(allText)
    
    console.log(`Found ${words.length} unique academic words`)
    console.log('Top 20 words by frequency:')
    words.slice(0, 20).forEach(({ word, count }, i) => {
      console.log(`${i + 1}. ${word} (${count} times)`)
    })

    // Add words to vocabulary
    console.log('\n🤖 Generating flashcards with AI...')
    const results = await addWordsToVocabulary(words)

    // Summary
    const successful = results.filter(r => r.success).length
    const failed = results.length - successful

    console.log('\n✅ Summary:')
    console.log(`Successfully added: ${successful} words`)
    console.log(`Failed: ${failed} words`)
    
    if (successful > 0) {
      console.log('\nSuccessfully added words:')
      results.filter(r => r.success).forEach(({ word, count }) => {
        console.log(`  • ${word} (frequency: ${count})`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { extractWordsFromText, generateFlashcardContent, addWordsToVocabulary }