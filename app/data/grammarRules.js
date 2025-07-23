// 语法规则数据结构 - 2024-12-19 14:30:25
// SSAT语法学习功能的核心数据定义

export const grammarRules = [
  {
    id: 'subject-verb-agreement',
    title: '主谓一致 (Subject-Verb Agreement)',
    explanation: `主谓一致是英语语法中最基本也是最重要的规则之一。主语和谓语动词必须在人称和数量上保持一致。

规则要点：
1. 单数主语 + 单数动词：The cat is sleeping.
2. 复数主语 + 复数动词：The cats are sleeping.
3. 第三人称单数现在时加 -s：He runs, She studies, It works.
4. 集体名词通常用单数：The team is winning.
5. 复合主语用复数：Tom and Jerry are friends.

常见错误：
- 忽略第三人称单数现在时的 -s
- 被介词短语干扰，误判主语数量
- 集体名词的用法混淆`,
    examples: [
      { 
        sentence: 'The students in the library are studying quietly.', 
        isCorrect: true,
        note: 'students是复数，所以用are'
      },
      { 
        sentence: 'The students in the library is studying quietly.', 
        isCorrect: false,
        note: 'students是复数，不能用is'
      },
      { 
        sentence: 'Each of the boys has completed his homework.', 
        isCorrect: true,
        note: 'Each是单数，所以用has'
      },
      { 
        sentence: 'Each of the boys have completed their homework.', 
        isCorrect: false,
        note: 'Each是单数，不能用have'
      }
    ]
  },
  {
    id: 'parallel-structure',
    title: '平行结构 (Parallel Structure)',
    explanation: `平行结构要求句子中相同语法功能的成分使用相同的语法形式。这使句子更加清晰、平衡和易于理解。

规则要点：
1. 并列的动词使用相同的形式：I like to read, to write, and to study.
2. 并列的名词短语保持结构一致：The book is interesting, informative, and well-written.
3. 并列的从句使用相同的引导词：I know that he is coming and that he will be late.
4. 比较结构中保持平行：She is more intelligent than she is beautiful.

常见错误：
- 混合不同的动词形式（不定式、动名词、过去式）
- 并列结构中语法形式不一致
- 比较结构中结构不对称`,
    examples: [
      { 
        sentence: 'I enjoy reading books, watching movies, and playing games.', 
        isCorrect: true,
        note: '三个动名词形式保持一致'
      },
      { 
        sentence: 'I enjoy reading books, to watch movies, and playing games.', 
        isCorrect: false,
        note: '混合了动名词和不定式'
      },
      { 
        sentence: 'The teacher asked us to study hard, to be on time, and to respect others.', 
        isCorrect: true,
        note: '三个不定式短语保持平行'
      },
      { 
        sentence: 'The teacher asked us to study hard, being on time, and to respect others.', 
        isCorrect: false,
        note: '混合了不定式和动名词'
      }
    ]
  },
  {
    id: 'pronoun-clarity',
    title: '代词指代清晰 (Pronoun Clarity)',
    explanation: `代词必须明确指代其先行词，避免歧义和混淆。这是确保句子清晰易懂的重要规则。

规则要点：
1. 代词必须有明确的先行词：John told Tom that he was wrong. (不清楚he指谁)
2. 避免代词指代不明确：The teacher told the student that he was late. (he可能指teacher或student)
3. 代词与先行词在数量上保持一致：Everyone should bring their book. (Everyone是单数，their是复数)
4. 避免悬空代词：In the book, it says... (it没有明确的先行词)

常见错误：
- 代词指代多个可能的先行词
- 代词与先行词数量不一致
- 使用悬空代词
- 代词指代整个句子或从句`,
    examples: [
      { 
        sentence: 'When Sarah met Lisa, she was happy to see her.', 
        isCorrect: false,
        note: 'she和her指代不明确'
      },
      { 
        sentence: 'When Sarah met Lisa, Sarah was happy to see Lisa.', 
        isCorrect: true,
        note: '明确指代，避免歧义'
      },
      { 
        sentence: 'Each student must submit their assignment by Friday.', 
        isCorrect: false,
        note: 'Each是单数，their是复数'
      },
      { 
        sentence: 'Each student must submit his or her assignment by Friday.', 
        isCorrect: true,
        note: '代词与先行词数量一致'
      }
    ]
  },
  {
    id: 'verb-tense-consistency',
    title: '时态一致 (Verb Tense Consistency)',
    explanation: `在同一个句子或段落中，动词时态应该保持一致，除非有明确的时间变化需要。

规则要点：
1. 在同一时间框架内保持时态一致：I went to the store and bought some milk.
2. 过去时态叙述中保持过去时：He said that he was tired and wanted to go home.
3. 现在时态叙述中保持现在时：The book explains how plants grow and reproduce.
4. 时间状语从句中时态配合：When I finish my homework, I will watch TV.

常见错误：
- 在同一句子中混合不同时态
- 间接引语中时态不一致
- 时间状语从句中时态配合错误`,
    examples: [
      { 
        sentence: 'Yesterday I went to the store and bought some groceries.', 
        isCorrect: true,
        note: '两个动词都使用过去时'
      },
      { 
        sentence: 'Yesterday I went to the store and buy some groceries.', 
        isCorrect: false,
        note: '混合了过去时和现在时'
      },
      { 
        sentence: 'He said that he was tired and wanted to rest.', 
        isCorrect: true,
        note: '间接引语中保持过去时'
      },
      { 
        sentence: 'He said that he is tired and wants to rest.', 
        isCorrect: false,
        note: '间接引语中时态不一致'
      }
    ]
  },
  {
    id: 'misplaced-modifiers',
    title: '修饰语错位 (Misplaced Modifiers)',
    explanation: `修饰语应该紧邻其修饰的词或短语，避免产生歧义或荒谬的含义。

规则要点：
1. 形容词紧邻被修饰的名词：I saw a red car. (不是 I saw a car red.)
2. 副词紧邻被修饰的动词：He quickly ran to the door. (不是 He ran quickly to the door.)
3. 介词短语紧邻被修饰的词：The book on the table is mine. (不是 The book is mine on the table.)
4. 避免悬空修饰语：Walking down the street, the trees were beautiful. (Walking没有明确的主语)

常见错误：
- 修饰语与被修饰词距离过远
- 悬空修饰语
- 修饰语位置产生歧义
- 修饰语修饰错误的词`,
    examples: [
      { 
        sentence: 'I only ate the apple.', 
        isCorrect: true,
        note: 'only修饰ate，表示只做了吃这个动作'
      },
      { 
        sentence: 'I ate only the apple.', 
        isCorrect: true,
        note: 'only修饰apple，表示只吃了苹果'
      },
      { 
        sentence: 'Walking down the street, the trees were beautiful.', 
        isCorrect: false,
        note: 'Walking没有明确的主语'
      },
      { 
        sentence: 'Walking down the street, I saw beautiful trees.', 
        isCorrect: true,
        note: 'Walking有明确的主语I'
      }
    ]
  }
]; 