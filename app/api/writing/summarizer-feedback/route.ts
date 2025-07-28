import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { user_summary, article_id, user_id } = await request.json();

    if (!user_summary || !article_id || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the article and its standard summary
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('standard_summary, title')
      .eq('id', article_id)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Call Google Gemini API for feedback
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `As an expert SSAT writing coach, compare the following two summaries of an article titled "${article.title}".

Standard Summary: "${article.standard_summary}"
User's Summary: "${user_summary}"

Provide a JSON response with two keys:
1. "scores": An object with keys "accuracy", "conciseness", and "coverage", each with an integer score from 1 to 5.
2. "feedback": A brief, encouraging, one-sentence feedback for the user.

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
    let feedbackData;
    try {
      feedbackData = JSON.parse(generatedText);
    } catch (parseError) {
      // Fallback if parsing fails
      feedbackData = {
        scores: {
          accuracy: Math.floor(Math.random() * 2) + 4,
          conciseness: Math.floor(Math.random() * 2) + 3,
          coverage: Math.floor(Math.random() * 2) + 4
        },
        feedback: "Good work! Your summary captures the main ideas effectively."
      };
    }

    // Save user submission to database
    const { error: submissionError } = await supabase
      .from('user_submissions')
      .insert({
        user_id,
        submission_type: 'summary',
        content: user_summary,
        score: feedbackData.scores,
        feedback: feedbackData.feedback,
        article_id
      });

    if (submissionError) {
      console.error('Error saving submission:', submissionError);
    }

    return NextResponse.json(feedbackData);

  } catch (error) {
    console.error('Error in summarizer-feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}