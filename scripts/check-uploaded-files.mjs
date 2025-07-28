#!/usr/bin/env node

/**
 * Script to check uploaded files in the knowledge_base table
 * and show their content for vocabulary extraction
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUploadedFiles() {
  console.log('🔍 Checking for uploaded files in knowledge_base table...\n')

  try {
    // First, let's see the overall structure of the knowledge_base table
    const { data: allEntries, error: allError } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('❌ Error querying knowledge_base:', allError)
      return
    }

    console.log(`📊 Total entries in knowledge_base: ${allEntries?.length || 0}`)

    if (!allEntries || allEntries.length === 0) {
      console.log('📭 No entries found in knowledge_base table')
      return
    }

    // Group by source (filename) to see uploaded files
    const uploadedFiles = new Map()
    const sampleEntries = []

    for (const entry of allEntries) {
      // Check if this is an uploaded file (has user_upload tag or source field)
      const isUploaded = entry.tags?.includes('user_upload') || 
                        entry.source || 
                        entry.title?.includes('Part') ||
                        entry.topic === 'uploaded_document'

      if (isUploaded) {
        const source = entry.source || entry.title || 'Unknown'
        if (!uploadedFiles.has(source)) {
          uploadedFiles.set(source, [])
        }
        uploadedFiles.get(source).push(entry)
      } else {
        sampleEntries.push(entry)
      }
    }

    console.log(`\n📁 Uploaded files found: ${uploadedFiles.size}`)
    console.log(`📝 Sample entries (non-uploaded): ${sampleEntries.length}`)

    // Show uploaded files
    if (uploadedFiles.size > 0) {
      console.log('\n' + '='.repeat(60))
      console.log('📁 UPLOADED FILES ANALYSIS')
      console.log('='.repeat(60))

      for (const [filename, chunks] of uploadedFiles) {
        console.log(`\n📄 File: ${filename}`)
        console.log(`   Chunks: ${chunks.length}`)
        console.log(`   Total content length: ${chunks.reduce((sum, chunk) => sum + (chunk.content?.length || 0), 0)} characters`)
        console.log(`   Upload date: ${chunks[0]?.created_at || 'Unknown'}`)
        
        // Show first few chunks with preview
        console.log(`   Content preview from first chunk:`)
        const firstChunk = chunks[0]
        if (firstChunk?.content) {
          const preview = firstChunk.content.substring(0, 200).replace(/\s+/g, ' ').trim()
          console.log(`   "${preview}${firstChunk.content.length > 200 ? '...' : ''}"`)
        }

        // Extract vocabulary-worthy words from this file
        console.log(`\n   🔤 Potential vocabulary words from this file:`)
        const allContent = chunks.map(chunk => chunk.content || '').join(' ')
        const vocabularyWords = extractVocabularyWords(allContent)
        console.log(`   Found ${vocabularyWords.length} potential vocabulary words:`)
        console.log(`   ${vocabularyWords.slice(0, 10).join(', ')}${vocabularyWords.length > 10 ? '...' : ''}`)
      }
    }

    // Show sample entries (non-uploaded content)
    if (sampleEntries.length > 0) {
      console.log('\n' + '='.repeat(60))
      console.log('📝 SAMPLE ENTRIES (Non-uploaded content)')
      console.log('='.repeat(60))

      sampleEntries.slice(0, 5).forEach((entry, index) => {
        console.log(`\n${index + 1}. Title: ${entry.title}`)
        console.log(`   Topic: ${entry.topic}`)
        console.log(`   Type: ${entry.type}`)
        console.log(`   Source: ${entry.source || 'None'}`)
        console.log(`   Tags: ${entry.tags?.join(', ') || 'None'}`)
        const preview = entry.content?.substring(0, 150).replace(/\s+/g, ' ').trim()
        console.log(`   Content: "${preview}${(entry.content?.length || 0) > 150 ? '...' : ''}"`)
      })
    }

    // Show statistics
    console.log('\n' + '='.repeat(60))
    console.log('📊 STATISTICS')
    console.log('='.repeat(60))
    console.log(`Total knowledge_base entries: ${allEntries.length}`)
    console.log(`Uploaded files: ${uploadedFiles.size}`)
    console.log(`Sample/default entries: ${sampleEntries.length}`)
    
    const totalUploadedChunks = Array.from(uploadedFiles.values()).reduce((sum, chunks) => sum + chunks.length, 0)
    console.log(`Total uploaded chunks: ${totalUploadedChunks}`)
    
    const totalUploadedWords = Array.from(uploadedFiles.values())
      .flat()
      .reduce((sum, chunk) => sum + (chunk.content?.split(/\s+/).length || 0), 0)
    console.log(`Total words in uploaded content: ${totalUploadedWords}`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

function extractVocabularyWords(text) {
  if (!text) return []
  
  // Extract words that are likely vocabulary words (longer, more complex words)
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length >= 6 && // At least 6 characters
      word.length <= 15 && // Not too long
      /^[a-z]+$/.test(word) && // Only letters
      !commonWords.has(word) // Not a common word
    )
  
  // Remove duplicates and return sorted
  return [...new Set(words)].sort()
}

// Common words to exclude from vocabulary extraction
const commonWords = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use',
  'about', 'after', 'again', 'also', 'another', 'any', 'because', 'been', 'before', 'being', 'between', 'both', 'came', 'come', 'could', 'did', 'does', 'each', 'even', 'every', 'first', 'from', 'give', 'good', 'great', 'here', 'into', 'just', 'know', 'last', 'left', 'life', 'like', 'look', 'made', 'make', 'many', 'may', 'more', 'most', 'move', 'much', 'must', 'name', 'need', 'only', 'other', 'over', 'own', 'part', 'place', 'right', 'said', 'same', 'school', 'should', 'since', 'small', 'some', 'still', 'such', 'take', 'than', 'that', 'their', 'them', 'there', 'these', 'they', 'thing', 'think', 'this', 'those', 'through', 'time', 'under', 'until', 'very', 'want', 'water', 'well', 'went', 'were', 'what', 'when', 'where', 'which', 'while', 'with', 'work', 'would', 'write', 'year', 'your'
])

// Run the check
checkUploadedFiles()