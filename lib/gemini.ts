import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GOOGLE_GEMINI_API_KEY
const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro'

if (!apiKey) {
  throw new Error('GOOGLE_GEMINI_API_KEY is not set')
}

const genAI = new GoogleGenerativeAI(apiKey)

export const geminiModel = genAI.getGenerativeModel({ model })

export async function generateText(prompt: string): Promise<string> {
  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error generating text with Gemini:', error)
    throw error
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    const result = await embeddingModel.embedContent(text)
    return result.embedding.values
  } catch (error) {
    console.error('Error generating embedding with Gemini:', error)
    throw error
  }
}

export async function generateRAGResponse(
  query: string,
  context: string,
  userHistory?: string
): Promise<string> {
  const prompt = `
You are an AI tutor specializing in SSAT and SAT preparation. 
Based on the following context and user query, provide a helpful, accurate, and personalized response.

Context: ${context}

${userHistory ? `User Learning History: ${userHistory}` : ''}

User Query: ${query}

Instructions:
1. Answer in a clear, educational manner
2. Focus on helping the student understand the concept
3. Provide step-by-step explanations when applicable
4. Use examples relevant to SSAT/SAT
5. Keep the response concise but comprehensive
6. If the query is about a specific question, explain both why the correct answer is right and why other options are wrong

Response:
  `

  return generateText(prompt)
}