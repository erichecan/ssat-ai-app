import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GOOGLE_GEMINI_API_KEY
const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro'

console.log('Optimized Gemini config:', { 
  hasApiKey: !!apiKey, 
  model: model,
  apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'missing'
})

if (!apiKey) {
  throw new Error('GOOGLE_GEMINI_API_KEY is not set')
}

const genAI = new GoogleGenerativeAI(apiKey)

// 优化配置
const optimizedModel = genAI.getGenerativeModel({ 
  model,
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192, // 限制输出长度，减少处理时间
  },
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT" as any,
      threshold: "BLOCK_MEDIUM_AND_ABOVE" as any
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH" as any, 
      threshold: "BLOCK_MEDIUM_AND_ABOVE" as any
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any,
      threshold: "BLOCK_MEDIUM_AND_ABOVE" as any
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any,
      threshold: "BLOCK_MEDIUM_AND_ABOVE" as any
    }
  ]
})

// 重试机制配置
interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  backoffMultiplier: 2
}

// 智能超时配置
interface TimeoutConfig {
  initialTimeout: number
  retryTimeout: number
  maxTimeout: number
}

const defaultTimeoutConfig: TimeoutConfig = {
  initialTimeout: 15000, // 15秒初始超时
  retryTimeout: 20000,   // 20秒重试超时
  maxTimeout: 30000      // 30秒最大超时
}

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 指数退避重试
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1)
  return Math.min(delay, config.maxDelay)
}

// 优化的文本生成函数
export async function generateTextOptimized(
  prompt: string, 
  timeout: number = 15000,
  retryConfig: Partial<RetryConfig> = {},
  timeoutConfig: Partial<TimeoutConfig> = {}
): Promise<string> {
  const finalRetryConfig = { ...defaultRetryConfig, ...retryConfig }
  const finalTimeoutConfig = { ...defaultTimeoutConfig, ...timeoutConfig }
  
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= finalRetryConfig.maxRetries; attempt++) {
    try {
      console.log(`AI generation attempt ${attempt}/${finalRetryConfig.maxRetries}`)
      console.log(`Prompt length: ${prompt.length}, Timeout: ${timeout}ms`)
      
      // 动态调整超时时间
      const currentTimeout = attempt === 1 ? 
        finalTimeoutConfig.initialTimeout : 
        Math.min(timeout + (attempt - 1) * 2000, finalTimeoutConfig.maxTimeout)
      
      // 创建超时Promise
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`AI request timeout after ${currentTimeout}ms (attempt ${attempt})`)), currentTimeout)
      )
      
      // 创建生成Promise
      const generatePromise = optimizedModel.generateContent(prompt).then(result => {
        console.log(`Gemini API call completed successfully (attempt ${attempt})`)
        const text = result.response.text()
        console.log(`Response text extracted, length: ${text.length}`)
        return text
      }).catch(geminiError => {
        console.error(`Gemini API call failed (attempt ${attempt}):`, {
          name: geminiError.name,
          message: geminiError.message,
          status: geminiError.status,
          statusText: geminiError.statusText,
          details: geminiError.details
        })
        throw geminiError
      })
      
      // 竞争超时
      const response = await Promise.race([generatePromise, timeoutPromise])
      
      console.log(`AI response generated successfully (attempt ${attempt}), final length: ${response.length}`)
      return response
      
    } catch (error: any) {
      lastError = error
      console.error(`Error in generateTextOptimized (attempt ${attempt}):`, {
        name: error.name,
        message: error.message,
        isTimeout: error.message?.includes('timeout'),
        attempt
      })
      
      // 如果是最后一次尝试，抛出错误
      if (attempt === finalRetryConfig.maxRetries) {
        throw error
      }
      
      // 计算退避延迟
      const backoffDelay = calculateBackoffDelay(attempt, finalRetryConfig)
      console.log(`Retrying in ${backoffDelay}ms...`)
      await delay(backoffDelay)
    }
  }
  
  throw lastError || new Error('All retry attempts failed')
}

// 快速生成函数（用于简单查询）
export async function generateTextFast(
  prompt: string, 
  timeout: number = 8000
): Promise<string> {
  return generateTextOptimized(prompt, timeout, {
    maxRetries: 1,
    baseDelay: 500
  }, {
    initialTimeout: 8000,
    retryTimeout: 10000,
    maxTimeout: 12000
  })
}

// 标准生成函数（保持向后兼容）
export async function generateText(prompt: string, timeout: number = 15000): Promise<string> {
  return generateTextOptimized(prompt, timeout)
}

// 批量生成函数（用于多个请求）
export async function generateTextBatch(
  prompts: string[], 
  timeout: number = 15000,
  concurrency: number = 3
): Promise<string[]> {
  const results: string[] = []
  const errors: Error[] = []
  
  // 分批处理，避免同时发送太多请求
  for (let i = 0; i < prompts.length; i += concurrency) {
    const batch = prompts.slice(i, i + concurrency)
    const batchPromises = batch.map(async (prompt, index) => {
      try {
        return await generateTextOptimized(prompt, timeout, {
          maxRetries: 2,
          baseDelay: 1000
        })
      } catch (error) {
        console.error(`Batch generation failed for prompt ${i + index}:`, error)
        errors.push(error as Error)
        return null
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults.filter(Boolean) as string[])
    
    // 批次间延迟
    if (i + concurrency < prompts.length) {
      await delay(1000)
    }
  }
  
  if (errors.length > 0) {
    console.warn(`${errors.length} prompts failed in batch generation`)
  }
  
  return results
}

// 优化的RAG响应生成
export async function generateRAGResponseOptimized(
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

  return generateTextOptimized(prompt, 12000, {
    maxRetries: 2,
    baseDelay: 1000
  })
}

// 导出原始模型（用于其他用途）
export const geminiModel = optimizedModel

// 导出嵌入生成函数
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