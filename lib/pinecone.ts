import { Pinecone } from '@pinecone-database/pinecone'

const apiKey = process.env.PINECONE_API_KEY
const environment = process.env.PINECONE_ENVIRONMENT
const indexName = process.env.PINECONE_INDEX_NAME || 'ssat-knowledge-base'

if (!apiKey) {
  throw new Error('PINECONE_API_KEY is not set')
}

if (!environment) {
  throw new Error('PINECONE_ENVIRONMENT is not set')
}

const pinecone = new Pinecone({
  apiKey: apiKey,
})

export const pineconeIndex = pinecone.index(indexName)

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

export async function upsertKnowledge(records: KnowledgeRecord[]) {
  try {
    await pineconeIndex.upsert(records)
  } catch (error) {
    console.error('Error upserting to Pinecone:', error)
    throw error
  }
}

export async function searchSimilarKnowledge(
  queryVector: number[],
  topK: number = 5,
  filter?: Record<string, any>
) {
  try {
    const queryOptions: any = {
      vector: queryVector,
      topK,
      includeMetadata: true,
    }
    
    // Only add filter if it's provided and not empty
    if (filter && Object.keys(filter).length > 0) {
      queryOptions.filter = filter
    }
    
    const searchResponse = await pineconeIndex.query(queryOptions)

    return searchResponse.matches || []
  } catch (error) {
    console.error('Error searching Pinecone:', error)
    throw error
  }
}

export async function deleteKnowledge(ids: string[]) {
  try {
    await pineconeIndex.deleteMany(ids)
  } catch (error) {
    console.error('Error deleting from Pinecone:', error)
    throw error
  }
}

export async function getIndexStats() {
  try {
    const stats = await pineconeIndex.describeIndexStats()
    return stats
  } catch (error) {
    console.error('Error getting index stats:', error)
    throw error
  }
}