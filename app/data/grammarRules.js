// Grammar Rules Data Structure - 2024-12-19 16:30:00
// Core data definition for SSAT grammar learning functionality

export const grammarRules = [
  // Basic Grammar Concepts - For Beginners
  {
    id: 'parts-of-speech',
    title: 'Parts of Speech',
    explanation: `Parts of speech are the basic building blocks of English grammar. Understanding these fundamental categories helps you construct and analyze sentences correctly.

Key Parts of Speech:
1. Nouns: Words that name people, places, things, or ideas (cat, school, happiness)
2. Verbs: Words that express actions, states, or occurrences (run, is, think)
3. Adjectives: Words that describe or modify nouns (big, red, beautiful)
4. Adverbs: Words that describe or modify verbs, adjectives, or other adverbs (quickly, very, well)
5. Pronouns: Words that replace nouns (he, she, it, they)
6. Prepositions: Words that show relationships between words (in, on, at, with)
7. Conjunctions: Words that connect words, phrases, or clauses (and, but, or, because)
8. Interjections: Words that express emotion (wow, oh, hey)

Common Mistakes:
- Confusing adjectives with adverbs
- Using wrong pronouns
- Misplacing prepositions`,
    examples: [
      { 
        sentence: 'The beautiful cat runs quickly.', 
        isCorrect: true,
        note: 'beautiful (adjective) describes cat (noun), quickly (adverb) describes runs (verb)'
      },
      { 
        sentence: 'The cat beautiful runs quick.', 
        isCorrect: false,
        note: 'Adjective beautiful should come before noun cat, and quick should be quickly (adverb)'
      },
      { 
        sentence: 'She gave the book to him.', 
        isCorrect: true,
        note: 'She (pronoun), gave (verb), book (noun), to (preposition), him (pronoun)'
      },
      { 
        sentence: 'Her gave the book to he.', 
        isCorrect: false,
        note: 'Her should be She (subject pronoun), he should be him (object pronoun)'
      }
    ]
  },
  {
    id: 'nouns',
    title: 'Nouns',
    explanation: `Nouns are words that name people, places, things, or ideas. They are essential building blocks of sentences and can function as subjects, objects, or complements.

Types of Nouns:
1. Common Nouns: General names (dog, city, book)
2. Proper Nouns: Specific names (John, London, Harry Potter)
3. Concrete Nouns: Things you can see, touch, hear, smell, or taste (table, music, flower)
4. Abstract Nouns: Ideas, feelings, or concepts (love, freedom, happiness)
5. Collective Nouns: Groups of people or things (team, family, flock)
6. Countable Nouns: Can be counted (apple, car, idea)
7. Uncountable Nouns: Cannot be counted (water, air, information)

Common Mistakes:
- Forgetting to capitalize proper nouns
- Using singular verbs with plural nouns
- Confusing countable and uncountable nouns`,
    examples: [
      { 
        sentence: 'The students in the library are studying quietly.', 
        isCorrect: true,
        note: 'students (countable noun, plural), library (common noun), studying (verb)'
      },
      { 
        sentence: 'The student in the library is studying quietly.', 
        isCorrect: true,
        note: 'student (countable noun, singular), is (singular verb)'
      },
      { 
        sentence: 'The informations are helpful.', 
        isCorrect: false,
        note: 'information is uncountable, should be "The information is helpful"'
      },
      { 
        sentence: 'I love paris and london.', 
        isCorrect: false,
        note: 'Paris and London are proper nouns and should be capitalized'
      }
    ]
  },
  {
    id: 'verbs',
    title: 'Verbs',
    explanation: `Verbs are words that express actions, states, or occurrences. They are the heart of a sentence and show what the subject is doing or what is happening.

Types of Verbs:
1. Action Verbs: Show physical or mental actions (run, think, write)
2. Linking Verbs: Connect subject to description (is, are, was, become, seem)
3. Helping Verbs: Help main verbs (have, has, had, will, would, can, could)
4. Regular Verbs: Follow standard conjugation patterns (walk/walked/walked)
5. Irregular Verbs: Have unique conjugation patterns (go/went/gone)

Verb Tenses:
- Present: I walk, I am walking
- Past: I walked, I was walking
- Future: I will walk, I will be walking

Common Mistakes:
- Using wrong verb forms
- Confusing action and linking verbs
- Incorrect tense usage`,
    examples: [
      { 
        sentence: 'She runs every morning and feels energetic.', 
        isCorrect: true,
        note: 'runs (action verb), feels (linking verb)'
      },
      { 
        sentence: 'She run every morning and feel energetic.', 
        isCorrect: false,
        note: 'Should be runs (third person singular) and feels'
      },
      { 
        sentence: 'The cake tastes delicious.', 
        isCorrect: true,
        note: 'tastes is a linking verb connecting cake to delicious'
      },
      { 
        sentence: 'I have went to the store.', 
        isCorrect: false,
        note: 'Should be "I have gone" (past participle of irregular verb go)'
      }
    ]
  },
  {
    id: 'pronouns',
    title: 'Pronouns',
    explanation: `Pronouns are words that replace nouns to avoid repetition and make sentences flow better. They must agree with their antecedents in number, gender, and person.

Types of Pronouns:
1. Personal Pronouns: I, you, he, she, it, we, they
2. Possessive Pronouns: mine, yours, his, hers, its, ours, theirs
3. Reflexive Pronouns: myself, yourself, himself, herself, itself, ourselves, themselves
4. Demonstrative Pronouns: this, that, these, those
5. Interrogative Pronouns: who, what, which, whose, whom
6. Relative Pronouns: who, which, that, whose, whom
7. Indefinite Pronouns: everyone, someone, anybody, nothing, all, some

Common Mistakes:
- Using wrong case (I vs me, he vs him)
- Confusing possessive pronouns with contractions (its vs it's)
- Unclear pronoun references`,
    examples: [
      { 
        sentence: 'John gave the book to me, and I thanked him.', 
        isCorrect: true,
        note: 'me (object pronoun), I (subject pronoun), him (object pronoun)'
      },
      { 
        sentence: 'John gave the book to I, and me thanked he.', 
        isCorrect: false,
        note: 'Should be "to me" (object) and "I thanked him" (subject + object)'
      },
      { 
        sentence: 'The dog wagged its tail.', 
        isCorrect: true,
        note: 'its (possessive pronoun), not it\'s (contraction of it is)'
      },
      { 
        sentence: 'Everyone should bring their own lunch.', 
        isCorrect: false,
        note: 'Everyone is singular, should be "his or her own lunch" or "their own lunch" (modern usage)'
      }
    ]
  },
  {
    id: 'adjectives-adverbs',
    title: 'Adjectives and Adverbs',
    explanation: `Adjectives and adverbs are descriptive words that add detail and clarity to sentences. Adjectives modify nouns and pronouns, while adverbs modify verbs, adjectives, and other adverbs.

Adjectives:
- Describe or modify nouns and pronouns
- Answer questions: What kind? Which one? How many?
- Examples: big, red, beautiful, three, this

Adverbs:
- Modify verbs, adjectives, and other adverbs
- Answer questions: How? When? Where? Why? To what extent?
- Often end in -ly (but not always)
- Examples: quickly, very, here, now, well

Common Mistakes:
- Using adjectives instead of adverbs
- Confusing good/well, bad/badly
- Misplacing modifiers`,
    examples: [
      { 
        sentence: 'The beautiful flower grows quickly in the garden.', 
        isCorrect: true,
        note: 'beautiful (adjective) describes flower, quickly (adverb) describes grows'
      },
      { 
        sentence: 'The flower beautiful grows quick in the garden.', 
        isCorrect: false,
        note: 'beautiful should come before flower, quick should be quickly'
      },
      { 
        sentence: 'She is a good singer and sings well.', 
        isCorrect: true,
        note: 'good (adjective) describes singer, well (adverb) describes sings'
      },
      { 
        sentence: 'She is a well singer and sings good.', 
        isCorrect: false,
        note: 'Should be "good singer" and "sings well"'
      }
    ]
  },
  {
    id: 'prepositions',
    title: 'Prepositions',
    explanation: `Prepositions are words that show relationships between other words in a sentence. They indicate location, direction, time, manner, and other relationships.

Common Prepositions:
1. Location: in, on, at, under, over, beside, between, among
2. Direction: to, from, toward, into, out of, through, across
3. Time: at, in, on, before, after, during, since, until
4. Manner: by, with, without, like, as
5. Purpose: for, to, in order to

Prepositional Phrases:
- A preposition + its object (noun or pronoun)
- Can function as adjectives or adverbs
- Examples: in the house, with my friends, at 3 o'clock

Common Mistakes:
- Using wrong prepositions
- Ending sentences with prepositions (sometimes acceptable)
- Confusing similar prepositions (in/on/at)`,
    examples: [
      { 
        sentence: 'The book is on the table in the library.', 
        isCorrect: true,
        note: 'on (location), in (location)'
      },
      { 
        sentence: 'The book is at the table on the library.', 
        isCorrect: false,
        note: 'Should be "on the table" and "in the library"'
      },
      { 
        sentence: 'I will meet you at 3 o\'clock on Monday.', 
        isCorrect: true,
        note: 'at (specific time), on (day)'
      },
      { 
        sentence: 'I will meet you in 3 o\'clock in Monday.', 
        isCorrect: false,
        note: 'Should be "at 3 o\'clock" and "on Monday"'
      }
    ]
  },
  // Advanced Grammar Rules - For SSAT Level
  {
    id: 'subject-verb-agreement',
    title: 'Subject-Verb Agreement',
    explanation: `Subject-verb agreement is one of the most fundamental and important rules in English grammar. The subject and verb must agree in person and number.

Key Rules:
1. Singular subject + singular verb: The cat is sleeping.
2. Plural subject + plural verb: The cats are sleeping.
3. Third person singular present tense adds -s: He runs, She studies, It works.
4. Collective nouns usually take singular: The team is winning.
5. Compound subjects take plural: Tom and Jerry are friends.

Common Mistakes:
- Forgetting the -s for third person singular present tense
- Being confused by prepositional phrases when determining subject number
- Confusion with collective noun usage`,
    examples: [
      { 
        sentence: 'The students in the library are studying quietly.', 
        isCorrect: true,
        note: 'students is plural, so we use are'
      },
      { 
        sentence: 'The students in the library is studying quietly.', 
        isCorrect: false,
        note: 'students is plural, cannot use is'
      },
      { 
        sentence: 'Each of the boys has completed his homework.', 
        isCorrect: true,
        note: 'Each is singular, so we use has'
      },
      { 
        sentence: 'Each of the boys have completed their homework.', 
        isCorrect: false,
        note: 'Each is singular, cannot use have'
      }
    ]
  },
  {
    id: 'parallel-structure',
    title: 'Parallel Structure',
    explanation: `Parallel structure requires that elements with the same grammatical function in a sentence use the same grammatical form. This makes sentences clearer, more balanced, and easier to understand.

Key Rules:
1. Parallel verbs use the same form: I like to read, to write, and to study.
2. Parallel noun phrases maintain consistent structure: The book is interesting, informative, and well-written.
3. Parallel clauses use the same conjunctions: I know that he is coming and that he will be late.
4. Comparison structures maintain parallelism: She is more intelligent than she is beautiful.

Common Mistakes:
- Mixing different verb forms (infinitives, gerunds, past tense)
- Inconsistent grammatical forms in parallel structures
- Asymmetric structures in comparisons`,
    examples: [
      { 
        sentence: 'I enjoy reading books, watching movies, and playing games.', 
        isCorrect: true,
        note: 'All three gerund forms are consistent'
      },
      { 
        sentence: 'I enjoy reading books, to watch movies, and playing games.', 
        isCorrect: false,
        note: 'Mixed gerunds and infinitives'
      },
      { 
        sentence: 'The teacher asked us to study hard, to be on time, and to respect others.', 
        isCorrect: true,
        note: 'All three infinitive phrases are parallel'
      },
      { 
        sentence: 'The teacher asked us to study hard, being on time, and to respect others.', 
        isCorrect: false,
        note: 'Mixed infinitives and gerunds'
      }
    ]
  },
  {
    id: 'pronoun-clarity',
    title: 'Pronoun Clarity',
    explanation: `Pronouns must clearly refer to their antecedents, avoiding ambiguity and confusion. This is an important rule for ensuring clear and understandable sentences.

Key Rules:
1. Pronouns must have clear antecedents: John told Tom that he was wrong. (unclear who he refers to)
2. Avoid ambiguous pronoun references: The teacher told the student that he was late. (he could refer to teacher or student)
3. Pronouns must agree in number with their antecedents: Everyone should bring their book. (Everyone is singular, their is plural)
4. Avoid dangling pronouns: In the book, it says... (it has no clear antecedent)

Common Mistakes:
- Pronouns referring to multiple possible antecedents
- Pronouns not agreeing in number with antecedents
- Using dangling pronouns
- Pronouns referring to entire sentences or clauses`,
    examples: [
      { 
        sentence: 'When Sarah met Lisa, she was happy to see her.', 
        isCorrect: false,
        note: 'Unclear who she refers to'
      },
      { 
        sentence: 'When Sarah met Lisa, Sarah was happy to see Lisa.', 
        isCorrect: true,
        note: 'Clear reference to each person'
      },
      { 
        sentence: 'Everyone should bring their own lunch to the picnic.', 
        isCorrect: false,
        note: 'Everyone is singular, their is plural'
      },
      { 
        sentence: 'Everyone should bring his or her own lunch to the picnic.', 
        isCorrect: true,
        note: 'Singular pronoun matches singular antecedent'
      }
    ]
  },
  {
    id: 'verb-tense-consistency',
    title: 'Verb Tense Consistency',
    explanation: `Verb tense consistency ensures that the time relationships in a sentence are clear and logical. This rule helps maintain coherence and prevents confusion about when events occur.

Key Rules:
1. Use consistent tenses within a sentence: Yesterday I went to the store and bought some milk.
2. Maintain logical time relationships: I will go to the store when I finish my homework.
3. Use appropriate tense shifts for reported speech: He said that he was tired.
4. Be consistent with narrative time frames: The story begins in 1990 and continues until 2020.

Common Mistakes:
- Shifting tenses unnecessarily within a sentence
- Incorrect tense usage in reported speech
- Inconsistent narrative time frames
- Confusing present perfect with simple past`,
    examples: [
      { 
        sentence: 'Yesterday I went to the store and bought some milk.', 
        isCorrect: true,
        note: 'Both verbs in past tense'
      },
      { 
        sentence: 'Yesterday I went to the store and buy some milk.', 
        isCorrect: false,
        note: 'Mixed past and present tense'
      },
      { 
        sentence: 'He said that he was tired.', 
        isCorrect: true,
        note: 'Past tense in reported speech'
      },
      { 
        sentence: 'He said that he is tired.', 
        isCorrect: false,
        note: 'Incorrect tense in reported speech'
      }
    ]
  },
  {
    id: 'misplaced-modifiers',
    title: 'Misplaced Modifiers',
    explanation: `Misplaced modifiers are words, phrases, or clauses that are positioned incorrectly in a sentence, creating confusion about what they modify. Proper placement ensures clear and accurate meaning.

Key Rules:
1. Place modifiers close to the words they modify: Walking down the street, I saw beautiful trees.
2. Avoid dangling modifiers: Walking down the street, the trees were beautiful. (Who was walking?)
3. Be careful with only, just, almost, nearly: I only ate the apple, not the orange.
4. Ensure clear relationships between modifiers and their targets.

Common Mistakes:
- Dangling participles and infinitives
- Misplaced only, just, almost, nearly
- Ambiguous modifier placement
- Modifiers that seem to modify the wrong word`,
    examples: [
      { 
        sentence: 'Walking down the street, I saw beautiful trees.', 
        isCorrect: true,
        note: 'Clear subject for the participle phrase'
      },
      { 
        sentence: 'Walking down the street, the trees were beautiful.', 
        isCorrect: false,
        note: 'Dangling participle - trees cannot walk'
      },
      { 
        sentence: 'I only ate the apple, not the orange.', 
        isCorrect: true,
        note: 'Only clearly modifies ate'
      },
      { 
        sentence: 'I ate only the apple, not the orange.', 
        isCorrect: true,
        note: 'Only clearly modifies the apple'
      }
    ]
  }
]; 