#!/usr/bin/env node

/**
 * Generate vocabulary flashcards from extracted words from uploaded SSAT tests
 * This replaces the sample content with real test material
 */

import { createClient } from '@supabase/supabase-js'
import { generateText } from '../lib/gemini.js'
import dotenv from 'dotenv'
import fs from 'fs/promises'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function generateVocabularyFromUploads() {
  console.log('🎯 Generating vocabulary flashcards from uploaded SSAT tests...\n')

  try {
    // Load the extracted vocabulary
    const vocabularyData = JSON.parse(await fs.readFile('./extracted-vocabulary.json', 'utf8'))
    console.log(`📚 Loaded ${vocabularyData.totalWords} vocabulary words from ${vocabularyData.sourceFiles.length} SSAT test files`)

    // Select a diverse set of words across difficulties
    const selectedWords = [
      ...vocabularyData.words.easy.slice(0, 20),
      ...vocabularyData.words.medium.slice(0, 20), 
      ...vocabularyData.words.hard.slice(0, 10)
    ]

    console.log(`🎯 Selected ${selectedWords.length} words for flashcard generation`)
    console.log('Sample words:', selectedWords.slice(0, 10).join(', '))

    // Generate flashcards for batches of words
    const batchSize = 5
    const totalBatches = Math.ceil(selectedWords.length / batchSize)
    
    console.log(`\n🔄 Processing ${totalBatches} batches of ${batchSize} words each...`)

    for (let i = 0; i < selectedWords.length; i += batchSize) {
      const batch = selectedWords.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      
      console.log(`\n📝 Processing batch ${batchNumber}/${totalBatches}: ${batch.join(', ')}`)

      try {
        const flashcards = await generateFlashcardsForWords(batch, vocabularyData.sourceFiles)
        
        if (flashcards && flashcards.length > 0) {
          await saveFlashcardsToDatabase(flashcards)
          console.log(`✅ Successfully generated and saved ${flashcards.length} flashcards`)
        } else {
          console.log('⚠️  No flashcards generated for this batch')
        }

        // Add a small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`❌ Error processing batch ${batchNumber}:`, error.message)
        continue // Continue with next batch
      }
    }

    console.log('\n🎉 Vocabulary generation completed!')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function generateFlashcardsForWords(words, sourceFiles) {
  const prompt = `Create vocabulary flashcards for these SSAT-level words: ${words.join(', ')}

These words were extracted from actual SSAT practice tests: ${sourceFiles.join(', ')}

For each word, provide:
1. A clear, student-friendly definition
2. The part of speech
3. An example sentence that a middle school student would understand
4. One synonym and one antonym (if applicable)

Format as JSON array with this structure:
[
  {
    "word": "example",
    "definition": "a thing characteristic of its kind or illustrating a general rule",
    "partOfSpeech": "noun", 
    "example": "The teacher gave an example to help students understand the concept.",
    "synonym": "instance",
    "antonym": null
  }
]

Focus on SSAT-appropriate definitions that will help middle school students understand and remember these words.`

  try {
    console.log(`🤖 Generating flashcards for: ${words.join(', ')}`)
    
    const response = await generateText(prompt, {
      temperature: 0.7,
      maxOutputTokens: 2000,
      timeout: 45000
    })

    if (!response) {
      throw new Error('No response from AI')
    }

    // Clean up the response to extract JSON
    let jsonStr = response.trim()
    
    // Remove any markdown formatting
    jsonStr = jsonStr.replace(/```json\s*|\s*```/g, '')
    
    // Try to find JSON array
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    const flashcards = JSON.parse(jsonStr)
    
    if (!Array.isArray(flashcards)) {
      throw new Error('Response is not an array')
    }

    console.log(`✨ Generated ${flashcards.length} flashcards`)
    return flashcards

  } catch (error) {
    console.error('❌ Error generating flashcards:', error.message)
    return []
  }
}

async function saveFlashcardsToDatabase(flashcards) {
  try {
    // First, check current flashcard count
    const { count: currentCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'vocabulary')

    console.log(`📊 Current vocabulary questions in database: ${currentCount || 0}`)

    for (const [index, flashcard] of flashcards.entries()) {
      try {
        // Create a unique ID for this question
        const questionId = `vocab-upload-${Date.now()}-${index}`

        // Prepare the question data
        const questionData = {
          id: questionId,
          type: 'vocabulary',
          difficulty: getDifficultyByWordLength(flashcard.word),
          question: `What does "${flashcard.word}" mean?`,
          options: generateMultipleChoiceOptions(flashcard.definition, flashcard.word),
          correct_answer: flashcard.definition,
          explanation: `${flashcard.word} (${flashcard.partOfSpeech}): ${flashcard.definition}\n\nExample: ${flashcard.example}${flashcard.synonym ? `\nSynonym: ${flashcard.synonym}` : ''}${flashcard.antonym ? `\nAntonym: ${flashcard.antonym}` : ''}`,
          tags: ['vocabulary', 'ssat', 'uploaded-content', flashcard.partOfSpeech],
          created_at: new Date().toISOString()
        }

        // Insert into database
        const { error } = await supabase
          .from('questions')
          .insert(questionData)

        if (error) {
          if (error.code === '23505') { // Duplicate key
            console.log(`⚠️  Question for "${flashcard.word}" already exists, skipping`)
          } else {
            console.error(`❌ Error saving "${flashcard.word}":`, error.message)
          }
        } else {
          console.log(`✅ Saved flashcard for "${flashcard.word}"`)
        }

      } catch (saveError) {
        console.error(`❌ Error saving flashcard for "${flashcard.word}":`, saveError.message)
      }
    }

  } catch (error) {
    console.error('❌ Error in saveFlashcardsToDatabase:', error)
  }
}

function getDifficultyByWordLength(word) {
  if (word.length <= 8) return 'easy'
  if (word.length <= 11) return 'medium'
  return 'hard'
}

function generateMultipleChoiceOptions(correctDefinition, word) {
  // Create plausible but incorrect options
  const distractors = [
    `A type of ${word.slice(0, -2)}ing or activity`,
    `Something that is ${word.slice(0, -1)}e or similar`,
    `The process of making something ${word.slice(0, -3)}ful`,
    `A person who ${word.slice(0, -2)}s professionally`
  ]

  // Shuffle and take 3 distractors + correct answer
  const shuffled = distractors.sort(() => Math.random() - 0.5).slice(0, 3)
  const allOptions = [correctDefinition, ...shuffled].sort(() => Math.random() - 0.5)
  
  return allOptions
}

// Run the generation
generateVocabularyFromUploads()