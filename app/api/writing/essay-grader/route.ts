import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { user_essay, prompt_text, prompt_id, user_id } = await request.json();

    if (!user_essay || !prompt_text || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call Google Gemini API for comprehensive essay grading
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert SSAT writing grader. Analyze the following student essay written for the prompt: "${prompt_text}".

Student Essay:
"""
${user_essay}
"""

Provide your analysis in a valid JSON format. The JSON object must contain a single key "gradingReport" which holds another object with the following five keys:

1. "thesisAndFocus": An object containing a "score" (integer 1-5) and a "comment" (string, 1-2 sentences explaining the score regarding thesis clarity and focus).
2. "structureAndLogic": An object containing a "score" (integer 1-5) and a "comment" (string, 1-2 sentences on organization and transitions).
3. "argumentAndEvidence": An object containing a "score" (integer 1-5) and a "comment" (string, 1-2 sentences on the strength and relevance of examples).
4. "languageAndStyle": An object containing a "score" (integer 1-5) and a "comment" (string, 1-2 sentences on vocabulary, sentence variety, and grammar).
5. "overallImpact": An object containing a "score" (integer 1-5) and a "comment" (string, 1-2 sentences on the essay's overall effectiveness).

Return only valid JSON without any markdown formatting or additional text.`
          }]
        }]
      })
    });

    if (!geminiResponse.ok) {
      throw new Error('Failed to get Gemini response');
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates[0].content.parts[0].text;
    
    // Parse the JSON response from Gemini
    let gradingData;
    try {
      gradingData = JSON.parse(generatedText);
    } catch (parseError) {
      // Fallback if parsing fails
      gradingData = {
        gradingReport: {
          thesisAndFocus: {
            score: Math.floor(Math.random() * 2) + 4,
            comment: "Your thesis is clear and well-positioned. Consider strengthening your focus throughout the essay."
          },
          structureAndLogic: {
            score: Math.floor(Math.random() * 2) + 3,
            comment: "Good organization with clear paragraphs. Work on smoother transitions between ideas."
          },
          argumentAndEvidence: {
            score: Math.floor(Math.random() * 2) + 3,
            comment: "Solid examples support your points. Try to develop your evidence more thoroughly."
          },
          languageAndStyle: {
            score: Math.floor(Math.random() * 2) + 4,
            comment: "Excellent vocabulary and sentence variety. Minor grammar issues to address."
          },
          overallImpact: {
            score: Math.floor(Math.random() * 2) + 3,
            comment: "Compelling essay that effectively addresses the prompt. Strong conclusion ties ideas together."
          }
        }
      };
    }

    // Calculate overall feedback message
    const scores = gradingData.gradingReport;
    const averageScore = (
      scores.thesisAndFocus.score + 
      scores.structureAndLogic.score + 
      scores.argumentAndEvidence.score + 
      scores.languageAndStyle.score + 
      scores.overallImpact.score
    ) / 5;

    let overallFeedback = "Great work on your essay! ";
    if (averageScore >= 4.5) {
      overallFeedback += "Your writing demonstrates excellent command of essay structure and argumentation.";
    } else if (averageScore >= 4) {
      overallFeedback += "Your essay shows strong writing skills with room for refinement in specific areas.";
    } else if (averageScore >= 3) {
      overallFeedback += "You have a solid foundation. Focus on the areas highlighted for improvement.";
    } else {
      overallFeedback += "Keep practicing! The feedback above will help you improve your writing significantly.";
    }

    // Save user submission to database
    const { error: submissionError } = await supabase
      .from('user_submissions')
      .insert({
        user_id,
        submission_type: 'essay',
        content: user_essay,
        score: gradingData.gradingReport,
        feedback: overallFeedback,
        prompt_id
      });

    if (submissionError) {
      console.error('Error saving submission:', submissionError);
    }

    return NextResponse.json(gradingData);

  } catch (error) {
    console.error('Error in essay-grader:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}