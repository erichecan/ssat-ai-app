# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start the development server on localhost:3000
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

Note: Tests are not currently configured (`npm test` will fail).

## Project Architecture

This is a Next.js 15 application for SSAT/SAT test preparation with the following architecture:

### Core Technologies
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand (stores/ directory - currently empty)
- **UI Components**: Radix UI primitives + custom components in components/ui/
- **Animations**: Framer Motion

### Database Structure
The app uses Supabase with these key tables:
- `users` - User profiles extending auth.users
- `questions` - SSAT/SAT questions with types: vocabulary, reading, math, writing
- `user_sessions` - Practice/test/flashcard sessions
- `user_answers` - Individual question responses
- `achievements` - Gamification badges and rewards
- `user_achievements` - User's earned achievements
- `study_plans` - Personalized learning paths
- `flashcards` - Spaced repetition flashcards

### Key Features
- **AI-Generated Questions**: Designed to integrate with GPT-4/Gemini
- **Gamification**: Points, levels, achievements, leaderboards
- **Progressive Web App**: PWA support with offline capabilities
- **Adaptive Learning**: Difficulty adjustment based on performance
- **Spaced Repetition**: Flashcard system with review scheduling

### Page Structure
- `/` - Dashboard with progress and recommendations
- `/flashcard` - Interactive flashcard learning
- `/test` - Practice tests with timer
- `/test/results` - Test results and analytics
- `/leaderboard` - Social competition features
- `/profile` - User stats and settings

### Environment Setup
Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side)

Database setup requires running the SQL schema in `docs/database-setup.md`.

### Design System
The application follows a consistent design system based on 21st.dev principles:

**Color Palette:**
- Primary: Blue gradient (`bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800`)
- Backgrounds: Gray-50 (`bg-gray-50`) with white cards (`bg-white`)
- Text: Gray-900 for primary text, Gray-600 for secondary text
- Accent colors: Green for success, Red for errors, Yellow for warnings

**Typography:**
- Font: Lexend (primary), Inter (fallback)
- Headings: `text-[22px] font-bold leading-tight tracking-tight`
- Body: `text-base font-normal leading-normal`
- Small text: `text-sm font-medium leading-normal`

**Layout Patterns:**
- Mobile-first responsive design
- Consistent padding: `p-4` for page content, `px-4` for horizontal spacing
- Card styling: `rounded-xl border border-gray-300 bg-white`
- Button variants: `bg-primary-500 text-white` (primary), `bg-gray-200 text-gray-900` (secondary)

**Components:**
- Hero195: Main hero component in `components/ui/hero-195-1.tsx`
- Card system: `components/ui/card.tsx`
- Progress bars: `.progress-bar` and `.progress-fill` classes
- Radio options: `.radio-option` class with hover states

**Common CSS Classes:**
- `.btn-primary` and `.btn-secondary` for buttons
- `.card` for card containers
- `.input` for form inputs
- `.radio-option` for radio button styling
- `.progress-bar` and `.progress-fill` for progress indicators

### Database Schema Reference
Complete database table structure for development reference:

**Core Tables:**
- `flashcards` - Main vocabulary/question storage with complete fields:
  - Core: id, type, subject, difficulty_level, question, answer, explanation
  - Vocabulary: word, definition, pronunciation, part_of_speech, example_sentence
  - Learning: synonyms, antonyms, etymology, memory_tip, tags
  - Metadata: user_id, source_type, source_context, frequency_score, usage_count
- `users` - User profiles extending auth.users
- `questions` - SSAT/SAT questions with types: vocabulary, reading, math, writing
- `user_sessions` - Practice/test/flashcard sessions
- `user_answers` - Individual question responses with detailed tracking
- `achievements` - Gamification badges and rewards
- `user_achievements` - User's earned achievements
- `mistake_questions` - Spaced repetition for incorrect answers
- `ai_conversations` - AI tutor interaction history
- `knowledge_base` - RAG content storage with PDF processing

**Advanced Tables:**
- `user_flashcard_progress` - Spaced repetition progress tracking
- `test_sessions` & `test_question_attempts` - Comprehensive test tracking
- `study_plans` & `study_plan_items` - Personalized learning paths
- `rag_sessions` - RAG query and response logging
- `document_chunks` & `vector_embeddings` - Content chunking and vector storage

**Key Constraints:**
- RLS enabled on all tables
- Unique constraint on flashcards(word, user_id)
- Foreign key relationships maintain data integrity
- Demo user UUID: '00000000-0000-0000-0000-000000000001'

### Development Notes
- The app uses TypeScript with strict types defined in `types/database.ts`
- Supabase client is configured in `lib/supabase.ts` with auth persistence
- Use `getSupabaseAdmin()` for server-side operations that bypass RLS
- Component library uses Radix UI with custom styling
- The project includes reference HTML designs in `quizlet-design-html/`
- No state management stores are currently implemented (stores/ is empty)
- Playwright testing configured in `.playwright/playwright.config.ts`
- All pages follow consistent mobile-first layout with bottom navigation
- Uses Heroicons for consistent iconography across all pages