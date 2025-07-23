// 语法练习题数据结构 - 2024-12-19 14:30:25
// SSAT语法学习功能的练习题定义

export const grammarQuestions = [
  // 主谓一致练习题
  {
    id: 'sva-1',
    ruleId: 'subject-verb-agreement',
    type: 'multiple-choice',
    question: 'Which sentence demonstrates correct subject-verb agreement?',
    options: [
      'The team of players are practicing.',
      'The team of players is practicing.',
      'The team of players were practicing.',
      'The team of players have been practicing.'
    ],
    answer: 'The team of players is practicing.',
    explanation: '集体名词"team"通常被视为单数，因此使用单数动词"is"。介词短语"of players"不影响主语的单复数。'
  },
  {
    id: 'sva-2',
    ruleId: 'subject-verb-agreement',
    type: 'fill-in-the-blank',
    question: 'Each of the students ___ (have/has) completed the assignment.',
    options: ['have', 'has'],
    answer: 'has',
    explanation: '"Each"是单数不定代词，因此需要使用单数动词"has"。'
  },
  
  // 平行结构练习题
  {
    id: 'ps-1',
    ruleId: 'parallel-structure',
    type: 'multiple-choice',
    question: 'Which sentence demonstrates correct parallel structure?',
    options: [
      'I like reading books, to watch movies, and playing games.',
      'I like to read books, to watch movies, and to play games.',
      'I like reading books, watching movies, and to play games.',
      'I like to read books, watching movies, and playing games.'
    ],
    answer: 'I like to read books, to watch movies, and to play games.',
    explanation: '所有并列的动词都使用不定式形式（to read, to watch, to play），保持了平行结构。'
  },
  {
    id: 'ps-2',
    ruleId: 'parallel-structure',
    type: 'fill-in-the-blank',
    question: 'The job requires ___ (analyzing/analysis) skills.',
    options: ['analyzing', 'analysis'],
    answer: 'analyzing',
    explanation: '应该使用动名词形式"analyzing"，保持与其他技能描述的一致性。'
  },
  
  // 代词指代清晰练习题
  {
    id: 'pc-1',
    ruleId: 'pronoun-clarity',
    type: 'multiple-choice',
    question: 'Which sentence has a clear pronoun reference?',
    options: [
      'When John told Tom that he was wrong, he became angry.',
      'When John told Tom that John was wrong, Tom became angry.',
      'When John told Tom that he was wrong, John became angry.',
      'When John told Tom that Tom was wrong, John became angry.'
    ],
    answer: 'When John told Tom that Tom was wrong, John became angry.',
    explanation: '明确指定了每个代词指代的对象，避免了歧义。'
  },
  {
    id: 'pc-2',
    ruleId: 'pronoun-clarity',
    type: 'fill-in-the-blank',
    question: 'Everyone should bring ___ (their/his or her) own lunch to the picnic.',
    options: ['their', 'his or her'],
    answer: 'his or her',
    explanation: '"Everyone"是单数不定代词，因此需要使用单数代词"his or her"而不是复数"their"。'
  },
  
  // 时态一致练习题
  {
    id: 'vtc-1',
    ruleId: 'verb-tense-consistency',
    type: 'multiple-choice',
    question: 'Which sentence demonstrates correct verb tense consistency?',
    options: [
      'Yesterday I went to the store and buy some milk.',
      'Yesterday I went to the store and bought some milk.',
      'Yesterday I go to the store and bought some milk.',
      'Yesterday I go to the store and buy some milk.'
    ],
    answer: 'Yesterday I went to the store and bought some milk.',
    explanation: '两个动词都使用过去时态，保持了时态一致性。'
  },
  {
    id: 'vtc-2',
    ruleId: 'verb-tense-consistency',
    type: 'fill-in-the-blank',
    question: 'He said that he ___ (was/is) tired.',
    options: ['was', 'is'],
    answer: 'was',
    explanation: '在间接引语中，当主句使用过去时态时，从句中的动词也应该使用过去时态。'
  },
  
  // 修饰语错位练习题
  {
    id: 'mm-1',
    ruleId: 'misplaced-modifiers',
    type: 'multiple-choice',
    question: 'Which sentence correctly places the modifier?',
    options: [
      'Walking down the street, the trees were beautiful.',
      'Walking down the street, I saw beautiful trees.',
      'The trees were beautiful walking down the street.',
      'I saw beautiful trees walking down the street.'
    ],
    answer: 'Walking down the street, I saw beautiful trees.',
    explanation: '分词短语"Walking down the street"有明确的主语"I"，避免了悬空修饰语。'
  },
  {
    id: 'mm-2',
    ruleId: 'misplaced-modifiers',
    type: 'fill-in-the-blank',
    question: 'I ___ (only/just) ate the apple, not the orange.',
    options: ['only', 'just'],
    answer: 'only',
    explanation: '"only"修饰"ate"，表示只做了吃这个动作，而不是其他动作。'
  }
]; 