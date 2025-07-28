import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt_type = Math.random() > 0.5 ? 'Persuasive' : 'Narrative',
      difficulty = 'medium' 
    } = await request.json();

    // Generate writing prompt using Gemini AI
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create a ${prompt_type.toLowerCase()} writing prompt suitable for SSAT practice.

Requirements:
- Type: ${prompt_type} essay
- Difficulty: ${difficulty}
- Age-appropriate for middle/high school students (grades 6-12)
- Should inspire thoughtful, well-structured responses
- Include clear instructions for what students should do

${prompt_type === 'Persuasive' ? `
For Persuasive prompts:
- Present a debatable issue with clear sides
- Ask students to take a position and defend it
- Encourage use of examples and reasoning
- Topics should be relevant to student experiences
- Avoid overly controversial or sensitive topics
` : `
For Narrative prompts:
- Ask for a personal story or experience
- Should inspire creative, descriptive writing
- Include a clear situation or theme
- Encourage showing rather than telling
- Allow for personal reflection and growth
`}

Return a JSON object with this exact structure:
{
  "prompt_text": "The complete writing prompt with clear instructions (50-100 words)",
  "prompt_type": "${prompt_type}",
  "difficulty": "${difficulty}"
}

Make the prompt engaging and suitable for a 25-minute timed writing exercise.`
          }]
        }]
      })
    });

    if (!geminiResponse.ok) {
      throw new Error('Failed to generate prompt with Gemini');
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates[0].content.parts[0].text;
    
    // Parse the JSON response from Gemini
    let promptData;
    try {
      // Clean the response to extract JSON
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        promptData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Fallback prompt generation based on type
      if (prompt_type === 'Persuasive') {
        promptData = {
          prompt_text: "Some people believe that students should be allowed to use smartphones during class for educational purposes, while others think they should be completely banned. What is your position on this issue? Use specific reasons and examples to support your argument.",
          prompt_type: prompt_type,
          difficulty: difficulty
        };
      } else {
        promptData = {
          prompt_text: "Write about a time when you had to overcome a challenge or obstacle that seemed impossible at first. Describe the situation, what you did to overcome it, and what you learned from the experience. Use specific details to help your reader understand your story.",
          prompt_type: prompt_type,
          difficulty: difficulty
        };
      }
    }

    // Save the generated prompt to test_questions table (reusing existing structure)
    const { data: savedPrompt, error: saveError } = await supabase
      .from('test_questions')
      .insert({
        type: 'vocabulary', // Using existing type category
        subject: 'Writing Prompts',
        difficulty_level: promptData.difficulty === 'easy' ? 1 : promptData.difficulty === 'medium' ? 2 : 3,
        question_text: promptData.prompt_text,
        question_type: 'essay',
        correct_answer: `This is a ${promptData.prompt_type.toLowerCase()} essay prompt.`,
        explanation: `This prompt tests ${promptData.prompt_type.toLowerCase()} writing skills.`,
        time_limit_seconds: 1500, // 25 minutes
        points: 25
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving prompt:', saveError);
      // Still return the generated prompt even if save fails
    }

    // Return the generated prompt (use saved version if available)
    return NextResponse.json({
      prompt: savedPrompt || { 
        id: 'temp-' + Date.now(),
        ...promptData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}