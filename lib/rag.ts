import { generateEmbedding, generateRAGResponse } from './gemini'
// 移除对pinecone.ts的直接导入，避免在前端打包Pinecone SDK
// import { searchSimilarKnowledge, KnowledgeRecord } from './pinecone'
import { searchSimilarKnowledgeClient, upsertKnowledgeClient } from './pinecone-client'
import { searchSimilarKnowledgeLocal } from './local-vector-store'
import { supabase } from './supabase'
import { Database } from '@/types/database'

type KnowledgeBase = Database['public']['Tables']['knowledge_base']['Row']
type UserAnswer = Database['public']['Tables']['user_answers']['Row']
type MistakeQuestion = Database['public']['Tables']['mistake_questions']['Row']

// 定义KnowledgeRecord接口，避免依赖pinecone.ts
export interface KnowledgeRecord {
  id: string
  values: number[]
  metadata: {
    content: string
    topic: string
    difficulty: string
    type: string
    tags: string[]
  }
}

export interface RAGContext {
  knowledge: KnowledgeBase[]
  userHistory: {
    recentMistakes: MistakeQuestion[]
    weakAreas: string[]
    recentPerformance: {
      topic: string
      correctRate: number
    }[]
  }
}

export interface RAGResponse {
  answer: string
  sources: KnowledgeBase[]
  confidence: number
}

export class RAGSystem {
  /**
   * Ask a question to the RAG system
   */
  async askQuestion(
    userId: string,
    question: string,
    questionId?: string
  ): Promise<RAGResponse> {
    try {
      // Generate embedding for the question
      const questionEmbedding = await generateEmbedding(question)
      
      // Search for similar knowledge (try Pinecone first, fallback to local)
      let searchResults
      try {
        // 检查是否在服务器端
        if (typeof window === 'undefined') {
          // 服务器端通过动态导入避免前端打包
          const { searchSimilarKnowledge } = await import('./pinecone')
          searchResults = await searchSimilarKnowledge(
            questionEmbedding,
            5 // top 5 results
            // no filter parameter
          )
        } else {
          // 客户端通过 API 调用
          searchResults = await searchSimilarKnowledgeClient(
            questionEmbedding,
            5 // top 5 results
            // no filter parameter
          )
        }
      } catch (error) {
        console.log('Pinecone unavailable, using local vector store...')
        searchResults = await searchSimilarKnowledgeLocal(questionEmbedding, 5)
      }
      
      // Get full knowledge base entries from Supabase
      const knowledgeIds = searchResults
        .map((result: any) => result.metadata?.id)
        .filter((id: any) => id) as string[]
      
      const { data: knowledgeEntries, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .in('id', knowledgeIds)
      
      if (error) {
        console.error('Error fetching knowledge entries:', error)
        throw error
      }
      
      // Get user context
      const userContext = await this.getUserContext(userId)
      
      // Prepare context for RAG
      const context = knowledgeEntries
        ?.map(entry => `${entry.title}: ${entry.content}`)
        .join('\n\n') || ''
      
      const userHistoryString = this.formatUserHistory(userContext.userHistory)
      
      // Generate response using Gemini
      const response = await generateRAGResponse(
        question,
        context,
        userHistoryString
      )
      
      // Calculate confidence based on search results
      const confidence = this.calculateConfidence(searchResults)
      
      // Save conversation to database
      await this.saveConversation(userId, question, response, {
        knowledgeIds,
        searchResults,
        confidence
      }, questionId)
      
      return {
        answer: response,
        sources: knowledgeEntries || [],
        confidence
      }
    } catch (error) {
      console.error('Error in RAG system:', error)
      throw error
    }
  }
  
  /**
   * Get user context for personalized responses
   */
  private async getUserContext(userId: string): Promise<RAGContext> {
    // Get recent mistakes
    const { data: mistakes } = await supabase
      .from('mistake_questions')
      .select(`
        *,
        questions!inner(*)
      `)
      .eq('user_id', userId)
      .order('last_mistake_at', { ascending: false })
      .limit(10)
    
    // Get recent performance by topic
    const { data: recentAnswers } = await supabase
      .from('user_answers')
      .select(`
        *,
        questions!inner(type)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    // Calculate weak areas
    const weakAreas = this.calculateWeakAreas(recentAnswers || [])
    
    // Calculate recent performance by topic
    const recentPerformance = this.calculateRecentPerformance(recentAnswers || [])
    
    return {
      knowledge: [], // Will be populated by search
      userHistory: {
        recentMistakes: mistakes || [],
        weakAreas,
        recentPerformance
      }
    }
  }
  
  /**
   * Calculate user's weak areas based on recent performance
   */
  private calculateWeakAreas(recentAnswers: any[]): string[] {
    const topicPerformance: { [key: string]: { correct: number, total: number } } = {}
    
    recentAnswers.forEach(answer => {
      const topic = answer.questions?.type || 'unknown'
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = { correct: 0, total: 0 }
      }
      topicPerformance[topic].total++
      if (answer.is_correct) {
        topicPerformance[topic].correct++
      }
    })
    
    // Find topics with < 70% success rate
    const weakAreas = Object.entries(topicPerformance)
      .filter(([_, stats]) => stats.total >= 3 && (stats.correct / stats.total) < 0.7)
      .map(([topic, _]) => topic)
    
    return weakAreas
  }
  
  /**
   * Calculate recent performance by topic
   */
  private calculateRecentPerformance(recentAnswers: any[]) {
    const topicStats: { [key: string]: { correct: number, total: number } } = {}
    
    recentAnswers.forEach(answer => {
      const topic = answer.questions?.type || 'unknown'
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 }
      }
      topicStats[topic].total++
      if (answer.is_correct) {
        topicStats[topic].correct++
      }
    })
    
    return Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      correctRate: stats.total > 0 ? stats.correct / stats.total : 0
    }))
  }
  
  /**
   * Format user history for RAG context
   */
  private formatUserHistory(userHistory: RAGContext['userHistory']): string {
    let historyString = ''
    
    if (userHistory.weakAreas.length > 0) {
      historyString += `Student's weak areas: ${userHistory.weakAreas.join(', ')}\n`
    }
    
    if (userHistory.recentPerformance.length > 0) {
      historyString += 'Recent performance:\n'
      userHistory.recentPerformance.forEach(perf => {
        historyString += `- ${perf.topic}: ${Math.round(perf.correctRate * 100)}% correct\n`
      })
    }
    
    if (userHistory.recentMistakes.length > 0) {
      historyString += `Recent mistakes: ${userHistory.recentMistakes.length} questions\n`
    }
    
    return historyString
  }
  
  /**
   * Calculate confidence based on search results
   */
  private calculateConfidence(searchResults: any[]): number {
    if (searchResults.length === 0) return 0
    
    const avgScore = searchResults.reduce((sum, result) => sum + (result.score || 0), 0) / searchResults.length
    return Math.min(avgScore, 1.0)
  }
  
  /**
   * Save conversation to database
   */
  private async saveConversation(
    userId: string,
    userMessage: string,
    aiResponse: string,
    contextData: any,
    questionId?: string
  ) {
    try {
      // Convert string userId to UUID format for database
      const userUuid = await this.ensureUserUuid(userId)
      
      const { error } = await supabase
        .from('conversations')
        .insert({
          user_id: userUuid,
          question: userMessage,
          answer: aiResponse,
          context: contextData
        })
      
      if (error) {
        console.error('Error saving conversation:', error)
      }
    } catch (error) {
      console.error('Error in saveConversation:', error)
    }
  }

  private async ensureUserUuid(userId: string): Promise<string> {
    // Check if userId is already a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (uuidRegex.test(userId)) {
      return userId
    }
    
    // Generate a consistent UUID from string userId (for demo purposes)
    // In production, you'd have proper user UUID management
    return '12345678-1234-1234-1234-' + userId.padEnd(12, '0').slice(0, 12)
  }
}

