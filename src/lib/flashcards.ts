export type Card = { term: string; definition: string }

export const CARD_COUNTS = [10, 20, 30] as const

export const EXAMPLE_DECK = [
  'Photosynthesis | The process plants use to turn light energy, water and carbon dioxide into glucose and oxygen.',
  'Chlorophyll | The green pigment in chloroplasts that absorbs light energy, mostly red and blue light.',
  'Chloroplast | The organelle where photosynthesis takes place.',
  'Light-dependent reactions | The first stage, in the thylakoid membranes. Uses light to make ATP and NADPH and releases oxygen.',
  'Calvin cycle | The second stage, in the stroma. Uses ATP and NADPH to turn carbon dioxide into sugar.',
  'Stomata | Tiny pores on leaves that let carbon dioxide in and oxygen and water vapor out.',
].join('\n')

export function flashcardPrompt({ topic, subject, count }: { topic: string; subject: string; count: number }): string {
  const what = topic || '[your topic]'
  const forWhat = subject ? `my ${subject} final exam` : 'my final exam'
  return [
    `Create ${count} flashcards to help me study ${what} for ${forWhat}.`,
    'Rules:',
    '- One flashcard per line, in exactly this format: term | definition',
    '- Keep every definition under 25 words, in simple English.',
    '- Cover the terms, formulas, people, dates and ideas most likely to be on the exam.',
    '- No numbering, no headings and no extra text before or after the list.',
  ].join('\n')
}

const MAX_CARDS = 300

/**
 * Turns pasted text into cards. Accepts "term | definition" lines, tab-separated
 * lines (copied from a spreadsheet or Quizlet export) and Markdown tables, and
 * ignores numbering, bullets and bold markers that chatbots like to add.
 */
export function parseCards(text: string): { cards: Card[]; skipped: number } {
  const cards: Card[] = []
  let skipped = 0

  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.trim()
    if (!line) continue

    if (line.startsWith('|') && line.endsWith('|') && line.length > 1) {
      line = line.slice(1, -1).trim()
      // Markdown table divider such as "---|---".
      if (/^[\s|:-]+$/.test(line)) continue
    }

    line = line
      .replace(/^(\d+[.)]|[-*•])\s+/, '')
      .replace(/\*\*|__/g, '')
      .trim()

    let sep = line.indexOf('|')
    if (sep === -1) sep = line.indexOf('\t')
    if (sep === -1) {
      skipped++
      continue
    }

    const term = line.slice(0, sep).trim()
    const definition = line
      .slice(sep + 1)
      .split(/\s*\|\s*|\t/)
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' — ')

    if (!term || !definition) {
      skipped++
      continue
    }
    if (term.toLowerCase() === 'term' && definition.toLowerCase().startsWith('definition')) continue

    cards.push({ term, definition })
    if (cards.length >= MAX_CARDS) break
  }

  return { cards, skipped }
}

const clean = (value: string) => value.replace(/[\t\r\n]+/g, ' ').trim()

/** Tab between term and definition, one card per line: Quizlet's default import format. */
export function toQuizletText(cards: Card[]): string {
  return cards.map((c) => `${clean(c.term)}\t${clean(c.definition)}`).join('\n')
}

export function toAnkiFile(cards: Card[]): string {
  return `#separator:tab\n#html:false\n${toQuizletText(cards)}\n`
}

export function fileNameFor(topic: string): string {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return `${slug || 'my'}-flashcards.txt`
}

export function quizletSearch(topic: string): string {
  return `https://quizlet.com/search?query=${encodeURIComponent(topic)}&type=sets`
}

export const QUIZLET_CREATE_URL = 'https://quizlet.com/create-set'
