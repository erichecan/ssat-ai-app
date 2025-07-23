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

    // Build AI prompt - Enhanced for targeted grammar practice (2024-12-19 16:30:00)
    const prompt = `
You are a professional SSAT grammar teaching expert. Please generate ${count} high-quality, targeted practice questions specifically focused on the following grammar rule.

Grammar Rule Information:
- Rule ID: ${ruleId}
- Rule Title: ${ruleTitle}
- Rule Description: ${ruleDescription}
- Examples: ${examples?.map((ex: any) => ex.sentence).join('; ') || 'None'}

CRITICAL REQUIREMENTS:
1. Generate ${count} questions that are SPECIFICALLY focused on the grammar rule "${ruleTitle}"
2. Each question must directly test understanding of the concepts explained in the rule description
3. Use the provided examples as reference for question difficulty and style
4. Questions should be appropriate for SSAT exam level (middle school to high school)
5. Mix question types: ${Math.ceil(count/2)} multiple-choice and ${Math.floor(count/2)} fill-in-the-blank
6. Multiple-choice questions must have exactly 4 options with only 1 correct answer
7. Fill-in-the-blank questions must provide exactly 2 options to choose from
8. Each question must include a detailed explanation that references the specific grammar rule
9. Questions should test both recognition and application of the grammar concept
10. Avoid questions that test unrelated grammar concepts

Question Focus Guidelines:
- If the rule is about "Parts of Speech": Focus on identifying parts of speech in sentences
- If the rule is about "Nouns": Focus on noun types, singular/plural, proper/common nouns
- If the rule is about "Verbs": Focus on verb types, tense, subject-verb agreement
- If the rule is about "Pronouns": Focus on pronoun types, case, antecedent agreement
- If the rule is about "Adjectives": Focus on adjective placement, comparison, types
- If the rule is about "Adverbs": Focus on adverb placement, types, comparison
- If the rule is about "Prepositions": Focus on preposition usage, common phrases
- If the rule is about "Subject-Verb Agreement": Focus on matching subjects and verbs
- If the rule is about "Pronoun-Antecedent Agreement": Focus on pronoun-antecedent matching
- If the rule is about "Parallel Structure": Focus on maintaining parallel form
- If the rule is about "Modifier Placement": Focus on correct modifier positioning
- If the rule is about "Run-on Sentences": Focus on identifying and fixing run-ons
- If the rule is about "Sentence Fragments": Focus on identifying and completing fragments
- If the rule is about "Comma Usage": Focus on proper comma placement rules
- If the rule is about "Apostrophe Usage": Focus on possessive forms and contractions
- If the rule is about "Quotation Marks": Focus on dialogue and quotation rules
- If the rule is about "Capitalization": Focus on proper noun and title capitalization
- If the rule is about "Commonly Confused Words": Focus on distinguishing similar words
- If the rule is about "Idiomatic Expressions": Focus on correct phrase usage

Please return in JSON format as follows:
{
  "questions": [
    {
      "id": "unique-id-1",
      "ruleId": "${ruleId}",
      "type": "multiple-choice",
      "question": "Question content that specifically tests the grammar rule",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Correct answer",
      "explanation": "Detailed explanation that references the specific grammar rule and why the answer is correct"
    },
    {
      "id": "unique-id-2", 
      "ruleId": "${ruleId}",
      "type": "fill-in-the-blank",
      "question": "Question content ___ (option1/option2) that tests the grammar rule",
      "options": ["option1", "option2"],
      "answer": "Correct answer",
      "explanation": "Detailed explanation that references the specific grammar rule and why the answer is correct"
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