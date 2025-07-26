import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GOOGLE_GEMINI_API_KEY
const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro'

console.log('Gemini config:', { 
  hasApiKey: !!apiKey, 
  model: model,
  apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'missing'
})

if (!apiKey) {
  throw new Error('GOOGLE_GEMINI_API_KEY is not set')
}

const genAI = new GoogleGenerativeAI(apiKey)

export const geminiModel = genAI.getGenerativeModel({ model })

export async function generateText(prompt: string, timeout: number = 30000): Promise<string> {
  try {
    console.log('Generating text with timeout:', timeout, 'prompt length:', prompt.length)
    
    // 创建超时Promise和clearTimeout函数 - 2024-12-19 18:15:00
    let timeoutId: NodeJS.Timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('AI request timeout after ' + timeout + 'ms')), timeout)
    })
    
    // 创建生成Promise
    const generatePromise = geminiModel.generateContent(prompt).then(result => {
      console.log('Gemini API call completed successfully')
      clearTimeout(timeoutId) // 清除超时定时器
      const text = result.response.text()
      console.log('Response text extracted, length:', text.length)
      return text
    }).catch(geminiError => {
      clearTimeout(timeoutId) // 清除超时定时器
      console.error('Gemini API call failed:', {
        name: geminiError.name,
        message: geminiError.message,
        status: geminiError.status,
        statusText: geminiError.statusText,
        details: geminiError.details
      })
      throw geminiError
    })
    
    // 竞争超时
    const response = await Promise.race([generatePromise, timeoutPromise]) as string
    
    console.log('AI response generated successfully, final length:', response.length)
    return response
  } catch (error: any) {
    console.error('Error in generateText function:', {
      name: error.name,
      message: error.message,
      isTimeout: error.message?.includes('timeout'),
      stack: error.stack
    })
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