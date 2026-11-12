import type { TierId } from '../lib/grade'

export type LearningStyle = 'video' | 'ai' | 'reading'

export const LEARNING_STYLES: Record<
  LearningStyle,
  { label: string; emoji: string; tagline: string; description: string }
> = {
  video: {
    label: 'Videos',
    emoji: '🎬',
    tagline: 'Watch & learn',
    description: 'The best teachers on YouTube, picked for your subject.',
  },
  ai: {
    label: 'AI tutor',
    emoji: '🤖',
    tagline: 'Chat & practice',
    description: 'Pro-level prompts for ChatGPT, Claude or Gemini.',
  },
  reading: {
    label: 'Reading',
    emoji: '📚',
    tagline: 'Read & review',
    description: 'Free textbooks, articles and study guides.',
  },
}

export const STYLE_ORDER: LearningStyle[] = ['video', 'ai', 'reading']

export function isLearningStyle(value: string | null): value is LearningStyle {
  return value === 'video' || value === 'ai' || value === 'reading'
}

export type DaysId = '1' | '2-3' | '4-7' | '8-14' | '15+'

export const DAY_OPTIONS: { id: DaysId; label: string; sub: string; promptWhen: string }[] = [
  { id: '1', label: 'Tomorrow', sub: 'Emergency mode', promptWhen: 'tomorrow' },
  { id: '2-3', label: '2–3 days', sub: 'Short sprint', promptWhen: 'in 2–3 days' },
  { id: '4-7', label: '4–7 days', sub: 'One solid week', promptWhen: 'in about a week' },
  { id: '8-14', label: '1–2 weeks', sub: 'Plenty of runway', promptWhen: 'in 1–2 weeks' },
  { id: '15+', label: '2+ weeks', sub: 'Ahead of the game', promptWhen: 'in 2+ weeks' },
]

export function getDayOption(id: string | null) {
  return DAY_OPTIONS.find((d) => d.id === id)
}

export type TierPlan = {
  mode: string
  emoji: string
  headline: string
  hours: string
  hoursForPrompt: string
  summary: string
  strategy: string[]
}

export const TIER_PLANS: Record<TierId, TierPlan> = {
  secured: {
    mode: 'Victory lap',
    emoji: '🏆',
    headline: "You're safe. Protect the lead.",
    hours: '30–45 min / day',
    hoursForPrompt: '30–45 minutes',
    summary:
      'Your grade is locked in as long as you show up. Do light review so nothing on the exam surprises you, then put your extra time into classes that need it more.',
    strategy: [
      'Skim your notes and the study guide once, start to finish.',
      'Take one practice test to make sure nothing surprises you.',
      'Confirm the exam time, room and what to bring. Missing the exam is the only real risk.',
      'Move the hours you save to the class where you need the most points.',
    ],
  },
  easy: {
    mode: 'Steady',
    emoji: '🌱',
    headline: 'Comfortable target. Stay consistent.',
    hours: '1–1.5 hrs / day',
    hoursForPrompt: '1–1.5 hours',
    summary:
      'You need a solid but very reachable score. Short daily sessions beat one long cram night, every time.',
    strategy: [
      'List every topic on the study guide and mark each one: know it, kinda, or no idea.',
      'Spend most of your time on the "kinda" and "no idea" topics.',
      'Turn definitions and formulas into flashcards and review them 10 minutes a day.',
      'Take one timed practice test two days before the exam.',
    ],
  },
  focus: {
    mode: 'Lock-in',
    emoji: '🎯',
    headline: 'Very doable, if you study on purpose.',
    hours: '2–3 hrs / day',
    hoursForPrompt: '2–3 hours',
    summary:
      "You need a strong score, so re-reading your notes won't cut it. Find your weak spots fast and drill them with active practice.",
    strategy: [
      'Start with a practice test to find your weak spots, not with re-reading.',
      'Rank topics by how much they are worth × how weak you are. Study in that order.',
      'Use active recall: close your notes and explain or solve from memory.',
      'Go to office hours or email your teacher 2–3 specific questions.',
      'Do at least two full timed practice exams before the real one.',
    ],
  },
  cram: {
    mode: 'Precision',
    emoji: '🔥',
    headline: 'Every single point matters.',
    hours: '3–4 hrs / day',
    hoursForPrompt: '3–4 hours',
    summary:
      "You need a near-perfect score, so careless mistakes are your biggest enemy. Master the high-value topics and practice like it's the real exam.",
    strategy: [
      'Ask your teacher exactly what the final covers and how it is graded.',
      'Master the highest-weight topics first. No topic gets skipped.',
      'Keep an error log: write down every mistake you make and why it happened.',
      'Take full timed practice exams under real conditions, then review every miss.',
      'Plan your exam strategy: easy questions first, and save 10 minutes to double-check.',
    ],
  },
  impossible: {
    mode: 'Damage control',
    emoji: '🛟',
    headline: "The math says no. Here's the smart move.",
    hours: '3–4 hrs / day',
    hoursForPrompt: '3–4 hours',
    summary:
      "Even a perfect final won't reach your target on its own. Talk to your teacher now, then aim for the best grade you can still get.",
    strategy: [
      'Email or visit your teacher this week. Ask about extra credit, retakes, dropped scores or a curve.',
      'Check for missing or low assignments you can still turn in or redo.',
      'Set a new, realistic target using the "Max grade possible" number above.',
      'Still study hard: every point on the final raises your grade.',
      'Ask how the final is weighted. Some classes let a strong final replace a low test score.',
    ],
  },
}

