#!/usr/bin/env node

/**
 * Check the generated vocabulary flashcards from uploaded content
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

async function checkGeneratedVocabulary() {
  console.log('🔍 Checking generated vocabulary flashcards...\n')

  try {
    // Get vocabulary flashcards from uploaded content
    const { data: uploadedVocab, error: uploadError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('source_type', 'uploaded_content')
      .eq('type', 'vocabulary')
      .order('created_at', { ascending: false })

    if (uploadError) {
      console.error('❌ Error querying uploaded vocabulary:', uploadError)
    } else {
      console.log(`📚 Found ${uploadedVocab?.length || 0} vocabulary words from uploaded content`)
      
      if (uploadedVocab && uploadedVocab.length > 0) {
        console.log('\n✨ Recently generated vocabulary from uploads:')
        uploadedVocab.slice(0, 10).forEach((word, index) => {
          console.log(`\n${index + 1}. ${word.word}`)
          console.log(`   Definition: ${word.definition}`)
          console.log(`   Difficulty: Level ${word.difficulty_level} (${word.difficulty_level === 1 ? 'Easy' : word.difficulty_level === 3 ? 'Hard' : 'Medium'})`)
          console.log(`   Example: ${word.example_sentence || 'N/A'}`)
          console.log(`   Memory tip: ${word.memory_tip || 'N/A'}`)
          console.log(`   Created: ${new Date(word.created_at).toLocaleString()}`)
        })
      }
    }

    // Compare with AI-generated vocabulary
    const { data: aiVocab, error: aiError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('source_type', 'ai_generated')
      .eq('type', 'vocabulary')
      .order('created_at', { ascending: false })

    if (aiError) {
      console.error('❌ Error querying AI vocabulary:', aiError)
    } else {
      console.log(`\n🤖 Found ${aiVocab?.length || 0} AI-generated vocabulary words for comparison`)
    }

    // Get all vocabulary stats
    const { data: allVocab, error: allError } = await supabase
      .from('flashcards')
      .select('source_type, difficulty_level, created_at')
      .eq('type', 'vocabulary')

    if (allError) {
      console.error('❌ Error querying all vocabulary:', allError)
    } else {
      console.log('\n' + '='.repeat(60))
      console.log('📊 VOCABULARY STATISTICS')
      console.log('='.repeat(60))
      
      const stats = {
        total: allVocab?.length || 0,
        bySource: {
          uploaded: allVocab?.filter(v => v.source_type === 'uploaded_content').length || 0,
          aiGenerated: allVocab?.filter(v => v.source_type === 'ai_generated').length || 0,
          static: allVocab?.filter(v => v.source_type === 'static_import').length || 0,
          other: allVocab?.filter(v => !['uploaded_content', 'ai_generated', 'static_import'].includes(v.source_type)).length || 0
        },
        byDifficulty: {
          easy: allVocab?.filter(v => v.difficulty_level === 1).length || 0,
          medium: allVocab?.filter(v => v.difficulty_level === 2).length || 0,
          hard: allVocab?.filter(v => v.difficulty_level === 3).length || 0
        }
      }

      console.log(`Total vocabulary words: ${stats.total}`)
      console.log(`\nBy source:`)
      console.log(`  📁 From uploaded files: ${stats.bySource.uploaded}`)
      console.log(`  🤖 AI generated: ${stats.bySource.aiGenerated}`)
      console.log(`  📚 Static import: ${stats.bySource.static}`)
      console.log(`  ❓ Other: ${stats.bySource.other}`)
      
      console.log(`\nBy difficulty:`)
      console.log(`  🟢 Easy: ${stats.byDifficulty.easy}`)
      console.log(`  🟡 Medium: ${stats.byDifficulty.medium}`)
      console.log(`  🔴 Hard: ${stats.byDifficulty.hard}`)

      // Show impact of uploaded content
      const uploadedPercentage = stats.total > 0 ? Math.round((stats.bySource.uploaded / stats.total) * 100) : 0
      console.log(`\n🎯 Impact: ${uploadedPercentage}% of vocabulary now comes from real SSAT test materials!`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the check
checkGeneratedVocabulary()