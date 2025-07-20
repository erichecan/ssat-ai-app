// 前端 Pinecone 客户端 - 通过 API 调用后端 Pinecone 功能
// 避免在前端直接引用 Pinecone SDK

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

export async function searchSimilarKnowledgeClient(
  queryVector: number[],
  topK: number = 5,
  filter?: Record<string, any>
) {
  try {
    const response = await fetch('/api/pinecone/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queryVector,
        topK,
        filter,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Error searching Pinecone via API:', error)
    throw error
  }
}

export async function upsertKnowledgeClient(records: KnowledgeRecord[]) {
  try {
    const response = await fetch('/api/pinecone/upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('Error upserting to Pinecone via API:', error)
    throw error
  }
} 