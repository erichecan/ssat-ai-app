import { NextRequest, NextResponse } from 'next/server'
import { generateTextOptimized } from '@/lib/gemini-optimized'

// 真正的AI助手实现，使用Gemini AI
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // 使用真正的AI生成回复
    console.log('User message:', message)
    
    try {
      const prompt = `You are an expert SSAT/SAT tutor helping a student. 

Student's question: "${message}"

Provide a helpful, educational response that:
1. Directly addresses their question
2. Uses simple, clear language
3. Gives practical study tips when relevant
4. Is encouraging and supportive
5. Keeps responses concise but informative (2-3 paragraphs max)

If they ask about specific subjects:
- Vocabulary: Focus on memorization techniques, word roots, context clues
- Math: Explain concepts step-by-step, provide examples
- Reading: Discuss comprehension strategies, passage analysis
- Writing: Cover grammar rules, essay structure, style

Respond in a friendly, tutor-like tone.`

      console.log('Calling generateText with prompt length:', prompt.length)
      const response = await generateTextOptimized(prompt, 15000, {
      maxRetries: 2,
      baseDelay: 1000
    })
      console.log('AI response received, length:', response.length)
      
      return NextResponse.json({
        answer: response.trim(),
        sources: [],
        confidence: 0.9,
        isAI: true
      })
    } catch (aiError: any) {
      console.error('AI generation failed with detailed error:', {
        name: aiError.name,
        message: aiError.message,
        stack: aiError.stack,
        cause: aiError.cause
      })
      
      // 如果AI失败，使用智能备用回复
      const fallbackResponse = generateContextualFallback(message)
      console.log('Using fallback response, length:', fallbackResponse.length)
      
      return NextResponse.json({
        answer: fallbackResponse,
        sources: [],
        confidence: 0.6,
        isFallback: true,
        error: aiError.message // 添加错误信息用于调试
      })
    }
  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 智能备用回复函数（当AI不可用时）
function generateContextualFallback(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  // 根据消息内容生成更智能的回复
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('你好')) {
    return `你好！我是你的SSAT学习助手。虽然现在AI服务暂时不可用，但我仍然可以为你提供基本的学习指导。你可以问我关于词汇、数学、阅读理解或考试策略的问题。`
  }
  
  if (lowerMessage.includes('vocabulary') || lowerMessage.includes('word') || lowerMessage.includes('单词')) {
    return `词汇学习建议：
1. 每天学习15-20个新单词
2. 使用词根词缀记忆法
3. 在上下文中理解词汇含义
4. 定期复习巩固记忆

你有具体的词汇问题吗？`
  }
  
  if (lowerMessage.includes('math') || lowerMessage.includes('数学') || lowerMessage.includes('algebra') || 
      lowerMessage.includes('勾股定理') || lowerMessage.includes('几何') || lowerMessage.includes('triangle')) {
    
    // 针对具体数学概念给出详细解答
    if (lowerMessage.includes('勾股定理') || lowerMessage.includes('pythagorean')) {
      return `勾股定理（Pythagorean Theorem）是SSAT数学的重要考点：

**定理内容**：在直角三角形中，两直角边的平方和等于斜边的平方
**公式**：a² + b² = c²（其中c是斜边）

**SSAT考试中的应用**：
1. 求直角三角形的边长
2. 判断三角形是否为直角三角形
3. 计算平面图形中的距离

**解题技巧**：
- 确认是直角三角形
- 明确哪条边是斜边（最长边）
- 代入公式计算

你想练习一些勾股定理的题目吗？`
    }
    
    return `SSAT数学备考策略：
1. 掌握基础概念（代数、几何、数据分析）
2. 多做练习题，熟悉题型
3. 学会时间管理
4. 记录错题并分析原因

你提到了"${message}"，需要这个具体概念的帮助吗？`
  }
  
  if (lowerMessage.includes('reading') || lowerMessage.includes('阅读')) {
    return `阅读理解提升方法：
1. 快速浏览找主旨
2. 注意作者观点和语气
3. 理解文章结构
4. 练习不同文体的文章

你在阅读的哪个方面需要帮助？`
  }
  
  // 默认智能回复 - 针对用户具体问题
  return `关于"${message.length > 30 ? message.substring(0, 30) + '...' : message}"，我来为你提供SSAT学习指导：

我可以帮助你：
📚 **词汇学习** - 单词记忆、词根词缀、语境理解
🔢 **数学概念** - 代数、几何、勾股定理、方程式解法
📖 **阅读技巧** - 文章分析、主旨理解、推理题解答
🎯 **考试策略** - 时间管理、答题技巧、心态调整

请具体告诉我你在哪个方面需要帮助，我会提供详细的学习建议和解题方法！

比如你可以问：
• "如何记忆SSAT词汇？"
• "勾股定理怎么应用？" 
• "阅读理解怎么找主旨？"`
}