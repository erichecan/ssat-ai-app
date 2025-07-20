// 临时本地向量存储替代方案
// 如果Pinecone配置有问题，可以使用这个本地存储

import { supabase } from './supabase'
import { generateEmbedding } from './gemini'

interface LocalVectorRecord {
  id: string
  embedding: number[]
  metadata: {
    content: string
    topic: string
    difficulty: string
    type: string
    tags: string[]
  }
}

class LocalVectorStore {
  private vectors: LocalVectorRecord[] = []
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      // 从Supabase加载知识库数据
      const { data: knowledgeBase } = await supabase
        .from('knowledge_base')
        .select('*')

      if (knowledgeBase) {
        for (const entry of knowledgeBase) {
          // 为每个条目生成向量
          const embedding = await generateEmbedding(entry.content)
          
          this.vectors.push({
            id: entry.id,
            embedding,
            metadata: {
              content: entry.content,
              topic: entry.topic,
              difficulty: entry.difficulty,
              type: entry.type,
              tags: entry.tags
            }
          })
        }
      }

      this.initialized = true
      console.log(`Local vector store initialized with ${this.vectors.length} vectors`)
    } catch (error) {
      console.error('Error initializing local vector store:', error)
    }
  }

  // 计算余弦相似度
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
    return dotProduct / (magnitudeA * magnitudeB)
  }

  async searchSimilar(
    queryEmbedding: number[],
    topK: number = 5
  ): Promise<Array<{ id: string; score: number; metadata: any }>> {
    if (!this.initialized) {
      await this.initialize()
    }

    const results = this.vectors
      .map(vector => ({
        id: vector.id,
        score: this.cosineSimilarity(queryEmbedding, vector.embedding),
        metadata: vector.metadata
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    return results
  }

  async upsert(records: LocalVectorRecord[]) {
    if (!this.initialized) {
      await this.initialize()
    }

    records.forEach(record => {
      const existingIndex = this.vectors.findIndex(v => v.id === record.id)
      if (existingIndex >= 0) {
        this.vectors[existingIndex] = record
      } else {
        this.vectors.push(record)
      }
    })
  }
}

export const localVectorStore = new LocalVectorStore()

// 用于替代Pinecone的函数
export async function searchSimilarKnowledgeLocal(
  queryVector: number[],
  topK: number = 5
) {
  return await localVectorStore.searchSimilar(queryVector, topK)
}

export async function upsertKnowledgeLocal(
  records: Array<{
    id: string
    values: number[]
    metadata: any
  }>
) {
  const localRecords = records.map(record => ({
    id: record.id,
    embedding: record.values,
    metadata: record.metadata
  }))
  
  await localVectorStore.upsert(localRecords)
}