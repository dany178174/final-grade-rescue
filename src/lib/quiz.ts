import type { Card } from './flashcards'
import type { CellValue } from './xlsx'

export type Question = { q: string; options: string[]; answer: number }

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Turns a flashcard deck into multiple-choice questions with no AI needed:
 * show the definition, pick the right term out of four from the same deck.
 */
export function quizFromCards(cards: Card[], limit = 20): Question[] {
  const unique = cards.filter((c, i) => cards.findIndex((d) => d.term.toLowerCase() === c.term.toLowerCase()) === i)
  if (unique.length < 4) return []
  return shuffle(unique)
    .slice(0, limit)
    .map((card) => {
      const distractors = shuffle(unique.filter((c) => c !== card))
        .slice(0, 3)
        .map((c) => c.term)
      const options = shuffle([card.term, ...distractors])
      return { q: card.definition, options, answer: options.indexOf(card.term) }
    })
}

/**
 * Reads AI output in the form "question | A | B | C | D | correct", where the
 * last field is a letter (A–E), a number (1–5) or the text of the right option.
 */
export function parseQuestions(text: string): { questions: Question[]; skipped: number } {
  const questions: Question[] = []
  let skipped = 0
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.trim()
    if (!line) continue
    if (line.startsWith('|') && line.endsWith('|')) {
      line = line.slice(1, -1).trim()
      if (/^[\s|:-]+$/.test(line)) continue
    }
    line = line.replace(/^(câu\s*\d+[.:)]?|question\s*\d+[.:)]?|\d+[.)])\s*/i, '').replace(/\*\*|__/g, '').trim()
    const parts = line.split('|').map((p) => p.trim())
    if (parts.length < 4) {
      skipped++
      continue
    }
    const q = parts[0]
    const options = parts.slice(1, -1).map((o) => o.replace(/^[A-Ea-e][.)]\s+/, '').trim()).filter(Boolean).slice(0, 5)
    const key = parts[parts.length - 1].replace(/^(đáp án|answer|correct)\s*[:：]?\s*/i, '').trim()
    if (/^(câu hỏi|question)$/i.test(q)) continue
    let answer = -1
    if (/^[A-Ea-e]$/.test(key)) answer = key.toUpperCase().charCodeAt(0) - 65
    else if (/^[1-5]$/.test(key)) answer = Number(key) - 1
    else answer = options.findIndex((o) => o.toLowerCase() === key.toLowerCase())
    if (!q || options.length < 2 || answer < 0 || answer >= options.length) {
      skipped++
      continue
    }
    questions.push({ q, options, answer })
    if (questions.length >= 100) break
  }
  return { questions, skipped }
}

export function quizPrompt({ topic, subject, count, lang }: { topic: string; subject: string; count: number; lang: 'en' | 'vi' }): string {
  if (lang === 'vi') {
    const what = topic || '[chủ đề của bạn]'
    return [
      `Soạn ${count} câu hỏi trắc nghiệm bằng tiếng Việt để mình ôn ${what}${subject ? ` môn ${subject}` : ''}.`,
      'Yêu cầu:',
      '- Mỗi câu một dòng, đúng định dạng: câu hỏi | đáp án A | đáp án B | đáp án C | đáp án D | chữ cái đáp án đúng',
      '- Chỉ một đáp án đúng; các đáp án sai phải hợp lí, dễ nhầm.',
      '- Bám sát SGK và đề kiểm tra, độ khó tăng dần.',
      '- Không đánh số, không tiêu đề, không viết thêm gì khác.',
      'Ví dụ: Thủ đô của Việt Nam là thành phố nào? | Huế | Hà Nội | Đà Nẵng | Cần Thơ | B',
    ].join('\n')
  }
  const what = topic || '[your topic]'
  return [
    `Write ${count} multiple-choice questions to help me study ${what}${subject ? ` for my ${subject} final` : ''}.`,
    'Rules:',
    '- One question per line, in exactly this format: question | option A | option B | option C | option D | letter of the correct option',
    '- Exactly one correct option; wrong options should be plausible.',
    '- Match real exam difficulty, getting harder as you go.',
    '- No numbering, no headings and no extra text.',
    'Example: What is the powerhouse of the cell? | Nucleus | Mitochondria | Ribosome | Golgi body | B',
  ].join('\n')
}

/** Rows for Wayground's (formerly Quizizz) "import from spreadsheet" template. */
export function toWaygroundRows(questions: Question[]): CellValue[][] {
  const header = ['Question Text', 'Question Type', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Correct Answer', 'Time in seconds', 'Image Link']
  return [
    header,
    ...questions.map((q) => {
      const options = [...q.options, '', '', '', '', ''].slice(0, 5)
      return [q.q, 'Multiple Choice', ...options, q.answer + 1, 30, '']
    }),
  ]
}

export const WAYGROUND_URL = 'https://wayground.com/'
