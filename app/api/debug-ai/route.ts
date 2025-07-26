import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    console.log('Testing AI generation directly...')
    
    // 简单的测试提示词
    const prompt = `Generate 2 SSAT vocabulary words as JSON:

{
  "words": [
    {
      "word": "example",
      "definition": "A representative form or pattern",
      "pronunciation": "/ɪɡˈzæmpəl/",
      "part_of_speech": "noun",
      "difficulty": "easy",
      "example_sentence": "This is an example sentence."
    }
  ]
}

Return only valid JSON.`

    console.log('Calling generateText...')
    const aiResponse = await generateText(prompt, 30000)
    console.log('AI Response received:', aiResponse.length, 'characters')
    
    // 清理响应
    const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim()
    console.log('Cleaned response:', cleanResponse.substring(0, 200) + '...')
    
    // 尝试解析JSON
    try {
      const parsedResponse = JSON.parse(cleanResponse)
      console.log('JSON parsed successfully:', parsedResponse)
      
      return NextResponse.json({
        success: true,
        aiResponse: aiResponse.substring(0, 500),
        cleanResponse: cleanResponse.substring(0, 500),
        parsed: parsedResponse,
        wordsCount: parsedResponse.words?.length || 0
      })
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError)
      return NextResponse.json({
        success: false,
        error: 'JSON parsing failed',
        aiResponse: aiResponse.substring(0, 500),
        cleanResponse: cleanResponse.substring(0, 500),
        parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      })
    }

  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'AI generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}