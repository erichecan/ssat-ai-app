import { generateEmbedding } from '../lib/gemini'
import { upsertKnowledge, KnowledgeRecord } from '../lib/pinecone'
import { supabase } from '../lib/supabase'

// Sample knowledge base entries for SSAT/SAT preparation
const knowledgeEntries = [
  {
    title: "Vocabulary: Context Clues Strategy",
    content: "When encountering unfamiliar words, look for context clues in surrounding sentences. Types include: definition clues (word is defined), example clues (examples are given), contrast clues (opposite meaning), and inference clues (meaning implied). Practice identifying these clues to improve vocabulary comprehension.",
    topic: "vocabulary",
    difficulty: "medium" as const,
    type: "strategy" as const,
    tags: ["context-clues", "vocabulary-strategy", "reading-comprehension"],
    source: "SSAT Official Guide"
  },
  {
    title: "Reading: Main Idea Identification",
    content: "To find the main idea: 1) Look for topic sentences (usually first or last sentence of paragraph), 2) Identify recurring themes, 3) Ask 'What is the author's primary purpose?', 4) Distinguish between main idea and supporting details. The main idea is the central message the author wants to convey.",
    topic: "reading",
    difficulty: "medium" as const,
    type: "strategy" as const,
    tags: ["main-idea", "reading-strategy", "comprehension"],
    source: "SAT Reading Guide"
  },
  {
    title: "Math: Linear Equations Fundamentals",
    content: "Linear equations form straight lines when graphed. Standard form: Ax + By = C. Slope-intercept form: y = mx + b (m = slope, b = y-intercept). Point-slope form: y - y₁ = m(x - x₁). To solve: isolate variable using inverse operations. Common mistakes: forgetting to distribute negative signs, not maintaining equation balance.",
    topic: "math",
    difficulty: "medium" as const,
    type: "concept" as const,
    tags: ["linear-equations", "algebra", "graphing"],
    source: "SSAT Math Review"
  },
  {
    title: "Writing: Sentence Structure",
    content: "Complete sentences need subject and predicate. Common errors: run-on sentences (join with semicolon, period, or conjunction), sentence fragments (add missing subject/verb), comma splices (don't join independent clauses with comma alone). Use varied sentence structures for better writing flow.",
    topic: "writing",
    difficulty: "medium" as const,
    type: "concept" as const,
    tags: ["sentence-structure", "grammar", "writing-mechanics"],
    source: "SAT Writing Guide"
  },
  {
    title: "Vocabulary: Common Root Words",
    content: "Learning root words helps decode unfamiliar vocabulary. Examples: 'bene' (good/well) → benefit, benevolent; 'mal' (bad) → malicious, malfunction; 'port' (carry) → transport, portable; 'dict' (speak) → dictate, predict. Memorize common roots, prefixes, and suffixes for vocabulary expansion.",
    topic: "vocabulary",
    difficulty: "easy" as const,
    type: "concept" as const,
    tags: ["root-words", "vocabulary-building", "word-parts"],
    source: "Vocabulary Builder"
  },
  {
    title: "Reading: Inference Questions",
    content: "Inference questions ask what can be concluded from the passage. Strategy: 1) Find relevant text sections, 2) Look for implied meanings, 3) Use logical reasoning, 4) Avoid extreme answers, 5) Stay close to the text. Don't make assumptions beyond what's supported by evidence.",
    topic: "reading",
    difficulty: "hard" as const,
    type: "strategy" as const,
    tags: ["inference", "reading-comprehension", "critical-thinking"],
    source: "SAT Reading Strategies"
  },
  {
    title: "Math: Quadratic Equations",
    content: "Quadratic equations: ax² + bx + c = 0. Solving methods: 1) Factoring (find two numbers that multiply to 'ac' and add to 'b'), 2) Quadratic formula: x = (-b ± √(b²-4ac))/2a, 3) Completing the square. Discriminant (b²-4ac) determines number of solutions: positive (2 real), zero (1 real), negative (no real solutions).",
    topic: "math",
    difficulty: "hard" as const,
    type: "concept" as const,
    tags: ["quadratic-equations", "algebra", "factoring"],
    source: "SSAT Math Advanced"
  },
  {
    title: "Writing: Parallel Structure",
    content: "Parallel structure means using same grammatical form for similar elements. Correct: 'I like reading, writing, and swimming.' Incorrect: 'I like reading, writing, and to swim.' Apply to: items in lists, comparisons, paired ideas (both...and, either...or, not only...but also). Maintains clarity and rhythm in writing.",
    topic: "writing",
    difficulty: "medium" as const,
    type: "concept" as const,
    tags: ["parallel-structure", "grammar", "writing-style"],
    source: "SAT Writing Rules"
  },
  {
    title: "Test-Taking: Time Management",
    content: "Effective time management strategy: 1) Preview entire section first, 2) Answer easy questions first, 3) Mark difficult questions for later, 4) Don't spend too long on one question, 5) Leave time for review. For SSAT: aim for 1 minute per question. For SAT: varies by section but practice pacing.",
    topic: "strategy",
    difficulty: "easy" as const,
    type: "strategy" as const,
    tags: ["time-management", "test-strategy", "pacing"],
    source: "Test Prep Guide"
  },
  {
    title: "Common Mistake: Misreading Questions",
    content: "Students often misread questions due to test anxiety or rushing. Prevention: 1) Read questions twice, 2) Underline key words (NOT, EXCEPT, MOST), 3) Pay attention to qualifiers (always, never, sometimes), 4) Check if asking for best answer or all correct answers. Take time to understand what's being asked.",
    topic: "strategy",
    difficulty: "easy" as const,
    type: "common_mistake" as const,
    tags: ["question-comprehension", "test-strategy", "reading-carefully"],
    source: "Common Test Mistakes"
  }
]

async function initializeKnowledgeBase() {
  console.log('Starting knowledge base initialization...')
  
  try {
    // Process each knowledge entry
    for (const entry of knowledgeEntries) {
      console.log(`Processing: ${entry.title}`)
      
      // Generate embedding
      const embedding = await generateEmbedding(entry.content)
      
      // Insert into Supabase
      const { data: supabaseEntry, error: supabaseError } = await supabase
        .from('knowledge_base')
        .insert({
          title: entry.title,
          content: entry.content,
          topic: entry.topic,
          difficulty: entry.difficulty,
          type: entry.type,
          tags: entry.tags,
          source: entry.source
        })
        .select()
        .single()
      
      if (supabaseError) {
        console.error('Supabase error:', supabaseError)
        continue
      }
      
      // Prepare for Pinecone
      const vectorRecord: KnowledgeRecord = {
        id: supabaseEntry.id,
        values: embedding,
        metadata: {
          content: entry.content,
          topic: entry.topic,
          difficulty: entry.difficulty,
          type: entry.type,
          tags: entry.tags
        }
      }
      
      // Insert into Pinecone
      await upsertKnowledge([vectorRecord])
      
      // Update Supabase with vector ID
      await supabase
        .from('knowledge_base')
        .update({ vector_id: supabaseEntry.id })
        .eq('id', supabaseEntry.id)
      
      console.log(`✓ Successfully processed: ${entry.title}`)
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log('Knowledge base initialization completed!')
  } catch (error) {
    console.error('Error initializing knowledge base:', error)
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  initializeKnowledgeBase()
}

export { initializeKnowledgeBase }