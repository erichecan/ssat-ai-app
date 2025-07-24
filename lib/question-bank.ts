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
  },

  // Additional Vocabulary Questions
  {
    id: 'vocab_007',
    type: 'vocabulary',
    question: "What does 'eloquent' mean?",
    options: [
      "Speaking or writing fluently and persuasively.",
      "Speaking quietly and hesitantly.",
      "Using complex and difficult words.",
      "Avoiding direct communication."
    ],
    correct_answer: "Speaking or writing fluently and persuasively.",
    explanation: "Eloquent means speaking or writing fluently and persuasively. It comes from the Latin 'eloqui', meaning 'to speak out'.",
    difficulty: 'medium',
    topic: 'vocabulary',
    tags: ['communication', 'latin_roots'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vocab_008',
    type: 'vocabulary',
    question: "Which of the following best defines 'pragmatic'?",
    options: [
      "Dealing with things sensibly and realistically.",
      "Being extremely idealistic and dreamy.",
      "Acting in a dramatic and emotional way.",
      "Following strict rules without exception."
    ],
    correct_answer: "Dealing with things sensibly and realistically.",
    explanation: "Pragmatic means dealing with things sensibly and realistically in a way that is based on practical rather than idealistic considerations.",
    difficulty: 'hard',
    topic: 'vocabulary',
    tags: ['philosophy', 'practical'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vocab_009',
    type: 'vocabulary',
    question: "What does 'tenacious' mean?",
    options: [
      "Holding fast; persistent and determined.",
      "Easily giving up when faced with challenges.",
      "Acting in a careless and reckless manner.",
      "Being extremely flexible and adaptable."
    ],
    correct_answer: "Holding fast; persistent and determined.",
    explanation: "Tenacious means holding fast, persistent and determined. It comes from the Latin 'tenax', meaning 'holding fast'.",
    difficulty: 'medium',
    topic: 'vocabulary',
    tags: ['persistence', 'latin_roots'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vocab_010',
    type: 'vocabulary',
    question: "Which word means 'to make less severe or harsh'?",
    options: [
      "Mitigate",
      "Aggravate", 
      "Complicate",
      "Accelerate"
    ],
    correct_answer: "Mitigate",
    explanation: "Mitigate means to make less severe, serious, or painful. It comes from the Latin 'mitigatus', meaning 'made mild'.",
    difficulty: 'hard',
    topic: 'vocabulary',
    tags: ['latin_roots', 'reduction'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Additional Math Questions
  {
    id: 'math_006',
    type: 'math',
    question: "If 3x + 7 = 22, what is the value of x?",
    options: ["3", "5", "7", "15"],
    correct_answer: "5",
    explanation: "To solve 3x + 7 = 22: First subtract 7 from both sides: 3x = 15. Then divide both sides by 3: x = 5.",
    difficulty: 'easy',
    topic: 'algebra',
    tags: ['equations', 'solving'],
    time_limit: 90,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'math_007',
    type: 'math',
    question: "What is 25% of 80?",
    options: ["15", "20", "25", "30"],
    correct_answer: "20",
    explanation: "25% of 80 = 0.25 × 80 = 20. Alternatively, 25% = 1/4, so 1/4 × 80 = 20.",
    difficulty: 'easy',
    topic: 'percentages',
    tags: ['percentage', 'calculation'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'math_008',
    type: 'math',
    question: "If a triangle has angles of 45° and 60°, what is the third angle?",
    options: ["75°", "85°", "90°", "105°"],
    correct_answer: "75°",
    explanation: "The sum of angles in a triangle is always 180°. So the third angle = 180° - 45° - 60° = 75°.",
    difficulty: 'medium',
    topic: 'geometry',
    tags: ['triangles', 'angles'],
    time_limit: 90,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'math_009',
    type: 'math',
    question: "What is the area of a rectangle with length 8 and width 5?",
    options: ["13", "26", "40", "80"],
    correct_answer: "40",
    explanation: "The area of a rectangle = length × width = 8 × 5 = 40 square units.",
    difficulty: 'easy',
    topic: 'geometry',
    tags: ['area', 'rectangle'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'math_010',
    type: 'math',
    question: "If y = 2x + 3 and x = 4, what is the value of y?",
    options: ["8", "9", "11", "14"],
    correct_answer: "11",
    explanation: "Substitute x = 4 into the equation: y = 2(4) + 3 = 8 + 3 = 11.",
    difficulty: 'medium',
    topic: 'algebra',
    tags: ['substitution', 'linear_equations'],
    time_limit: 90,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Additional Reading Questions  
  {
    id: 'reading_004',
    type: 'reading',
    question: "Based on the passage, what can be inferred about the character's motivation?",
    passage: "Sarah stared at the acceptance letter for hours, her hands trembling slightly. The prestigious university had accepted her, but the scholarship offer was less than she had hoped. She thought of her parents working double shifts at the factory, their faces lined with exhaustion but always encouraging her dreams. The decision that had seemed so clear now felt impossibly complex.",
    options: [
      "She is torn between financial concerns and her educational aspirations.",
      "She is simply excited about being accepted to the university.",
      "She wants to work at a factory like her parents.",
      "She is ungrateful for the scholarship offer she received."
    ],
    correct_answer: "She is torn between financial concerns and her educational aspirations.",
    explanation: "The passage shows Sarah's internal conflict: she's been accepted to her dream university, but the insufficient scholarship and awareness of her parents' financial struggles create a complex decision between her aspirations and practical concerns.",
    difficulty: 'medium',
    topic: 'inference',
    tags: ['character_motivation', 'inference'],
    time_limit: 120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'reading_005',
    type: 'reading',
    question: "What is the main theme of this passage?",
    passage: "The old library stood like a sentinel in the town square, its weathered brick facade telling stories of generations who had sought knowledge within its walls. Despite the rise of digital media, Mrs. Henderson noticed that teenagers still gathered there after school, not just for homework, but for the community it provided—a quiet sanctuary where different worlds collided and friendships were born over shared books.",
    options: [
      "The enduring value of physical spaces for learning and community.",
      "The superiority of digital media over traditional books.", 
      "The historical significance of old buildings.",
      "The social problems facing modern teenagers."
    ],
    correct_answer: "The enduring value of physical spaces for learning and community.",
    explanation: "The passage emphasizes how the library continues to serve as an important community space despite technological changes, highlighting its lasting value for bringing people together and fostering connections.",
    difficulty: 'medium',
    topic: 'theme',
    tags: ['main_idea', 'community'],
    time_limit: 120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Additional Writing Questions
  {
    id: 'writing_003',
    type: 'writing',
    question: "Which sentence is grammatically correct?",
    options: [
      "Neither the teacher nor the students was prepared for the surprise quiz.",
      "Neither the teacher nor the students were prepared for the surprise quiz.",
      "Neither the teacher or the students were prepared for the surprise quiz.",
      "Neither the teacher and the students was prepared for the surprise quiz."
    ],
    correct_answer: "Neither the teacher nor the students were prepared for the surprise quiz.",
    explanation: "With 'neither...nor' constructions, the verb agrees with the subject closest to it. Since 'students' (plural) is closer to the verb than 'teacher' (singular), we use 'were' (plural verb).",
    difficulty: 'hard',
    topic: 'grammar',
    tags: ['subject_verb_agreement', 'correlative_conjunctions'],
    time_limit: 90,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'writing_004',
    type: 'writing',
    question: "Choose the best revision for this sentence: 'The book that I read it was very interesting.'",
    options: [
      "The book that I read was very interesting.",
      "The book which I read it was very interesting.",
      "The book that I read it were very interesting.",
      "The book I read it was very interesting and good."
    ],
    correct_answer: "The book that I read was very interesting.",
    explanation: "The original sentence has a redundant pronoun 'it'. When using a relative pronoun like 'that', you don't need an additional pronoun referring to the same noun.",
    difficulty: 'medium',
    topic: 'grammar',
    tags: ['relative_pronouns', 'redundancy'],
    time_limit: 90,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Additional Vocabulary Questions - Enhanced for better coverage (2024-12-19 17:00:00)
  {
    id: 'vocab_016',
    type: 'vocabulary',
    question: "What does 'meticulous' mean?",
    options: [
      "Showing great attention to detail; very careful and precise.",
      "Being very fast and efficient in completing tasks.",
      "Having a strong desire to succeed or achieve something.",
      "Being friendly and easy to talk to."
    ],
    correct_answer: "Showing great attention to detail; very careful and precise.",
    explanation: "Meticulous means showing great attention to detail; very careful and precise. It comes from the Latin 'metus' meaning 'fear' - originally meaning 'fearful' but evolved to mean 'careful'.",
    difficulty: 'medium',
    topic: 'vocabulary',
    tags: ['latin_roots', 'attention', 'precision'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vocab_017',
    type: 'vocabulary',
    question: "Which word means 'to make something less severe or intense'?",
    options: [
      "Exacerbate",
      "Alleviate",
      "Aggravate",
      "Intensify"
    ],
    correct_answer: "Alleviate",
    explanation: "Alleviate means to make something less severe or intense. It comes from the Latin 'alleviare' meaning 'to lighten'.",
    difficulty: 'medium',
    topic: 'vocabulary',
    tags: ['latin_roots', 'reduction', 'relief'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vocab_018',
    type: 'vocabulary',
    question: "What is the meaning of 'resilient'?",
    options: [
      "Able to withstand or recover quickly from difficult conditions.",
      "Being very strong and muscular.",
      "Having a lot of energy and enthusiasm.",
      "Being very intelligent and knowledgeable."
    ],
    correct_answer: "Able to withstand or recover quickly from difficult conditions.",
    explanation: "Resilient means able to withstand or recover quickly from difficult conditions. It comes from the Latin 'resilire' meaning 'to leap back'.",
    difficulty: 'medium',
    topic: 'vocabulary',
    tags: ['latin_roots', 'recovery', 'strength'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vocab_019',
    type: 'vocabulary',
    question: "Which word means 'to express strong disapproval of'?",
    options: [
      "Applaud",
      "Condemn",
      "Praise",
      "Support"
    ],
    correct_answer: "Condemn",
    explanation: "Condemn means to express strong disapproval of. It comes from the Latin 'condemnare' meaning 'to sentence'.",
    difficulty: 'medium',
    topic: 'vocabulary',
    tags: ['latin_roots', 'disapproval', 'judgment'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vocab_020',
    type: 'vocabulary',
    question: "What does 'eloquent' mean?",
    options: [
      "Fluent or persuasive in speaking or writing.",
      "Being very loud and attention-grabbing.",
      "Having a lot of knowledge about many subjects.",
      "Being very fast in completing tasks."
    ],
    correct_answer: "Fluent or persuasive in speaking or writing.",
    explanation: "Eloquent means fluent or persuasive in speaking or writing. It comes from the Latin 'eloquens' meaning 'speaking out'.",
    difficulty: 'medium',
    topic: 'vocabulary',
    tags: ['latin_roots', 'speech', 'persuasion'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Additional Math Questions
  {
    id: 'math_016',
    type: 'math',
    question: "If a triangle has angles measuring 45°, 45°, and 90°, what type of triangle is it?",
    options: [
      "Equilateral triangle",
      "Isosceles right triangle",
      "Scalene triangle",
      "Obtuse triangle"
    ],
    correct_answer: "Isosceles right triangle",
    explanation: "A triangle with angles 45°, 45°, and 90° is an isosceles right triangle. It has two equal angles (45°) and one right angle (90°), and the sides opposite the equal angles are equal in length.",
    difficulty: 'medium',
    topic: 'geometry',
    tags: ['triangles', 'angles', 'isosceles'],
    time_limit: 90,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'math_017',
    type: 'math',
    question: "What is the value of x if 2x + 5 = 17?",
    options: [
      "6",
      "7",
      "8",
      "9"
    ],
    correct_answer: "6",
    explanation: "2x + 5 = 17 → 2x = 12 → x = 6",
    difficulty: 'easy',
    topic: 'algebra',
    tags: ['linear_equations', 'solving'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'math_018',
    type: 'math',
    question: "What is the perimeter of a square with side length 8?",
    options: [
      "16",
      "24",
      "32",
      "64"
    ],
    correct_answer: "32",
    explanation: "Perimeter of a square = 4 × side length = 4 × 8 = 32",
    difficulty: 'easy',
    topic: 'geometry',
    tags: ['perimeter', 'squares'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'math_019',
    type: 'math',
    question: "What is 15% of 200?",
    options: [
      "20",
      "30",
      "25",
      "35"
    ],
    correct_answer: "30",
    explanation: "15% of 200 = 0.15 × 200 = 30",
    difficulty: 'easy',
    topic: 'percentages',
    tags: ['percentages', 'calculation'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'math_020',
    type: 'math',
    question: "If a rectangle has length 10 and width 6, what is its area?",
    options: [
      "16",
      "32",
      "60",
      "120"
    ],
    correct_answer: "60",
    explanation: "Area of rectangle = length × width = 10 × 6 = 60",
    difficulty: 'easy',
    topic: 'geometry',
    tags: ['area', 'rectangles'],
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Additional Reading Questions
  {
    id: 'reading_016',
    type: 'reading',
    question: "What is the main purpose of this passage?",
    options: [
      "To entertain readers with a story",
      "To inform readers about a scientific discovery",
      "To persuade readers to take action",
      "To describe a historical event"
    ],
    correct_answer: "To inform readers about a scientific discovery",
    explanation: "The passage presents factual information about a scientific discovery in an objective manner, making its main purpose to inform.",
    difficulty: 'medium',
    topic: 'comprehension',
    tags: ['main_idea', 'purpose'],
    time_limit: 90,
    passage: "Scientists have discovered a new species of deep-sea fish that can survive in extreme pressure conditions. The fish, found at depths of over 3,000 meters, has unique adaptations including bioluminescent organs and specialized gills that allow it to extract oxygen from the low-oxygen environment. This discovery could lead to new insights into how life adapts to extreme environments.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'reading_017',
    type: 'reading',
    question: "Based on the passage, what can be inferred about the author's attitude?",
    options: [
      "Skeptical and doubtful",
      "Enthusiastic and optimistic",
      "Neutral and objective",
      "Concerned and worried"
    ],
    correct_answer: "Neutral and objective",
    explanation: "The author presents the information in a factual, objective manner without expressing personal opinions or emotions.",
    difficulty: 'medium',
    topic: 'comprehension',
    tags: ['inference', 'author_attitude'],
    time_limit: 90,
    passage: "The new technology shows potential for improving efficiency in manufacturing processes. Research indicates that it could reduce production time by up to 25% while maintaining quality standards. However, implementation costs and training requirements must be carefully considered before adoption.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'reading_018',
    type: 'reading',
    question: "What is the meaning of the word 'innovative' as used in the passage?",
    options: [
      "Traditional and well-established",
      "New and creative",
      "Expensive and costly",
      "Simple and basic"
    ],
    correct_answer: "New and creative",
    explanation: "In the context of the passage, 'innovative' refers to something that is new and creative, introducing novel approaches or methods.",
    difficulty: 'medium',
    topic: 'vocabulary_in_context',
    tags: ['vocabulary', 'context'],
    time_limit: 90,
    passage: "The company's innovative approach to problem-solving has led to several breakthrough products. Their creative thinking and willingness to try new methods have set them apart from competitors in the industry.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'reading_019',
    type: 'reading',
    question: "Which of the following best summarizes the passage?",
    options: [
      "A detailed history of the subject",
      "A comparison of different approaches",
      "An explanation of a process or concept",
      "A personal opinion about the topic"
    ],
    correct_answer: "An explanation of a process or concept",
    explanation: "The passage explains how a process works or describes a concept in detail, making this the best summary.",
    difficulty: 'medium',
    topic: 'comprehension',
    tags: ['summary', 'main_idea'],
    time_limit: 90,
    passage: "Photosynthesis is the process by which plants convert sunlight into energy. During this process, plants take in carbon dioxide and water, and using energy from sunlight, they produce glucose and oxygen. This process is essential for life on Earth as it provides the oxygen we breathe and forms the base of most food chains.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'reading_020',
    type: 'reading',
    question: "What is the tone of this passage?",
    options: [
      "Humorous and lighthearted",
      "Serious and informative",
      "Critical and negative",
      "Emotional and passionate"
    ],
    correct_answer: "Serious and informative",
    explanation: "The passage presents information in a serious, factual manner with the purpose of educating the reader.",
    difficulty: 'medium',
    topic: 'comprehension',
    tags: ['tone', 'mood'],
    time_limit: 90,
    passage: "Climate change represents one of the most significant challenges facing humanity today. Scientific evidence shows that global temperatures are rising due to increased greenhouse gas emissions. This warming trend affects weather patterns, sea levels, and ecosystems worldwide, requiring immediate attention and action.",
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

  // 使用Fisher-Yates洗牌算法进行真正的随机排序
  const shuffleArray = (array: Question[]) => {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }
  
  const shuffled = shuffleArray(filtered)
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