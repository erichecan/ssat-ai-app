// Flashcard vocabulary bank for SSAT practice
export interface Flashcard {
  id: string
  word: string
  definition: string
  pronunciation?: string
  part_of_speech: string
  difficulty: 'easy' | 'medium' | 'hard'
  example_sentence: string
  synonyms: string[]
  antonyms: string[]
  etymology?: string
  memory_tip?: string
  category: string
  frequency_score: number // How common the word is (1-10)
  created_at: string
  updated_at: string
}

export const flashcards: Flashcard[] = [
  {
    id: 'fc_001',
    word: 'Aberrant',
    definition: 'Departing from an accepted standard; deviating from the normal type',
    pronunciation: '/ˈæbərənt/',
    part_of_speech: 'adjective',
    difficulty: 'hard',
    example_sentence: 'The scientist noted the aberrant behavior of the test subjects.',
    synonyms: ['abnormal', 'deviant', 'irregular', 'atypical'],
    antonyms: ['normal', 'typical', 'standard', 'conventional'],
    etymology: 'From Latin aberrare, meaning "to go astray"',
    memory_tip: 'The student\'s aberrant behavior during the exam surprised everyone.',
    category: 'Academic Vocabulary',
    frequency_score: 6,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fc_002',
    word: 'Benevolent',
    definition: 'Well meaning and kindly; showing compassion or goodwill',
    pronunciation: '/bəˈnevələnt/',
    part_of_speech: 'adjective',
    difficulty: 'medium',
    example_sentence: 'The benevolent king was loved by all his subjects.',
    synonyms: ['kind', 'charitable', 'generous', 'compassionate'],
    antonyms: ['malevolent', 'cruel', 'mean', 'harsh'],
    etymology: 'From Latin bene (well) + volens (wishing)',
    memory_tip: 'The benevolent teacher always helped struggling students after class.',
    category: 'Character Traits',
    frequency_score: 7,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fc_003',
    word: 'Candid',
    definition: 'Truthful and straightforward; frank and honest',
    pronunciation: '/ˈkændɪd/',
    part_of_speech: 'adjective',
    difficulty: 'medium',
    example_sentence: 'She gave a candid assessment of the project\'s chances.',
    synonyms: ['honest', 'frank', 'direct', 'straightforward'],
    antonyms: ['dishonest', 'evasive', 'deceptive', 'indirect'],
    etymology: 'From Latin candidus meaning "white, pure"',
    memory_tip: 'I appreciate your candid opinion about my presentation.',
    category: 'Character Traits',
    frequency_score: 8,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fc_004',
    word: 'Desolate',
    definition: 'Feeling or showing great unhappiness; empty and lifeless',
    pronunciation: '/ˈdesələt/',
    part_of_speech: 'adjective',
    difficulty: 'medium',
    example_sentence: 'The abandoned house stood desolate on the hill.',
    synonyms: ['barren', 'bleak', 'forsaken', 'deserted'],
    antonyms: ['populated', 'lively', 'inhabited', 'cheerful'],
    etymology: 'From Latin desolatus meaning "abandoned"',
    memory_tip: 'The desolate landscape stretched endlessly without any signs of life.',
    category: 'Descriptive',
    frequency_score: 6,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fc_005',
    word: 'Elaborate',
    definition: 'Involving many carefully arranged parts; detailed and complicated',
    pronunciation: '/ɪˈlæbərət/',
    part_of_speech: 'adjective',
    difficulty: 'easy',
    example_sentence: 'The wedding had an elaborate reception with multiple courses.',
    synonyms: ['detailed', 'complex', 'intricate', 'ornate'],
    antonyms: ['simple', 'plain', 'basic', 'modest'],
    etymology: 'From Latin elaboratus meaning "worked out"',
    memory_tip: 'The architect created an elaborate design with intricate details.',
    category: 'Descriptive',
    frequency_score: 9,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fc_006',
    word: 'Fortuitous',
    definition: 'Happening by accident or chance; lucky or fortunate',
    pronunciation: '/fɔrˈtuɪtəs/',
    part_of_speech: 'adjective',
    difficulty: 'hard',
    example_sentence: 'It was fortuitous that they met at the coffee shop that day.',
    synonyms: ['accidental', 'chance', 'lucky', 'serendipitous'],
    antonyms: ['planned', 'deliberate', 'intentional', 'unlucky'],
    etymology: 'From Latin fortuitus meaning "happening by chance"',
    memory_tip: 'Meeting my future business partner at that coffee shop was quite fortuitous.',
    category: 'Academic Vocabulary',
    frequency_score: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fc_007',
    word: 'Gregarious',
    definition: 'Fond of the company of others; sociable',
    pronunciation: '/ɡrɪˈɡeriəs/',
    part_of_speech: 'adjective',
    difficulty: 'hard',
    example_sentence: 'Her gregarious nature made her popular at parties.',
    synonyms: ['sociable', 'outgoing', 'social', 'extroverted'],
    antonyms: ['antisocial', 'introverted', 'shy', 'solitary'],
    etymology: 'From Latin gregarius meaning "belonging to a flock"',
    memory_tip: 'Sarah\'s gregarious personality made her the life of every party.',
    category: 'Character Traits',
    frequency_score: 6,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fc_008',
    word: 'Haughty',
    definition: 'Arrogantly superior and disdainful; proud and condescending',
    pronunciation: '/ˈhɔti/',
    part_of_speech: 'adjective',
    difficulty: 'medium',
    example_sentence: 'The haughty duchess barely acknowledged the servants.',
    synonyms: ['arrogant', 'proud', 'condescending', 'superior'],
    antonyms: ['humble', 'modest', 'respectful', 'down-to-earth'],
    etymology: 'From Old French haut meaning "high"',
    memory_tip: 'The haughty celebrity refused to sign autographs for fans.',
    category: 'Character Traits',
    frequency_score: 7,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fc_009',
    word: 'Immutable',
    definition: 'Unchanging over time or unable to be changed',
    pronunciation: '/ɪˈmjutəbəl/',
    part_of_speech: 'adjective',
    difficulty: 'hard',
    example_sentence: 'The laws of physics are considered immutable.',
    synonyms: ['unchangeable', 'permanent', 'fixed', 'constant'],
    antonyms: ['changeable', 'variable', 'mutable', 'flexible'],
    etymology: 'From Latin immutabilis meaning "not changeable"',
    memory_tip: 'Scientists believe the speed of light is an immutable constant.',
    category: 'Academic Vocabulary',
    frequency_score: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fc_010',
    word: 'Jubilant',
    definition: 'Feeling or expressing great happiness and triumph',
    pronunciation: '/ˈdʒubɪlənt/',
    part_of_speech: 'adjective',
    difficulty: 'medium',
    example_sentence: 'The team was jubilant after winning the championship.',
    synonyms: ['joyful', 'elated', 'ecstatic', 'triumphant'],
    antonyms: ['dejected', 'sad', 'disappointed', 'melancholy'],
    etymology: 'From Latin jubilare meaning "to shout for joy"',
    memory_tip: 'The jubilant crowd cheered as their team scored the winning goal.',
    category: 'Emotions',
    frequency_score: 7,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fc_011',
    word: 'Kinetic',
    definition: 'Relating to or resulting from motion',
    pronunciation: '/kɪˈnetɪk/',
    part_of_speech: 'adjective',
    difficulty: 'medium',
    example_sentence: 'The kinetic energy of the moving car increased with speed.',
    synonyms: ['dynamic', 'moving', 'active', 'energetic'],
    antonyms: ['static', 'motionless', 'still', 'inactive'],
    etymology: 'From Greek kinetikos meaning "of motion"',
    memory_tip: 'The kinetic sculpture moved gracefully in the gentle breeze.',
    category: 'Science',
    frequency_score: 8,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fc_012',
    word: 'Lucid',
    definition: 'Expressed clearly; easy to understand; clear-thinking',
    pronunciation: '/ˈlusɪd/',
    part_of_speech: 'adjective',
    difficulty: 'medium',
    example_sentence: 'Despite her age, grandmother remained lucid and sharp.',
    synonyms: ['clear', 'coherent', 'rational', 'intelligible'],
    antonyms: ['confused', 'unclear', 'muddled', 'incoherent'],
    etymology: 'From Latin lucidus meaning "bright, clear"',
    memory_tip: 'Despite his illness, grandfather remained lucid and could recall everything.',
    category: 'Mental States',
    frequency_score: 7,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fc_013',
    word: 'Magnanimous',
    definition: 'Very generous or forgiving, especially toward a rival or less powerful person',
    pronunciation: '/mæɡˈnænɪməs/',
    part_of_speech: 'adjective',
    difficulty: 'hard',
    example_sentence: 'In a magnanimous gesture, she forgave her competitor.',
    synonyms: ['generous', 'forgiving', 'noble', 'big-hearted'],
    antonyms: ['petty', 'mean', 'vindictive', 'small-minded'],
    etymology: 'From Latin magnus (great) + animus (soul)',
    memory_tip: 'In a magnanimous gesture, the winner congratulated his opponent.',
    category: 'Character Traits',
    frequency_score: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fc_014',
    word: 'Nonchalant',
    definition: 'Feeling or appearing casually calm and relaxed; not displaying anxiety',
    pronunciation: '/ˌnɒnʃəˈlɑnt/',
    part_of_speech: 'adjective',
    difficulty: 'medium',
    example_sentence: 'He remained nonchalant despite the chaos around him.',
    synonyms: ['casual', 'relaxed', 'unconcerned', 'indifferent'],
    antonyms: ['anxious', 'worried', 'concerned', 'agitated'],
    etymology: 'From French nonchaloir meaning "to be unconcerned"',
    memory_tip: 'Despite the emergency, the pilot remained nonchalant and calm.',
    category: 'Character Traits',
    frequency_score: 6,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fc_015',
    word: 'Obsolete',
    definition: 'No longer produced or used; out of date',
    pronunciation: '/ˈɒbsəlit/',
    part_of_speech: 'adjective',
    difficulty: 'easy',
    example_sentence: 'Typewriters became obsolete with the rise of computers.',
    synonyms: ['outdated', 'antiquated', 'defunct', 'archaic'],
    antonyms: ['modern', 'current', 'up-to-date', 'contemporary'],
    etymology: 'From Latin obsoletus meaning "worn out"',
    memory_tip: 'The old computer system became obsolete when new technology arrived.',
    category: 'Time and Change',
    frequency_score: 8,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Utility functions for flashcard management
export function getFlashcardsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Flashcard[] {
  return flashcards.filter(card => card.difficulty === difficulty);
}

export function getFlashcardsByCategory(category: string): Flashcard[] {
  return flashcards.filter(card => card.category === category);
}

export function searchFlashcards(query: string): Flashcard[] {
  const lowerQuery = query.toLowerCase();
  return flashcards.filter(card => 
    card.word.toLowerCase().includes(lowerQuery) ||
    card.definition.toLowerCase().includes(lowerQuery) ||
    card.synonyms.some(synonym => synonym.toLowerCase().includes(lowerQuery)) ||
    card.category.toLowerCase().includes(lowerQuery)
  );
}

export function getRandomFlashcards(count: number): Flashcard[] {
  const shuffled = [...flashcards].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function getFlashcardCategories(): string[] {
  const categories = new Set(flashcards.map(card => card.category));
  return Array.from(categories);
}

export function getFlashcardStats() {
  const total = flashcards.length;
  const byDifficulty = {
    easy: getFlashcardsByDifficulty('easy').length,
    medium: getFlashcardsByDifficulty('medium').length,
    hard: getFlashcardsByDifficulty('hard').length
  };
  const byCategory = getFlashcardCategories().reduce((acc, category) => {
    acc[category] = getFlashcardsByCategory(category).length;
    return acc;
  }, {} as Record<string, number>);

  return {
    total,
    byDifficulty,
    byCategory
  };
}