export const ragSystem = new RAGSystem()

// Helper functions for knowledge base management
export async function addKnowledgeToBase(
  title: string,
  content: string,
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  type: 'concept' | 'strategy' | 'example' | 'common_mistake',
  tags: string[] = [],
  source?: string
): Promise<string> {
  try {
    console.log('Adding knowledge to base:', { title, topic, difficulty, type, source })
    
    // 暂时跳过向量嵌入，先确保基本功能正常
    // TODO: 重新启用向量嵌入功能
    // const embedding = await generateEmbedding(content)
    
    // Insert to Supabase (without vector_embedding for now)
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        title,
        content,
        topic,
        difficulty,
        type,
        tags,
        source,
        file_name: source || 'unknown', // 添加file_name字段
        file_path: `/uploads/${source || 'unknown'}`, // 添加file_path字段
        file_size: content.length, // 添加file_size字段
        file_type: 'text/plain', // 添加file_type字段
        status: 'processed' // 添加status字段
      })
      .select()
      .single()
    
    if (error) {
      console.error('Supabase insert error:', error)
      throw error
    }
    
    console.log('Successfully inserted to Supabase:', data.id)
    
    // 暂时跳过Pinecone，先确保Supabase功能正常
    // TODO: 重新启用Pinecone功能
    /*
    // Insert to Pinecone
    const vectorRecord: KnowledgeRecord = {
      id: data.id,
      values: embedding,
      metadata: {
        content,
        topic,
        difficulty,
        type,
        tags
      }
    }
    
    // 检查是否在服务器端
    if (typeof window === 'undefined') {
      // 服务器端通过动态导入避免前端打包
      const { upsertKnowledge } = await import('./pinecone')
      await upsertKnowledge([vectorRecord])
    } else {
      // 客户端通过 API 调用
      await upsertKnowledgeClient([vectorRecord])
    }
    */
    
    return data.id
  } catch (error) {
    console.error('Error adding knowledge:', error)
    throw error
  }
}