/** How each learning style turns into concrete actions in the schedule. */
export const STYLE_ACTIONS: Record<LearningStyle, { learn: string; review: string }> = {
  video: {
    learn:
      'Watch 2–3 short videos on your weakest topic at 1.25×. Pause before each worked example and try it yourself first.',
    review: 'Re-watch only the parts you got wrong, then redo those problems without the video.',
  },
  ai: {
    learn: 'Run the "Explain it simply" and "Quiz me" prompts on your weakest topic.',
    review: 'Paste your mistakes into the "Fix my mistakes" prompt and redo each problem.',
  },
  reading: {
    learn:
      'Read the textbook section on your weakest topic. After each section, close the book and summarize it in one sentence.',
    review: 'Re-read only your one-sentence summaries and answer the end-of-chapter review questions.',
  },
}

export type SchedulePhase = { when: string; title: string; tasks: string[] }

// {learn} and {review} are replaced with the learner's style actions.
export const SCHEDULES: Record<DaysId, SchedulePhase[]> = {
  '1': [
    {
      when: 'Hour 1',
      title: 'Triage',
      tasks: [
        'List every topic on the study guide.',
        'Circle the 3 topics that are worth the most points and that you know the least.',
        'Skip anything you already know cold. There is no time for it.',
      ],
    },
    {
      when: 'Hours 2–3',
      title: 'Learn your top 3',
      tasks: ['{learn}', 'After each topic, answer 3–5 practice questions from memory.'],
    },
    {
      when: 'Hour 4',
      title: 'Practice under pressure',
      tasks: ['Do a short timed set of mixed questions.', 'Check your answers and write down every mistake.'],
    },
    {
      when: 'Tonight',
      title: 'Lock it in',
      tasks: [
        '{review}',
        "Write a one-page cheat sheet. Even if you can't bring it, writing it helps you remember.",
        'Sleep 7–8 hours. Your brain stores what you learned while you sleep.',
      ],
    },
    {
      when: 'Exam morning',
      title: 'Warm up',
      tasks: ['Eat breakfast and drink water.', 'Read your cheat sheet once. No new material.'],
    },
  ],
  '2-3': [
    {
      when: 'Day 1',
      title: 'Diagnose + learn',
      tasks: [
        'Take a practice test or answer the review questions cold.',
        'Rank topics by how much they are worth × how weak you are.',
        '{learn}',
      ],
    },
    {
      when: 'Day 2',
      title: 'Practice',
      tasks: [
        'Do practice problems from all units, mixed together.',
        'Keep an error log of every question you miss.',
        '{review}',
      ],
    },
    {
      when: 'Exam eve',
      title: 'Final review',
      tasks: [
        'Take one timed practice exam.',
        'Review your error log and make a one-page cheat sheet.',
        'Sleep 8 hours. No all-nighters.',
      ],
    },
  ],
  '4-7': [
    {
      when: 'Day 1',
      title: 'Diagnose',
      tasks: [
        'Take a full practice test cold.',
        'Rank topics by how much they are worth × how weak you are.',
        'Assign each weak topic to a day.',
      ],
    },
    {
      when: 'Days 2–4',
      title: 'Learn & fill gaps',
      tasks: ['Cover one or two weak topics per day.', '{learn}', 'End each session with 10 minutes of flashcards.'],
    },
    {
      when: 'Days 5–6',
      title: "Practice like it's real",
      tasks: [
        'Do one full timed practice exam each day.',
        'Grade it, update your error log and redo every miss.',
        '{review}',
      ],
    },
    {
      when: 'Exam eve',
      title: 'Light review',
      tasks: [
        'Review only your cheat sheet and error log.',
        'Pack everything you need for the exam.',
        'Sleep 8 hours.',
      ],
    },
  ],
  '8-14': [
    {
      when: 'Days 1–2',
      title: 'Map it out',
      tasks: [
        'Collect the study guide, old tests and your notes.',
        'Take a diagnostic practice test.',
        'Build a checklist of every topic and rank it.',
      ],
    },
    {
      when: 'Days 3–8',
      title: 'Learn unit by unit',
      tasks: [
        'Cover one unit per day, weakest first.',
        '{learn}',
        'Make flashcards as you go and review them daily (spaced repetition).',
      ],
    },
    {
      when: 'Days 9–12',
      title: 'Mixed practice',
      tasks: [
        'Answer practice questions from all units, mixed together.',
        'Take two full timed practice exams a few days apart.',
        '{review}',
      ],
    },
    {
      when: 'Last 2 days',
      title: 'Polish',
      tasks: [
        'Review only your error log and flashcards.',
        'Ask your teacher any last questions.',
        'Sleep well both nights.',
      ],
    },
  ],
  '15+': [
    {
      when: 'Week 1',
      title: 'Foundation',
      tasks: [
        'Take a diagnostic practice test.',
        'Re-learn the earliest units first. Later units build on them.',
        '{learn}',
      ],
    },
    {
      when: 'Week 2',
      title: 'Go deeper',
      tasks: [
        'Cover the remaining units, weakest first.',
        'Review flashcards for 15 minutes every day.',
        'Do a mixed practice set every other day.',
      ],
    },
    {
      when: 'Week 3',
      title: 'Exam mode',
      tasks: [
        'Take two or three full timed practice exams.',
        '{review}',
        'Last 2 days: light review and plenty of sleep.',
      ],
    },
  ],
}

