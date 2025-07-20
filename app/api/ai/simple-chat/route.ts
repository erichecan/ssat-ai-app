import { NextRequest, NextResponse } from 'next/server'

// 简化的AI助手实现，避免复杂的RAG系统和向量数据库
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // 简单的关键词匹配回复系统
    const response = generateSimpleResponse(message)
    
    return NextResponse.json({
      answer: response,
      sources: [],
      confidence: 0.8
    })
  } catch (error) {
    console.error('Error in simple AI chat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateSimpleResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  // SSAT词汇相关
  if (lowerMessage.includes('vocabulary') || lowerMessage.includes('word') || lowerMessage.includes('meaning')) {
    return `对于SSAT词汇学习，我建议你：
1. 每天学习15-20个新单词
2. 使用词根词缀记忆法
3. 通过阅读文章理解词汇在语境中的用法
4. 定期复习之前学过的单词

你想了解某个特定单词的含义吗？`
  }
  
  // SSAT数学相关
  if (lowerMessage.includes('math') || lowerMessage.includes('数学') || lowerMessage.includes('algebra') || lowerMessage.includes('geometry')) {
    return `SSAT数学主要包含以下内容：
1. 代数 - 方程式、不等式、函数
2. 几何 - 面积、周长、角度、相似三角形
3. 数据分析 - 统计、概率、图表解读
4. 算术 - 分数、小数、百分比

你需要在哪个数学领域得到更多帮助？`
  }
  
  // SSAT阅读相关
  if (lowerMessage.includes('reading') || lowerMessage.includes('阅读') || lowerMessage.includes('comprehension')) {
    return `提高SSAT阅读理解的策略：
1. 先快速浏览文章结构
2. 注意主题句和关键词
3. 理解作者的观点和语气
4. 练习不同类型的文章（小说、议论文、科普文等）

你在阅读理解的哪个方面需要更多指导？`
  }
  
  // 学习策略相关
  if (lowerMessage.includes('study') || lowerMessage.includes('学习') || lowerMessage.includes('prepare') || lowerMessage.includes('tips')) {
    return `SSAT备考建议：
1. 制定每日学习计划，保持规律
2. 做真题练习，熟悉考试格式
3. 记录错题，分析错误原因
4. 保持良好的心态，适度休息

你想了解具体哪个方面的学习策略？`
  }
  
  // 考试技巧相关
  if (lowerMessage.includes('test') || lowerMessage.includes('exam') || lowerMessage.includes('strategy') || lowerMessage.includes('技巧')) {
    return `SSAT考试技巧：
1. 时间管理很重要，不要在难题上花太多时间
2. 如果不确定答案，可以合理猜测（没有倒扣分）
3. 仔细读题，注意关键词
4. 保持冷静，相信自己的准备

你需要哪个科目的具体应试技巧？`
  }
  
  // 默认回复
  return `你好！我是你的SSAT学习助手。我可以帮助你：

📚 词汇学习 - 单词记忆、词根词缀
🔢 数学练习 - 代数、几何、数据分析
📖 阅读理解 - 理解策略、文章分析
📝 学习规划 - 制定学习计划、备考建议
🎯 考试技巧 - 应试策略、时间管理

请告诉我你需要在哪个方面得到帮助，我会为你提供针对性的指导！`
}