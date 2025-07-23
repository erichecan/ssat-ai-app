// AI Grammar Questions Generation API - 2024-12-19 16:00:00
// Dynamically generate SSAT grammar practice questions

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { ruleId, ruleTitle, ruleDescription, examples, questionType, count = 2 } = await request.json();

    // Validate required parameters
    if (!ruleId || !ruleTitle || !ruleDescription) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Build AI prompt
    const prompt = `
You are a professional SSAT grammar teaching expert. Please generate ${count} high-quality practice questions based on the following grammar rule.

Grammar Rule Information:
- Rule ID: ${ruleId}
- Rule Title: ${ruleTitle}
- Rule Description: ${ruleDescription}
- Examples: ${examples?.map((ex: any) => ex.sentence).join('; ') || 'None'}

Requirements:
1. Generate ${count} questions, with ${Math.ceil(count/2)} multiple-choice questions and ${Math.floor(count/2)} fill-in-the-blank questions
2. Question difficulty should be appropriate for SSAT exam level
3. Each question must have a clear correct answer and detailed explanation
4. Multiple-choice questions should provide 4 options with only 1 correct answer
5. Fill-in-the-blank questions should provide 2 options to choose from

Please return in JSON format as follows:
{
  "questions": [
    {
      "id": "unique-id-1",
      "ruleId": "${ruleId}",
      "type": "multiple-choice",
      "question": "Question content",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Correct answer",
      "explanation": "Detailed explanation"
    },
    {
      "id": "unique-id-2", 
      "ruleId": "${ruleId}",
      "type": "fill-in-the-blank",
      "question": "Question content ___ (option1/option2)",
      "options": ["option1", "option2"],
      "answer": "Correct answer",
      "explanation": "Detailed explanation"
    }
  ]
}

Return only JSON format, no other content.
`;

    // Call Gemini AI to generate questions
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response JSON
    let aiResponse;
    try {
      // Extract JSON part
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

    // Validate AI response data structure
    if (!aiResponse.questions || !Array.isArray(aiResponse.questions)) {
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    // Generate unique ID for each question
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