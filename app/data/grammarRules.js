// Grammar Rules Data Structure - 2024-12-19 16:00:00
// Core data definition for SSAT grammar learning functionality

export const grammarRules = [
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