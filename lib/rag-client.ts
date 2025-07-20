// 前端 RAG 客户端 - 通过 API 调用后端 RAG 功能
// 避免在前端直接引用 Pinecone SDK

export interface RAGResponse {
  answer: string
  sources: any[]
  confidence: number
}

export async function askQuestionClient(
  userId: string,
  question: string,
  questionId?: string
): Promise<RAGResponse> {
  try {
    const response = await fetch('/api/rag/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        question,
        questionId,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error asking question via RAG API:', error)
    throw error
  }
} 