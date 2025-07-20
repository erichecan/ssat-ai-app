// 完整的SSAT/SAT题目库
export interface Question {
  id: string
  type: 'vocabulary' | 'reading' | 'math' | 'writing'
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
  passage?: string
  tags: string[]
  time_limit?: number // seconds
  created_at: string
  updated_at: string
}

export const questionBank: Question[] = [
  // Vocabulary Questions
  {
    id: 'vocab_001',
    type: 'vocabulary',
    question: "Which of the following is the best definition of 'ambivalent'?",
    options: [
      "Having mixed feelings or contradictory ideas about something or someone.",
      "Showing or feeling active opposition toward something or someone.",
      "Feeling or showing sympathy and concern for others.",
      "Having or showing a lack of ambition or determination."
    ],
    correct_answer: "Having mixed feelings or contradictory ideas about something or someone.",
    explanation: "Ambivalent means having mixed feelings or contradictory ideas about something or someone. It comes from the Latin 'ambi' (both) and 'valent' (strong), literally meaning 'having strength in both directions.'",
    difficulty: 'medium',
    topic: 'vocabulary',
    tags: ['latin_roots', 'emotions', 'psychology'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vocab_002',
    type: 'vocabulary',
    question: "What does 'scrutinize' mean?",
    options: [
      "To examine or inspect closely and thoroughly.",
      "To criticize harshly and publicly.",
      "To avoid looking at something directly.",
      "To summarize briefly and concisely."
    ],
    correct_answer: "To examine or inspect closely and thoroughly.",
    explanation: "Scrutinize means to examine or inspect closely and thoroughly. It comes from the Latin 'scrutari', meaning 'to search through carefully.'",
    difficulty: 'medium',
    topic: 'vocabulary',
    tags: ['latin_roots', 'examination', 'analysis'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vocab_003',
    type: 'vocabulary',
    question: "What is the meaning of 'expedite'?",
    options: [
      "To speed up or accelerate a process.",
      "To delay or postpone an action.",
      "To cancel or terminate a plan.",
      "To document or record information."
    ],
    correct_answer: "To speed up or accelerate a process.",
    explanation: "Expedite means to speed up or accelerate a process. It comes from the Latin 'expeditus', meaning 'freed from impediments.'",
    difficulty: 'medium',
    topic: 'vocabulary',
    tags: ['latin_roots', 'process', 'efficiency'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vocab_004',
    type: 'vocabulary',
    question: "Which word means 'lasting for a very short time'?",
    options: [
      "Eternal",
      "Ephemeral", 
      "Enduring",
      "Persistent"
    ],
    correct_answer: "Ephemeral",
    explanation: "Ephemeral means lasting for a very short time; temporary. It comes from Greek, meaning 'lasting only a day'. It describes things that are transient or short-lived.",
    difficulty: 'hard',
    topic: 'vocabulary',
    tags: ['greek_roots', 'time', 'temporary'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vocab_005',
    type: 'vocabulary',
    question: "What does 'ubiquitous' mean?",
    options: [
      "Rare and hard to find",
      "Present, appearing, or found everywhere",
      "Ancient or from the past",
      "Extremely valuable"
    ],
    correct_answer: "Present, appearing, or found everywhere",
    explanation: "Ubiquitous means present, appearing, or found everywhere. From Latin 'ubique' meaning 'everywhere'. Often used to describe something that seems to be everywhere at once.",
    difficulty: 'hard',
    topic: 'vocabulary',
    tags: ['latin_roots', 'frequency', 'presence'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Math Questions
  {
    id: 'math_001',
    type: 'math',
    question: "If x + 3 = 12, what is the value of 2x - 5?",
    options: ["13", "14", "15", "16"],
    correct_answer: "13",
    explanation: "First solve for x: x + 3 = 12, so x = 9. Then substitute into 2x - 5: 2(9) - 5 = 18 - 5 = 13.",
    difficulty: 'easy',
    topic: 'algebra',
    tags: ['linear_equations', 'substitution', 'basic_algebra'],
    time_limit: 90,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'math_002',
    type: 'math',
    question: "What is 25% of 80?",
    options: ["15", "20", "25", "30"],
    correct_answer: "20",
    explanation: "To find 25% of 80, multiply 80 by 0.25: 80 × 0.25 = 20. Remember that 25% = 1/4, so you can also divide 80 by 4.",
    difficulty: 'easy',
    topic: 'percentages',
    tags: ['percentages', 'basic_math', 'multiplication'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'math_003',
    type: 'math',
    question: "If a triangle has angles measuring 45° and 60°, what is the measure of the third angle?",
    options: ["75°", "85°", "90°", "95°"],
    correct_answer: "75°",
    explanation: "The sum of angles in any triangle is 180°. So: 180° - 45° - 60° = 75°.",
    difficulty: 'medium',
    topic: 'geometry',
    tags: ['triangles', 'angle_sum', 'geometry'],
    time_limit: 90,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'math_004',
    type: 'math',
    question: "Solve for y: 3y - 7 = 2y + 5",
    options: ["y = 10", "y = 12", "y = 14", "y = 16"],
    correct_answer: "y = 12",
    explanation: "Subtract 2y from both sides: 3y - 2y - 7 = 5, so y - 7 = 5. Add 7 to both sides: y = 12.",
    difficulty: 'medium',
    topic: 'algebra',
    tags: ['linear_equations', 'solving', 'algebra'],
    time_limit: 120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'math_005',
    type: 'math',
    question: "If f(x) = 2x² + 3x - 1, what is f(2)?",
    options: ["9", "11", "13", "15"],
    correct_answer: "13",
    explanation: "Substitute x = 2: f(2) = 2(2)² + 3(2) - 1 = 2(4) + 6 - 1 = 8 + 6 - 1 = 13.",
    difficulty: 'hard',
    topic: 'functions',
    tags: ['functions', 'quadratic', 'substitution'],
    time_limit: 120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Reading Comprehension Questions
  {
    id: 'reading_001',
    type: 'reading',
    question: "Based on the passage, what is the author's main argument about technology in education?",
    passage: "While technology has revolutionized many aspects of modern life, its role in education remains a subject of debate. Proponents argue that digital tools enhance learning by providing interactive experiences and personalized instruction. However, critics worry that excessive screen time may diminish students' attention spans and reduce face-to-face interaction. The most effective approach likely involves strategic integration of technology alongside traditional teaching methods, ensuring that digital tools serve to supplement rather than replace fundamental educational practices.",
    options: [
      "Technology should completely replace traditional teaching methods.",
      "Technology enhances learning when used strategically alongside traditional methods.",
      "Technology is a distraction that should be avoided in classrooms.",
      "Technology is only useful for administrative tasks in schools."
    ],
    correct_answer: "Technology enhances learning when used strategically alongside traditional methods.",
    explanation: "The passage advocates for a balanced approach where technology serves as a tool to enhance traditional teaching rather than replace it entirely. The author suggests 'strategic integration' as the most effective approach.",
    difficulty: 'medium',
    topic: 'reading_comprehension',
    tags: ['main_idea', 'author_argument', 'education'],
    time_limit: 180,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'reading_002',
    type: 'reading',
    question: "According to the passage, what is the primary concern about climate change's impact on agriculture?",
    passage: "Climate change poses unprecedented challenges to global agriculture. Rising temperatures, shifting precipitation patterns, and increasing frequency of extreme weather events threaten crop yields worldwide. Scientists warn that without significant adaptation measures, food security could be compromised for billions of people. Research into drought-resistant crops, improved irrigation systems, and sustainable farming practices offers hope, but implementation requires substantial investment and international cooperation.",
    options: [
      "The cost of implementing new farming technologies",
      "The threat to crop yields and food security",
      "The need for international cooperation",
      "The development of drought-resistant crops"
    ],
    correct_answer: "The threat to crop yields and food security",
    explanation: "The passage identifies the primary concern as threats to crop yields and food security for billions of people, which is the main consequence of climate change's impact on agriculture mentioned in the text.",
    difficulty: 'medium',
    topic: 'reading_comprehension',
    tags: ['main_idea', 'climate_change', 'agriculture'],
    time_limit: 180,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'reading_003',
    type: 'reading',
    question: "What can be inferred about the author's attitude toward artificial intelligence?",
    passage: "Artificial intelligence has evolved from science fiction fantasy to everyday reality with remarkable speed. While AI systems now assist in medical diagnoses, optimize traffic patterns, and enhance online experiences, questions about their societal impact persist. The benefits are undeniable: increased efficiency, reduced human error, and solutions to complex problems. Yet concerns about job displacement, privacy, and algorithmic bias cannot be dismissed. As we stand at this technological crossroads, thoughtful regulation and ethical consideration must guide AI development.",
    options: [
      "Completely optimistic about AI's potential",
      "Entirely pessimistic about AI's future",
      "Cautiously optimistic but aware of risks",
      "Indifferent to AI's development"
    ],
    correct_answer: "Cautiously optimistic but aware of risks",
    explanation: "The author acknowledges both benefits ('undeniable benefits') and concerns ('cannot be dismissed'), advocating for 'thoughtful regulation and ethical consideration,' which indicates a balanced, cautiously optimistic perspective.",
    difficulty: 'hard',
    topic: 'reading_comprehension',
    tags: ['inference', 'author_tone', 'technology'],
    time_limit: 180,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Writing Questions
  {
    id: 'writing_001',
    type: 'writing',
    question: "Which sentence contains an error in subject-verb agreement?",
    options: [
      "The group of students are studying for their exams.",
      "Each of the players has practiced diligently.",
      "Neither the teacher nor the students were absent.",
      "The team celebrates their victory enthusiastically."
    ],
    correct_answer: "The group of students are studying for their exams.",
    explanation: "The subject 'group' is singular, so it should take the singular verb 'is studying' rather than the plural 'are studying.' The prepositional phrase 'of students' does not affect the subject-verb agreement.",
    difficulty: 'medium',
    topic: 'grammar',
    tags: ['subject_verb_agreement', 'grammar', 'writing'],
    time_limit: 90,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'writing_002',
    type: 'writing',
    question: "Which revision best improves the following sentence: 'The scientist discovered a new species of butterfly which was very important for the ecosystem.'",
    options: [
      "The scientist discovered a new species of butterfly that was very important for the ecosystem.",
      "The scientist's discovery of a new butterfly species proved crucial for understanding ecosystem dynamics.",
      "The scientist discovered a very important new species of butterfly for the ecosystem.",
      "A new species of butterfly was discovered by the scientist which was very important for the ecosystem."
    ],
    correct_answer: "The scientist's discovery of a new butterfly species proved crucial for understanding ecosystem dynamics.",
    explanation: "This revision eliminates wordiness, clarifies the relationship between the discovery and its importance, and uses more precise language ('crucial for understanding ecosystem dynamics' instead of 'very important for the ecosystem').",
    difficulty: 'hard',
    topic: 'sentence_improvement',
    tags: ['revision', 'clarity', 'writing'],
    time_limit: 120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// 按类型和难度筛选题目
export function filterQuestions(
  type?: string,
  difficulty?: string,
  topic?: string,
  limit: number = 10
): Question[] {
  let filtered = questionBank

  if (type) {
    filtered = filtered.filter(q => q.type === type)
  }

  if (difficulty) {
    filtered = filtered.filter(q => q.difficulty === difficulty)
  }

  if (topic) {
    filtered = filtered.filter(q => q.topic === topic)
  }

  // 随机排序并限制数量
  const shuffled = filtered.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, limit)
}

// 获取题目统计信息
export function getQuestionStats() {
  const stats = {
    total: questionBank.length,
    byType: {} as Record<string, number>,
    byDifficulty: {} as Record<string, number>,
    byTopic: {} as Record<string, number>
  }

  questionBank.forEach(q => {
    stats.byType[q.type] = (stats.byType[q.type] || 0) + 1
    stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1
    stats.byTopic[q.topic] = (stats.byTopic[q.topic] || 0) + 1
  })

  return stats
}

// 导出questions别名以保持兼容性
export const questions = questionBank