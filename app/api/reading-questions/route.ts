import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { material, questionCount = 5 } = await request.json()
    
    if (!material) {
      return NextResponse.json(
        { error: 'Reading material is required' },
        { status: 400 }
      )
    }

    console.log('Generating reading comprehension questions...')

    try {
      const prompt = `Based on the following reading material, create ${questionCount} reading comprehension questions.

Reading Material:
Title: ${material.title}
Content: ${material.content}

Requirements:
1. Create ${questionCount} multiple-choice questions with 4 options each
2. Questions should test different skills: main idea, details, inference, vocabulary, author's purpose
3. Include clear explanations for each correct answer
4. Make questions appropriate for SSAT/SAT level students
5. Ensure one clearly correct answer per question

Return the response in this exact JSON format:
{
  "questions": [
    {
      "id": "q1",
      "question": "What is the main idea of this passage?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "explanation": "The correct answer is B because...",
      "type": "main_idea"
    }
  ]
}

Question types to include:
- main_idea: What is the central theme or main point?
- details: Specific facts mentioned in the passage
- inference: What can be concluded from the information?
- vocabulary: Meaning of words in context
- purpose: Why did the author write this?

Generate the questions now:`

      const response = await generateText(prompt, 20000)
      
      // Try to parse the JSON response
      let questionsData
      try {
        // Clean the response and extract JSON
        let cleanResponse = response.trim()
        
        // Find the JSON object in the response
        const jsonStart = cleanResponse.indexOf('{')
        const jsonEnd = cleanResponse.lastIndexOf('}') + 1
        
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          cleanResponse = cleanResponse.substring(jsonStart, jsonEnd)
        }
        
        questionsData = JSON.parse(cleanResponse)
        
        if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
          throw new Error('Invalid questions format')
        }
        
        // Validate question structure
        questionsData.questions.forEach((q: any, index: number) => {
          if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length !== 4) {
            throw new Error(`Invalid question structure at index ${index}`)
          }
          if (!q.correct_answer || !q.explanation) {
            throw new Error(`Missing required fields at index ${index}`)
          }
        })
        
        console.log('Successfully generated', questionsData.questions.length, 'questions')
        
        return NextResponse.json({
          success: true,
          questions: questionsData.questions,
          material: {
            title: material.title,
            wordCount: material.wordCount,
            difficulty: material.difficulty
          }
        })
        
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        throw new Error('Invalid AI response format')
      }
      
    } catch (aiError) {
      console.error('AI generation failed:', aiError)
      
      // Return fallback questions based on the material
      return NextResponse.json({
        success: true,
        questions: generateFallbackQuestions(material),
        isFallback: true,
        material: {
          title: material.title,
          wordCount: material.wordCount,
          difficulty: material.difficulty
        }
      })
    }

  } catch (error) {
    console.error('Error in reading questions API:', error)
    return NextResponse.json(
      { error: 'Failed to generate reading questions' },
      { status: 500 }
    )
  }
}

