#!/usr/bin/env node

/**
 * Extract vocabulary words from uploaded SSAT test files in knowledge_base
 * Generate flashcards from real test content instead of sample data
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function extractVocabularyFromUploads() {
  console.log('🔍 Extracting vocabulary from uploaded SSAT test files...\n')

  try {
    // Get all uploaded content from knowledge_base
    const { data: uploads, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .or('tags.cs.{user_upload}, source.not.is.null, topic.eq.uploaded_document')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error querying uploads:', error)
      return
    }

    if (!uploads || uploads.length === 0) {
      console.log('📭 No uploaded files found')
      return
    }

    console.log(`📁 Found ${uploads.length} uploaded content chunks`)

    // Combine all content from uploads
    const allContent = uploads.map(chunk => chunk.content || '').join(' ')
    console.log(`📊 Total content length: ${allContent.length} characters`)

    // Extract vocabulary words from the content
    console.log('\n🔤 Extracting vocabulary words...')
    const vocabularyWords = extractAdvancedVocabulary(allContent)
    
    console.log(`\n✨ Extracted ${vocabularyWords.length} vocabulary words from uploaded SSAT tests`)
    
    // Show some examples
    console.log('\n📝 Sample vocabulary words extracted:')
    vocabularyWords.slice(0, 20).forEach((word, index) => {
      console.log(`   ${index + 1}. ${word}`)
    })

    // Group by difficulty based on word length and complexity
    const easy = vocabularyWords.filter(word => word.length >= 6 && word.length <= 8)
    const medium = vocabularyWords.filter(word => word.length >= 9 && word.length <= 11)
    const hard = vocabularyWords.filter(word => word.length >= 12)

    console.log('\n📊 Vocabulary by difficulty:')
    console.log(`   Easy (6-8 letters): ${easy.length} words`)
    console.log(`   Medium (9-11 letters): ${medium.length} words`)
    console.log(`   Hard (12+ letters): ${hard.length} words`)

    // Save the extracted vocabulary to a file for further processing
    const vocabularyData = {
      extractedAt: new Date().toISOString(),
      sourceFiles: [...new Set(uploads.map(chunk => chunk.source).filter(Boolean))],
      totalWords: vocabularyWords.length,
      words: {
        easy: easy.slice(0, 50), // Limit to 50 per difficulty
        medium: medium.slice(0, 50),
        hard: hard.slice(0, 50)
      }
    }

    // Write to a JSON file for inspection
    const fs = await import('fs/promises')
    await fs.writeFile(
      './extracted-vocabulary.json', 
      JSON.stringify(vocabularyData, null, 2)
    )

    console.log('\n💾 Vocabulary data saved to ./extracted-vocabulary.json')

    // Show example entries for each difficulty
    console.log('\n📚 Examples by difficulty:')
    console.log(`\n   Easy words: ${easy.slice(0, 10).join(', ')}`)
    console.log(`   Medium words: ${medium.slice(0, 10).join(', ')}`)
    console.log(`   Hard words: ${hard.slice(0, 10).join(', ')}`)

    return vocabularyData

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

function extractAdvancedVocabulary(text) {
  if (!text) return []
  
  // Extract words that are suitable for SSAT vocabulary
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length >= 6 && // At least 6 characters for SSAT level
      word.length <= 15 && // Not too long to be impractical
      /^[a-z]+$/.test(word) && // Only letters
      !commonWords.has(word) && // Not a common word
      !testSpecificWords.has(word) && // Not test-specific terms
      isLikelyVocabularyWord(word) // Additional quality check
    )
  
  // Remove duplicates, sort by length then alphabetically
  const uniqueWords = [...new Set(words)]
  return uniqueWords.sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length
    return a.localeCompare(b)
  })
}

function isLikelyVocabularyWord(word) {
  // Additional checks for word quality
  
  // Skip words that are likely proper nouns or test-specific
  if (word[0] === word[0].toUpperCase()) return false
  
  // Skip words with repeated letters (often not real words)
  if (/(.)\1{2,}/.test(word)) return false
  
  // Skip words that are likely numbers or codes
  if (/\d/.test(word)) return false
  
  // Skip very short suffixes
  if (word.length < 6) return false
  
  // Prefer words with common vocabulary patterns
  const hasCommonSuffix = /ing$|tion$|ness$|ment$|able$|ible$|ful$|less$|ous$|ive$|ary$|ism$|ist$|ize$|ify$/.test(word)
  const hasCommonPrefix = /^un|re|pre|dis|mis|over|under|sub|super|anti|auto|co|counter|extra|inter|micro|multi|non|post|pro|semi|trans|ultra/.test(word)
  
  return word.length >= 8 || hasCommonSuffix || hasCommonPrefix
}

// Common words to exclude (expanded list for SSAT level)
const commonWords = new Set([
  // Basic common words
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use',
  
  // Extended common words
  'about', 'after', 'again', 'also', 'another', 'any', 'because', 'been', 'before', 'being', 'between', 'both', 'came', 'come', 'could', 'does', 'each', 'even', 'every', 'first', 'from', 'give', 'good', 'great', 'here', 'into', 'just', 'know', 'last', 'left', 'life', 'like', 'look', 'made', 'make', 'many', 'more', 'most', 'move', 'much', 'must', 'name', 'need', 'only', 'other', 'over', 'part', 'place', 'right', 'said', 'same', 'school', 'should', 'since', 'small', 'some', 'still', 'such', 'take', 'than', 'that', 'their', 'them', 'there', 'these', 'they', 'thing', 'think', 'this', 'those', 'through', 'time', 'under', 'until', 'very', 'want', 'water', 'well', 'went', 'were', 'what', 'when', 'where', 'which', 'while', 'with', 'work', 'would', 'write', 'year', 'your',
  
  // Additional common words for test context
  'answer', 'question', 'following', 'choose', 'correct', 'best', 'passage', 'according', 'author', 'paragraph', 'sentence', 'word', 'meaning', 'context', 'example', 'evidence', 'support', 'suggest', 'indicate', 'likely', 'probably', 'possible', 'section', 'reading', 'test', 'exam'
])

// Test-specific words to exclude
const testSpecificWords = new Set([
  'ssat', 'test', 'answer', 'question', 'option', 'choice', 'passage', 'section', 'verbal', 'quantitative', 'reading', 'math', 'multiple', 'select', 'indicate', 'following', 'paragraph', 'sentence', 'according', 'author', 'best', 'correct', 'evidence', 'support', 'suggest', 'likely', 'probably', 'possible', 'example', 'context', 'meaning', 'word', 'phrase', 'line', 'lines', 'column', 'columns', 'figure', 'table', 'chart', 'graph', 'diagram', 'picture', 'image'
])

// Run the extraction
extractVocabularyFromUploads()