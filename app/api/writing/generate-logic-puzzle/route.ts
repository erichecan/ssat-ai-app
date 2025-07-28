import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { difficulty = 'medium' } = await request.json();

    // Define SSAT-appropriate thesis topics
    const thesisTopics = [
      'Students should have more say in their school curriculum',
      'Schools should require community service for graduation',
      'Technology improves classroom learning',
      'Homework should be limited on weekends',
      'Schools should start later in the day',
      'Students should learn coding as a basic skill',
      'Art and music education are essential for all students',
      'School uniforms benefit the learning environment',
      'Students should have access to mental health support at school',
      'Environmental education should be mandatory'
    ];

    const selectedThesis = thesisTopics[Math.floor(Math.random() * thesisTopics.length)];

    // Generate logic puzzle using Gemini AI
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create a logic puzzle for SSAT writing practice where students arrange argument pieces in logical order.

Main Thesis: "${selectedThesis}"
Difficulty: ${difficulty}

Create 4-6 supporting argument pieces that build a logical case for this thesis. Each piece should be a complete sentence that supports the main argument.

Requirements:
- ${difficulty === 'easy' ? '4 argument pieces' : difficulty === 'medium' ? '5 argument pieces' : '6 argument pieces'}
- Arguments should flow logically from general to specific
- Include evidence, reasoning, and conclusion elements
- Suitable for middle/high school students
- Clear logical progression

Return a JSON object with this exact structure:
{
  "main_thesis": "${selectedThesis}",
  "elements": {
    "shuffled": [
      {"id": "1", "text": "First argument piece", "order": 1},
      {"id": "2", "text": "Second argument piece", "order": 2},
      {"id": "3", "text": "Third argument piece", "order": 3},
      {"id": "4", "text": "Fourth argument piece", "order": 4}
    ],
    "correct_order": [1, 2, 3, 4]
  },
  "difficulty": "${difficulty}"
}

Make sure the correct_order array matches the logical sequence of the argument pieces.`
          }]
        }]
      })
    });

    if (!geminiResponse.ok) {
      throw new Error('Failed to generate logic puzzle with Gemini');
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates[0].content.parts[0].text;
    
    // Parse the JSON response from Gemini
    let puzzleData;
    try {
      // Clean the response to extract JSON
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        puzzleData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Fallback puzzle generation
      puzzleData = {
        main_thesis: selectedThesis,
        elements: {
          shuffled: [
            { id: "1", text: `${selectedThesis.split(' ').slice(0, 3).join(' ')} is important for student development`, order: 1 },
            { id: "2", text: "Research shows positive outcomes when students are more engaged in their education", order: 2 },
            { id: "3", text: "This leads to better academic performance and personal growth", order: 3 },
            { id: "4", text: `Therefore, ${selectedThesis.toLowerCase()} benefits everyone involved`, order: 4 }
          ],
          correct_order: [1, 2, 3, 4]
        },
        difficulty: difficulty
      };
    }

    // Save the generated puzzle to database
    const { data: savedPuzzle, error: saveError } = await supabase
      .from('logic_puzzles')
      .insert({
        main_thesis: puzzleData.main_thesis,
        elements: puzzleData.elements,
        difficulty: puzzleData.difficulty
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving logic puzzle:', saveError);
      // Still return the generated puzzle even if save fails
    }

    // Return the generated puzzle (use saved version if available)
    return NextResponse.json({
      puzzle: savedPuzzle || { 
        id: 'temp-' + Date.now(),
        ...puzzleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating logic puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to generate logic puzzle' },
      { status: 500 }
    );
  }
}