import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'
import { searchSimilarKnowledgeLocal } from '@/lib/local-vector-store'
import { supabase } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { difficulty = 'medium', userId, useUserContent = true } = await request.json()
    
    console.log('Generating reading material:', { difficulty, userId, useUserContent })
    
    let readingMaterial = null
    
    // 如果用户上传了内容，优先使用用户内容生成阅读材料
    if (useUserContent && userId) {
      try {
        console.log('Attempting to use user uploaded content...')
        readingMaterial = await generateFromUserContent(userId, difficulty)
      } catch (error) {
        console.log('Failed to use user content, falling back to AI generation:', error)
      }
    }
    
    // 如果没有用户内容或生成失败，使用AI生成全新内容
    if (!readingMaterial) {
      console.log('Generating new reading material with AI...')
      readingMaterial = await generateNewReadingMaterial(difficulty)
    }
    
    return NextResponse.json({
      success: true,
      material: readingMaterial
    })
    
  } catch (error) {
    console.error('Error generating reading material:', error)
    return NextResponse.json(
      { error: 'Failed to generate reading material' },
      { status: 500 }
    )
  }
}

async function generateFromUserContent(userId: string, difficulty: string): Promise<any> {
  // 从用户知识库搜索相关内容
  const searchQuery = getSearchQueryByDifficulty(difficulty)
  const queryEmbedding = await generateEmbedding(searchQuery)
  
  // 搜索用户上传的内容
  const { data: userKnowledge } = await supabase
    .from('knowledge_base')
    .select('*')
    .contains('tags', [userId])
    .limit(5)
  
  if (!userKnowledge || userKnowledge.length === 0) {
    throw new Error('No user content found')
  }
  
  // 随机选择一个或组合多个内容片段
  const selectedContent = userKnowledge
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(3, userKnowledge.length))
    .map(k => k.content)
    .join('\n\n')
  
  // 使用AI重新组织和优化内容作为阅读材料
  const prompt = `Based on the following content, create a ${difficulty} level reading passage for SSAT reading speed practice. 

Content to use:
${selectedContent}

Requirements:
- Create a ${getDifficultyWordCount(difficulty)}-word passage
- ${difficulty === 'easy' ? 'Use simple vocabulary and sentence structure' : 
    difficulty === 'medium' ? 'Use moderate vocabulary with varied sentence structure' : 
    'Use advanced vocabulary, complex sentence structure, and sophisticated concepts'}
- Make it engaging and educational
- Ensure it flows naturally and is appropriate for SSAT students
- Focus on a clear theme or main idea
- The passage should be suitable for reading speed measurement

Return only the reading passage, no additional formatting or explanations.`

  const generatedPassage = await generateText(prompt, 20000)
  
  return {
    title: extractTitle(generatedPassage) || `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Reading Practice`,
    content: generatedPassage.trim(),
    difficulty,
    wordCount: countWords(generatedPassage),
    estimatedReadingTime: Math.ceil(countWords(generatedPassage) / getAverageWPM(difficulty)),
    source: 'user_content_ai_generated',
    topics: extractTopics(selectedContent)
  }
}

async function generateNewReadingMaterial(difficulty: string): Promise<any> {
  const topics = [
    'Scientific Discovery', 'Historical Events', 'Literature Analysis', 'Environmental Science',
    'Technology Innovation', 'Psychology Research', 'Art and Culture', 'Economic Theory',
    'Philosophy', 'Space Exploration', 'Marine Biology', 'Architecture', 'Music Theory',
    'Anthropology', 'Neuroscience', 'Climate Science', 'Political Science', 'Linguistics'
  ]
  
  const randomTopic = topics[Math.floor(Math.random() * topics.length)]
  const wordCount = getDifficultyWordCount(difficulty)
  
  const prompt = `Create a ${difficulty} level reading passage about "${randomTopic}" for SSAT reading speed practice.

Requirements:
- Exactly ${wordCount} words
- ${difficulty === 'easy' ? 
    'Simple vocabulary (6th-8th grade level), short sentences, clear structure' : 
    difficulty === 'medium' ? 
    'Moderate vocabulary (9th-10th grade level), varied sentence length, some complex ideas' : 
    'Advanced vocabulary (11th-12th grade level), complex sentences, sophisticated analysis, abstract concepts'}
- Engaging and informative content suitable for teenagers
- Clear introduction, body, and conclusion structure
- Include specific examples and details
- Make it factually accurate and educational
- Appropriate for measuring reading speed and comprehension

Topic: ${randomTopic}

Return only the reading passage with a title, no additional formatting or explanations.`

  const generatedPassage = await generateText(prompt, 25000)
  const lines = generatedPassage.trim().split('\n')
  const title = lines[0].replace(/^(Title:|#\s*)/, '').trim() || `${randomTopic}: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Reading`
  const content = lines.slice(1).join('\n').trim()
  
  return {
    title,
    content,
    difficulty,
    wordCount: countWords(content),
    estimatedReadingTime: Math.ceil(countWords(content) / getAverageWPM(difficulty)),
    source: 'ai_generated',
    topic: randomTopic
  }
}

function getSearchQueryByDifficulty(difficulty: string): string {
  const queries = {
    easy: 'basic concepts simple explanation',
    medium: 'intermediate analysis detailed information',
    hard: 'advanced theory complex analysis research'
  }
  return queries[difficulty as keyof typeof queries] || queries.medium
}

function getDifficultyWordCount(difficulty: string): number {
  const counts = {
    easy: 200,    // 适合初学者，约1分钟阅读
    medium: 350,  // 中等难度，约1.5-2分钟阅读
    hard: 500     // 高难度，约2.5-3分钟阅读
  }
  return counts[difficulty as keyof typeof counts] || counts.medium
}

function getAverageWPM(difficulty: string): number {
  const wpm = {
    easy: 250,    // 较慢的阅读速度
    medium: 200,  // 中等阅读速度
    hard: 150     // 复杂内容的阅读速度
  }
  return wpm[difficulty as keyof typeof wpm] || wpm.medium
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

function extractTitle(passage: string): string | null {
  const lines = passage.split('\n')
  const firstLine = lines[0].trim()
  
  // 检查是否像标题（短于80个字符，不以句号结尾）
  if (firstLine.length > 0 && firstLine.length < 80 && !firstLine.endsWith('.')) {
    return firstLine.replace(/^(Title:|#\s*)/, '').trim()
  }
  
  return null
}

function extractTopics(content: string): string[] {
  // 简单的主题提取逻辑
  const commonTopics = [
    'science', 'technology', 'history', 'literature', 'environment',
    'education', 'research', 'analysis', 'theory', 'development'
  ]
  
  const lowerContent = content.toLowerCase()
  return commonTopics.filter(topic => lowerContent.includes(topic))
}