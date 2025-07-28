/**
 * Extract vocabulary words from uploaded files by frequency (Direct DB Access)
 * Run with: node scripts/extract-vocabulary-direct.js
 */

const { createClient } = require('@supabase/supabase-js')
const { GoogleGenerativeAI } = require('@google/generative-ai')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)

if (!supabaseUrl || !supabaseKey || !process.env.GOOGLE_GEMINI_API_KEY) {
  console.error('❌ Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_GEMINI_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Demo user UUID
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

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
  'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are',
  // Additional common words
  'said', 'each', 'which', 'she', 'do', 'how', 'their', 'if', 'will', 'up',
  'other', 'about', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her',
  'would', 'make', 'like', 'into', 'him', 'has', 'two', 'more', 'very', 'what',
  'know', 'just', 'first', 'get', 'over', 'think', 'also', 'your', 'work',
  'life', 'only', 'new', 'years', 'way', 'may', 'say', 'come', 'its', 'now',
  'during', 'learn', 'around', 'usually', 'form', 'meat', 'air', 'day', 'place',
  'become', 'number', 'public', 'read', 'keep', 'part', 'start', 'year', 'every',
  'field', 'large', 'once', 'available', 'down', 'give', 'fish', 'human', 'both',
  'local', 'sure', 'something', 'without', 'come', 'me', 'back', 'better', 'general',
  'process', 'she', 'heat', 'thanks', 'specific', 'enough', 'long', 'lot', 'hand',
  'high', 'year', 'government', 'right', 'good', 'same', 'important', 'small'
])

// 更宽松的词汇筛选 - 只要是有意义的词汇都可以提取
const isValidWord = (word) => {
  return word.length >= 4 && // At least 4 characters (降低要求)
         /^[a-zA-Z]+$/.test(word) && // Only letters
         !STOP_WORDS.has(word.toLowerCase()) &&
         !word.match(/^(ing|ed|er|est|ly|tion|sion)$/i) // Not ONLY common suffixes
}

// 学术词汇优先级评分（用于排序）
const getWordPriority = (word) => {
  let priority = 0
  
  // 长度越长，可能越是学术词汇
  if (word.length >= 8) priority += 3
  else if (word.length >= 6) priority += 2
  else if (word.length >= 5) priority += 1
  
  // 包含常见学术词汇特征
  if (word.match(/tion|sion|ment|ness|ity|ous|ful|less|able|ible$/)) priority += 2
  if (word.match(/^(un|re|pre|dis|mis|over|under|out)/)) priority += 1
  
  // 常见学术词汇模式
  if (word.match(/^(ana|syn|meta|epi|hypo|hyper|micro|macro)/)) priority += 3
  
  return priority
}

const extractWordsFromText = (text) => {
  if (!text || typeof text !== 'string') return []
  
  // Extract words, clean them, and count frequency
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word => word && word.length > 0)
  
  console.log(`📝 Total words found: ${words.length}`)
  
  // Debug: show some words before filtering
  console.log(`🔤 Sample words: ${words.slice(0, 20).join(', ')}`)
  
  const validWords = words.filter(word => isValidWord(word))
  console.log(`✅ Valid words found: ${validWords.length}`)
  
  if (validWords.length > 0) {
    console.log(`📚 Sample valid words: ${validWords.slice(0, 20).join(', ')}`)
  }
  
  // Count frequency
  const wordCount = {}
  validWords.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })
  
  // Filter by frequency >= 2 and sort by priority + frequency
  return Object.entries(wordCount)
    .filter(([word, count]) => count >= 2) // 只要词频 >= 2
    .map(([word, count]) => ({
      word,
      count,
      priority: getWordPriority(word) // 学术词汇优先级
    }))
    .sort((a, b) => {
      // 先按优先级排序（学术词汇优先），再按频率排序
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      return b.count - a.count
    })
    .slice(0, 300) // 提取更多词汇（300个）
}