export const STYLE_TIPS: Record<LearningStyle, { title: string; tips: string[] }> = {
  video: {
    title: 'How to learn from videos (not just watch them)',
    tips: [
      'Play at 1.25–1.5× and pause often. Speed is fine, zoning out is not.',
      'Before the teacher solves an example, pause and try it yourself.',
      'After each video, close it and write down everything you remember.',
      'Follow every video with 3–5 practice problems. Watching is not the same as doing.',
    ],
  },
  ai: {
    title: 'Rules for studying with AI',
    tips: [
      'Paste your real study guide or notes. AI is only as good as the context you give it.',
      'Ask for one step or one question at a time, so you have to think.',
      'Make it quiz you. Answering questions beats reading explanations.',
      'Double-check formulas and facts against your notes. AI can be confidently wrong.',
    ],
  },
  reading: {
    title: 'Read smarter with SQ3R',
    tips: [
      'Survey: skim headings, bold words and the chapter summary first.',
      'Question: turn each heading into a question you want answered.',
      'Read: read one section at a time, looking for the answer.',
      'Recite & Review: close the book, answer from memory, then check.',
    ],
  },
}

export const HABITS: { emoji: string; title: string; text: string }[] = [
  {
    emoji: '🧠',
    title: 'Active recall',
    text: 'Test yourself instead of re-reading. Pulling information out of your memory is what makes it stick.',
  },
  {
    emoji: '📅',
    title: 'Spaced repetition',
    text: 'Review a little every day instead of all at once. Flashcard apps can schedule this for you.',
  },
  {
    emoji: '🔀',
    title: 'Mix it up',
    text: 'Practice different problem types in one session, just like the real exam will.',
  },
  {
    emoji: '⏱️',
    title: '25 on, 5 off',
    text: 'Study in focused 25-minute blocks with 5-minute breaks. Put your phone in another room.',
  },
  {
    emoji: '😴',
    title: 'Protect your sleep',
    text: 'Sleep 7–9 hours. An all-nighter costs you more points than it earns.',
  },
]