function generateFallbackQuestions(material: any) {
  // 分析阅读材料的关键词和主题
  const content = material.content.toLowerCase()
  const title = material.title
  const difficulty = material.difficulty
  
  // 根据内容猜测主题类型
  let topicType = 'general'
  if (content.includes('science') || content.includes('research') || content.includes('study') || content.includes('experiment')) {
    topicType = 'science'
  } else if (content.includes('history') || content.includes('century') || content.includes('ancient') || content.includes('war')) {
    topicType = 'history'
  } else if (content.includes('environment') || content.includes('climate') || content.includes('nature') || content.includes('earth')) {
    topicType = 'environment'
  } else if (content.includes('technology') || content.includes('computer') || content.includes('digital') || content.includes('internet')) {
    topicType = 'technology'
  }
  
  // 提取文本中的关键短语
  const sentences = material.content.split(/[.!?]+/).filter((s: string) => s.trim().length > 10)
  const firstSentence = sentences[0]?.trim() || ''
  const lastSentence = sentences[sentences.length - 1]?.trim() || ''
  
  const questions = [
    {
      id: 'fb_q1',
      question: `According to the passage "${title}", what is the main focus?`,
      options: [
        generateOptionFromContent(content, topicType, 'main_correct'),
        generateOptionFromContent(content, topicType, 'distractor_1'),
        generateOptionFromContent(content, topicType, 'distractor_2'),
        generateOptionFromContent(content, topicType, 'distractor_3')
      ].sort(() => Math.random() - 0.5), // 随机排序
      correct_answer: generateOptionFromContent(content, topicType, 'main_correct'),
      explanation: `The passage primarily discusses ${topicType === 'science' ? 'scientific concepts' : topicType === 'history' ? 'historical information' : topicType === 'environment' ? 'environmental topics' : 'the main topic'} as evidenced by the content and examples provided.`,
      type: 'main_idea'
    },
    {
      id: 'fb_q2',
      question: 'Based on the information presented, which statement is most accurate?',
      options: [
        firstSentence.length > 20 ? firstSentence.substring(0, 60) + '...' : 'The passage provides factual information',
        'The author expresses strong personal opinions throughout',
        'The text is primarily narrative and story-based',
        'The content focuses on entertainment rather than education'
      ],
      correct_answer: firstSentence.length > 20 ? firstSentence.substring(0, 60) + '...' : 'The passage provides factual information',
      explanation: 'This statement accurately reflects the informational nature of the passage.',
      type: 'details'
    },
    {
      id: 'fb_q3',
      question: 'What can you infer about the author\'s purpose in writing this passage?',
      options: [
        'To educate readers about the topic',
        'To entertain with fictional stories',
        'To persuade readers to buy something',
        'To express personal emotions and feelings'
      ],
      correct_answer: 'To educate readers about the topic',
      explanation: `Given the informative content and structure, the author's primary purpose is educational, focusing on ${topicType} concepts.`,
      type: 'purpose'
    },
    {
      id: 'fb_q4',
      question: `In the context of this passage about "${title}", what reading strategy would be most effective?`,
      options: [
        difficulty === 'hard' ? 'Careful analysis of complex concepts' : difficulty === 'easy' ? 'Reading for general understanding' : 'Balancing speed and comprehension',
        'Skipping difficult parts entirely',
        'Focusing only on the conclusion',
        'Reading as quickly as possible without stopping'
      ],
      correct_answer: difficulty === 'hard' ? 'Careful analysis of complex concepts' : difficulty === 'easy' ? 'Reading for general understanding' : 'Balancing speed and comprehension',
      explanation: `For ${difficulty}-level texts like this, ${difficulty === 'hard' ? 'careful analysis helps understand complex ideas' : difficulty === 'easy' ? 'reading for general understanding is sufficient' : 'a balanced approach works best'}.`,
      type: 'strategy'
    },
    {
      id: 'fb_q5',
      question: 'Which aspect of reading comprehension is most important for this passage?',
      options: [
        getComprehensionFocus(topicType, content),
        'Memorizing specific dates and numbers',
        'Identifying rhyme and rhythm patterns',
        'Analyzing character emotions and motivations'
      ],
      correct_answer: getComprehensionFocus(topicType, content),
      explanation: `This type of ${topicType} text requires ${getComprehensionFocus(topicType, content).toLowerCase()} to fully understand the concepts presented.`,
      type: 'comprehension'
    }
  ]
  
  return questions.slice(0, Math.min(5, questions.length))
}

function generateOptionFromContent(content: string, topicType: string, optionType: string): string {
  const options = {
    science: {
      main_correct: 'Explaining scientific concepts and research findings',
      distractor_1: 'Describing historical events and timelines', 
      distractor_2: 'Analyzing literary works and authors',
      distractor_3: 'Discussing political policies and debates'
    },
    history: {
      main_correct: 'Examining historical events and their significance',
      distractor_1: 'Explaining scientific theories and experiments',
      distractor_2: 'Teaching mathematical formulas and problems',
      distractor_3: 'Reviewing modern technology trends'
    },
    environment: {
      main_correct: 'Discussing environmental issues and sustainability',
      distractor_1: 'Describing sports events and competitions',
      distractor_2: 'Explaining cooking techniques and recipes',
      distractor_3: 'Analyzing music composition and theory'
    },
    technology: {
      main_correct: 'Exploring technological innovations and applications',
      distractor_1: 'Discussing ancient civilizations and cultures',
      distractor_2: 'Explaining biological processes and systems',
      distractor_3: 'Analyzing artistic movements and styles'
    },
    general: {
      main_correct: 'Providing informative content on the main topic',
      distractor_1: 'Telling entertaining fictional stories',
      distractor_2: 'Promoting commercial products or services',
      distractor_3: 'Expressing personal opinions and beliefs'
    }
  }
  
  const topicOptions = options[topicType as keyof typeof options] || options.general
  return topicOptions[optionType as keyof typeof topicOptions] || options.general[optionType as keyof typeof options.general]
}

function getComprehensionFocus(topicType: string, content: string): string {
  if (topicType === 'science') return 'Understanding cause and effect relationships'
  if (topicType === 'history') return 'Identifying chronological sequences and connections'  
  if (topicType === 'environment') return 'Recognizing problems and proposed solutions'
  if (topicType === 'technology') return 'Understanding processes and applications'
  return 'Identifying main ideas and supporting details'
}