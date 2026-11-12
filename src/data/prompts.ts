export type PromptContext = {
  subject: string
  topic: string
  /** A full sentence about the score needed, e.g. "I need an 88% on it." */
  goal: string
  /** When the exam is, e.g. "tomorrow" or "in about a week". */
  when: string
  hours: string
}

export const PROMPT_FORMULA: { part: string; example: string; why: string }[] = [
  {
    part: 'Role',
    example: 'You are a patient AP Biology tutor.',
    why: 'Sets the level and the tone of the answers.',
  },
  {
    part: 'Goal',
    example: 'I need a 93% on my final in 5 days.',
    why: 'Tells the AI what success looks like for you.',
  },
  {
    part: 'Context',
    example: "I'm weak at cellular respiration. Here are my notes: …",
    why: 'Specific details get you specific help.',
  },
  {
    part: 'Format',
    example: 'Explain in 5 bullet points, then quiz me with 3 questions, one at a time.',
    why: 'Controls the length and keeps you actively thinking.',
  },
]

export const BAD_PROMPT = 'explain photosynthesis'

export const GOOD_PROMPT =
  "You are a patient AP Biology tutor. I need a 93% on my final in 5 days and I'm weak at photosynthesis. Explain the light reactions and the Calvin cycle in 5 bullet points, then quiz me with 3 questions, one at a time. Wait for my answer before moving on."

export const AI_TOOLS: { name: string; url: string }[] = [
  { name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { name: 'Claude', url: 'https://claude.ai/new' },
  { name: 'Gemini', url: 'https://gemini.google.com/app' },
]

export type PromptTemplate = { id: string; title: string; when: string; text: string }

export function buildPromptTemplates(ctx: PromptContext): PromptTemplate[] {
  const { subject, topic, goal, when, hours } = ctx
  return [
    {
      id: 'diagnose',
      title: 'Find my weak spots',
      when: 'Start here',
      text: `You are an expert ${subject} tutor. My final exam is ${when}. ${goal} Ask me 10 quick questions covering the main topics of a typical ${subject} final, one at a time. After I answer all 10, tell me my 3 weakest topics and what to study first.`,
    },
    {
      id: 'explain',
      title: 'Explain it simply',
      when: 'Learning something new',
      text: `Explain ${topic} for my ${subject} class like I'm smart but new to it. Start with a simple analogy, then the proper definition, then one worked example. Keep it under 250 words. End by asking me one question to check that I understood.`,
    },
    {
      id: 'quiz',
      title: 'Quiz me',
      when: 'Every study session',
      text: `Quiz me on ${topic} for my ${subject} final. Ask one question at a time and wait for my answer. Mix multiple-choice and short-answer, and make them gradually harder. If I'm wrong, give me a hint before showing the answer. Keep score.`,
    },
    {
      id: 'plan',
      title: 'Build my study plan',
      when: 'Planning your week',
      text: `Build me a study plan for my ${subject} final, which is ${when}. ${goal} I can study about ${hours} per day. My weakest topic is ${topic}. Use active recall, spaced repetition and practice tests. Format it as a day-by-day checklist.`,
    },
    {
      id: 'exam',
      title: 'Practice exam',
      when: 'A few days before',
      text: `Write a 15-question practice exam for ${subject} at final-exam level, covering ${topic} and the other core topics. Don't show any answers until I say "grade me". Then grade my answers and explain every mistake.`,
    },
    {
      id: 'fix',
      title: 'Fix my mistakes',
      when: 'After practice',
      text: `Here is a ${subject} question I got wrong and my work: [paste it here]. Don't just give me the answer. Find the exact step where I went wrong, explain why, and give me a similar question to try again.`,
    },
  ]
}

export function fillTopic(text: string, topic: string): string {
  return text.replaceAll('{topic}', topic)
}
