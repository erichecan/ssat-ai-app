import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { difficulty = 'medium', topic_category } = await request.json();

    // Define SSAT-appropriate topics
    const topics = [
      'Education and Learning',
      'Technology and Society', 
      'Environmental Issues',
      'Health and Wellness',
      'Arts and Culture',
      'Science and Discovery',
      'Community and Citizenship',
      'Personal Growth',
      'History and Society',
      'Innovation and Creativity'
    ];

    const selectedTopic = topic_category || topics[Math.floor(Math.random() * topics.length)];

    // Generate article using Gemini AI
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create an educational article suitable for SSAT reading comprehension practice. 

Requirements:
- Topic: ${selectedTopic}
- Difficulty: ${difficulty} (easy = middle school level, medium = 8th-9th grade, hard = high school level)
- Length: 200-300 words
- Style: Informative and engaging, similar to articles found on educational websites
- Structure: 2-3 paragraphs with clear main ideas
- Vocabulary: Age-appropriate but challenging

Please return a JSON object with these exact keys:
{
  "title": "An engaging title for the article",
  "content": "The full article text (200-300 words)",
  "topic_category": "${selectedTopic}",
  "standard_summary": "A one-sentence summary capturing the main idea (15-25 words)",
  "keywords": ["array", "of", "5-7", "key", "terms"],
  "difficulty": "${difficulty}"
}

Make the article factual and educational, suitable for standardized test practice. Avoid controversial topics.`
          }]
        }]
      })
    });

    if (!geminiResponse.ok) {
      throw new Error('Failed to generate article with Gemini');
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates[0].content.parts[0].text;
    
    // Parse the JSON response from Gemini
    let articleData;
    try {
      // Clean the response to extract JSON
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        articleData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Fallback article generation
      articleData = {
        title: `Understanding ${selectedTopic}`,
        content: `This article explores the important topic of ${selectedTopic}. In our modern world, this subject has become increasingly relevant to students and educators alike. Understanding these concepts helps develop critical thinking skills and prepares students for academic success. Through careful study and practice, students can master these important ideas. The key is to approach learning with curiosity and dedication, building knowledge step by step.`,
        topic_category: selectedTopic,
        standard_summary: `${selectedTopic} is an important subject that helps students develop critical thinking and academic skills.`,
        keywords: ['education', 'learning', 'students', 'knowledge', 'skills'],
        difficulty: difficulty
      };
    }

    // Save the generated article to database
    const { data: savedArticle, error: saveError } = await supabase
      .from('articles')
      .insert({
        title: articleData.title,
        content: articleData.content,
        topic_category: articleData.topic_category,
        standard_summary: articleData.standard_summary,
        keywords: articleData.keywords,
        difficulty: articleData.difficulty
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving article:', saveError);
      // Still return the generated article even if save fails
    }

    // Return the generated article (use saved version if available)
    return NextResponse.json({
      article: savedArticle || { 
        id: 'temp-' + Date.now(),
        ...articleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      { error: 'Failed to generate article' },
      { status: 500 }
    );
  }
}