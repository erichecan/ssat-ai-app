import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'

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

      const response = await generateText(prompt, 10000) // 10秒超时
      
      return NextResponse.json({
        answer: response.trim(),
        sources: [],
        confidence: 0.9,
        isAI: true
      })
    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError)
      // 如果AI失败，使用智能备用回复
      const fallbackResponse = generateContextualFallback(message)
      
      return NextResponse.json({
        answer: fallbackResponse,
        sources: [],
        confidence: 0.6,
        isFallback: true
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
  
  if (lowerMessage.includes('math') || lowerMessage.includes('数学') || lowerMessage.includes('algebra')) {
    return `SSAT数学备考策略：
1. 掌握基础概念（代数、几何、数据分析）
2. 多做练习题，熟悉题型
3. 学会时间管理
4. 记录错题并分析原因

需要具体数学概念的帮助吗？`
  }
  
  if (lowerMessage.includes('reading') || lowerMessage.includes('阅读')) {
    return `阅读理解提升方法：
1. 快速浏览找主旨
2. 注意作者观点和语气
3. 理解文章结构
4. 练习不同文体的文章

你在阅读的哪个方面需要帮助？`
  }
  
  // 默认智能回复
  return `我收到了你的消息："${message.length > 50 ? message.substring(0, 50) + '...' : message}"

虽然AI服务暂时不可用，但我仍然可以帮助你：
📚 词汇学习策略
🔢 数学解题技巧  
📖 阅读理解方法
🎯 考试应试技巧

请告诉我你需要哪方面的帮助！`
}