const generateFlashcardContent = async (word, context = '') => {
  try {
    console.log(`🤖 Generating content for: ${word}`)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const prompt = `Create a vocabulary flashcard for SSAT/SAT preparation.

Word: "${word}"

Respond with valid JSON only:
{
  "definition": "Clear definition for high school students",
  "pronunciation": "American English IPA (/.../ format)",
  "part_of_speech": "noun/verb/adjective/etc",
  "example_sentence": "Natural example using the word",
  "synonyms": ["synonym1", "synonym2"],
  "antonyms": ["antonym1", "antonym2"],
  "etymology": "Brief origin if helpful",
  "memory_tip": "Helpful memory technique",
  "difficulty": "easy/medium/hard"
}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    
    // Clean response
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
    
    const content = JSON.parse(text)
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return content
  } catch (error) {
    console.error(`❌ Error generating content for "${word}":`, error.message)
    return null
  }
}

const addWordToDatabase = async (word, content, frequency, sourceContext) => {
  try {
    const flashcardData = {
      user_id: DEMO_USER_ID,
      word: word.toLowerCase(),
      definition: content.definition,
      type: 'vocabulary',
      subject: 'SSAT Vocabulary',
      difficulty_level: content.difficulty === 'easy' ? 1 : content.difficulty === 'hard' ? 3 : 2,
      question: `What does "${word}" mean?`,
      answer: content.definition,
      explanation: content.definition,
      pronunciation: content.pronunciation || '',
      part_of_speech: content.part_of_speech || '',
      example_sentence: content.example_sentence || '',
      memory_tip: content.memory_tip || '',
      synonyms: content.synonyms || [],
      antonyms: content.antonyms || [],
      etymology: content.etymology || '',
      category: 'vocabulary',
      frequency_score: Math.min(100, Math.max(1, frequency * 2)), // Scale frequency to 1-100
      source_type: 'frequency_extraction',
      source_context: sourceContext,
      tags: ['vocabulary', 'ssat', 'frequency_based'],
      is_public: true,
      usage_count: 0,
      avg_rating: 0
    }

    const { data, error } = await supabase
      .from('flashcards')
      .insert([flashcardData])
      .select('word')

    if (error) {
      console.error(`❌ Database error for "${word}":`, error.message)
      return false
    }

    console.log(`✅ Added "${word}" to database (frequency: ${frequency})`)
    return true
  } catch (error) {
    console.error(`❌ Failed to add "${word}" to database:`, error.message)
    return false
  }
}

const main = async () => {
  try {
    console.log('🚀 Starting vocabulary extraction from uploaded files...')
    
    // Fetch uploaded files directly from database
    console.log('📁 Fetching uploaded files from database...')
    const { data: uploadedFiles, error: filesError } = await supabase
      .from('knowledge_base')
      .select('id, title, content, file_name')
      .eq('processed_status', 'completed')
    
    if (filesError) {
      console.error('❌ Error fetching files:', filesError.message)
      return
    }
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      console.log('📄 No uploaded files found. Creating sample content instead...')
      
      // Use sample SSAT vocabulary content
      const sampleContent = `
        The perspicacious student demonstrated remarkable acuity in analyzing the complex literary passage.
        Her sagacious approach to the problem revealed an astute understanding of the underlying principles.
        The teacher commended her for being so perceptive and perspicuous in her explanations.
        
        The arduous journey required tremendous fortitude and perseverance to overcome the myriad obstacles.
        Despite the formidable challenges, she remained tenacious and indefatigable in her pursuit of excellence.
        Her unwavering determination and steadfast commitment were truly admirable qualities.
        
        The eloquent speaker captivated the audience with her mellifluous voice and articulate presentation.
        Her cogent arguments were both compelling and persuasive, demonstrating exceptional rhetorical skills.
        The discourse was both erudite and accessible, appealing to scholars and students alike.
        
        The ephemeral beauty of the sunset reminded us of life's transient nature and fleeting moments.
        Yet some experiences leave an indelible impression that remains permanently etched in memory.
        The juxtaposition of temporary and eternal themes created a profound philosophical reflection.
        
        The ubiquitous presence of technology has transformed contemporary society in unprecedented ways.
        This pervasive influence extends to education, communication, commerce, and entertainment sectors.
        The ramifications of this technological revolution continue to proliferate across all domains.
        
        Academic rigor demands meticulous attention to detail and systematic methodology in research.
        Scholars must maintain objectivity while conducting comprehensive analyses of complex phenomena.
        The pursuit of knowledge requires both intellectual curiosity and disciplined investigation.
        
        The protagonist's ambivalent feelings toward the situation created internal conflict and tension.
        Her vacillating emotions reflected the inherent complexity of human psychology and decision-making.
        The narrative explored themes of uncertainty, doubt, and the struggle for resolution.
        
        Environmental conservation requires collaborative efforts and sustainable practices from all stakeholders.
        The delicate ecosystem balance depends on biodiversity preservation and responsible resource management.
        Climate change mitigation strategies must address both immediate concerns and long-term consequences.
      `
      
      uploadedFiles.push({
        id: 'sample-content',
        title: 'SSAT Sample Vocabulary Content',
        content: sampleContent,
        file_name: 'sample_vocabulary.txt'
      })
    }
    
    console.log(`📚 Found ${uploadedFiles.length} files to process`)
    
    // Extract all text content
    let allText = ''
    for (const file of uploadedFiles) {
      console.log(`📖 Processing: ${file.file_name}`)
      if (file.content) {
        allText += file.content + ' '
      }
    }
    
    if (!allText.trim()) {
      console.log('❌ No text content found in uploaded files')
      return
    }
    
    console.log(`📄 Total text length: ${allText.length} characters`)
    
    // Extract words by frequency
    console.log('🔍 Extracting academic vocabulary by frequency...')
    const wordFrequencies = extractWordsFromText(allText)
    
    if (wordFrequencies.length === 0) {
      console.log('❌ No academic words found')
      return
    }
    
    console.log(`📊 Found ${wordFrequencies.length} unique academic words`)
    console.log('🏆 Top 10 words by frequency:')
    wordFrequencies.slice(0, 10).forEach(({word, count}, index) => {
      console.log(`   ${index + 1}. ${word} (${count} times)`)
    })
    
    // Check existing words to avoid duplicates
    console.log('🔍 Checking for existing words in database...')
    const existingWordsQuery = await supabase
      .from('flashcards')
      .select('word')
      .eq('user_id', DEMO_USER_ID)
      .eq('type', 'vocabulary')
    
    const existingWords = new Set(
      (existingWordsQuery.data || []).map(item => item.word?.toLowerCase())
    )
    
    console.log(`📝 Found ${existingWords.size} existing words in database`)
    
    // Filter out existing words
    const newWords = wordFrequencies.filter(({word}) => !existingWords.has(word.toLowerCase()))
    
    console.log(`🆕 ${newWords.length} new words to add`)
    console.log(`🎯 Top 10 words by priority and frequency:`)
    newWords.slice(0, 10).forEach(({word, count, priority}, index) => {
      console.log(`   ${index + 1}. ${word} (频率:${count}, 优先级:${priority})`)
    })
    
    if (newWords.length === 0) {
      console.log('✅ All frequent words already exist in database')
      return
    }
    
    // Process more words (increase limit since we're being more selective)
    const wordsToProcess = newWords.slice(0, 100) // 处理前100个新单词
    console.log(`🎯 Processing top ${wordsToProcess.length} words...`)
    
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < wordsToProcess.length; i++) {
      const {word, count} = wordsToProcess[i]
      console.log(`\n📝 [${i + 1}/${wordsToProcess.length}] Processing: ${word}`)
      
      // Generate flashcard content
      const content = await generateFlashcardContent(word, 'Academic text frequency analysis')
      
      if (!content) {
        console.log(`⚠️ Skipping "${word}" - content generation failed`)
        failCount++
        continue
      }
      
      // Add to database
      const success = await addWordToDatabase(
        word, 
        content, 
        count, 
        `Extracted from uploaded files with frequency ${count}`
      )
      
      if (success) {
        successCount++
      } else {
        failCount++
      }
      
      // Add delay between words to avoid rate limiting
      if (i < wordsToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    console.log('\n🎉 Vocabulary extraction completed!')
    console.log(`✅ Successfully added: ${successCount} words`)
    console.log(`❌ Failed: ${failCount} words`)
    console.log(`📊 Total vocabulary in database: ${existingWords.size + successCount}`)
    
    if (successCount > 0) {
      console.log('\n🔍 Verifying database update...')
      const { data: finalCount } = await supabase
        .from('flashcards')
        .select('word', { count: 'exact' })
        .eq('user_id', DEMO_USER_ID)
        .eq('type', 'vocabulary')
      
      console.log(`📈 Current vocabulary count: ${finalCount?.length || 'unknown'}`)
    }
    
  } catch (error) {
    console.error('💥 Main process error:', error)
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { main, extractWordsFromText, isValidWord, getWordPriority }