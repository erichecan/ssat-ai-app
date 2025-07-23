// AI语法题目生成API - 2024-12-19 15:30:25
// 动态生成SSAT语法练习题

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 初始化Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { ruleId, ruleTitle, ruleDescription, examples, questionType, count = 2 } = await request.json();

    // 验证必要参数
    if (!ruleId || !ruleTitle || !ruleDescription) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 构建AI提示词
    const prompt = `
你是一个专业的SSAT语法教学专家。请根据以下语法规则生成${count}道高质量的练习题。

语法规则信息：
- 规则ID: ${ruleId}
- 规则标题: ${ruleTitle}
- 规则描述: ${ruleDescription}
- 示例: ${examples?.map((ex: any) => ex.sentence).join('; ') || '无'}

要求：
1. 生成${count}道题目，其中${Math.ceil(count/2)}道选择题，${Math.floor(count/2)}道填空题
2. 题目难度适合SSAT考试水平
3. 每道题都要有明确的正确答案和详细解释
4. 选择题提供4个选项，其中只有1个正确答案
5. 填空题提供2个选项供选择

请以JSON格式返回，格式如下：
{
  "questions": [
    {
      "id": "unique-id-1",
      "ruleId": "${ruleId}",
      "type": "multiple-choice",
      "question": "题目内容",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "answer": "正确答案",
      "explanation": "详细解释"
    },
    {
      "id": "unique-id-2", 
      "ruleId": "${ruleId}",
      "type": "fill-in-the-blank",
      "question": "题目内容 ___ (选项1/选项2)",
      "options": ["选项1", "选项2"],
      "answer": "正确答案",
      "explanation": "详细解释"
    }
  ]
}

只返回JSON格式，不要其他内容。
`;

    // 调用Gemini AI生成题目
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 解析AI返回的JSON
    let aiResponse;
    try {
      // 提取JSON部分
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      aiResponse = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('AI response text:', text);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // 验证AI返回的数据结构
    if (!aiResponse.questions || !Array.isArray(aiResponse.questions)) {
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    // 为每个题目生成唯一ID
    const questions = aiResponse.questions.map((q: any, index: number) => ({
      ...q,
      id: `${ruleId}-ai-${Date.now()}-${index}`,
      ruleId: ruleId
    }));

    return NextResponse.json({ questions });

  } catch (error) {
    console.error('Error generating grammar questions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate questions: ${errorMessage}` },
      { status: 500 }
    );
  }
} 