export type DeckLabels = {
  done: string
  card: (position: number, total: number) => string
  term: string
  definition: string
  tapHint: string
  showDefinition: (term: string) => string
  showTerm: (definition: string) => string
  stillLearning: string
  gotIt: string
  prev: string
  next: string
  prevAria: string
  nextAria: string
  shuffle: string
  summary: (known: number, total: number) => string
  allKnown: string
  goAgain: (missed: number) => string
  studyMissed: (missed: number) => string
  startOver: string
}

export const EN_DECK_LABELS: DeckLabels = {
  done: 'Done!',
  card: (position, total) => `Card ${position} of ${total}`,
  term: 'Term',
  definition: 'Definition',
  tapHint: 'Tap or press space to flip',
  showDefinition: (term) => `Term: ${term}. Tap to show the definition.`,
  showTerm: (definition) => `Definition: ${definition}. Tap to show the term.`,
  stillLearning: '↻ Still learning',
  gotIt: '✓ Got it',
  prev: 'Prev',
  next: 'Next',
  prevAria: 'Previous card',
  nextAria: 'Next card',
  shuffle: '🔀 Shuffle',
  summary: (known, total) => `You know ${known} of ${total} cards`,
  allKnown: 'Every card marked as known. Come back tomorrow to lock it in.',
  goAgain: (missed) => `Go again on the ${missed} you're still learning. Repetition is what makes them stick.`,
  studyMissed: (missed) => `Study the ${missed} I missed`,
  startOver: 'Start over',
}

export const VI_DECK_LABELS: DeckLabels = {
  done: 'Xong!',
  card: (position, total) => `Thẻ ${position}/${total}`,
  term: 'Thuật ngữ',
  definition: 'Định nghĩa',
  tapHint: 'Chạm hoặc nhấn phím cách để lật',
  showDefinition: (term) => `Thuật ngữ: ${term}. Chạm để xem định nghĩa.`,
  showTerm: (definition) => `Định nghĩa: ${definition}. Chạm để xem thuật ngữ.`,
  stillLearning: '↻ Chưa thuộc',
  gotIt: '✓ Đã thuộc',
  prev: 'Trước',
  next: 'Sau',
  prevAria: 'Thẻ trước',
  nextAria: 'Thẻ sau',
  shuffle: '🔀 Trộn thẻ',
  summary: (known, total) => `Bạn đã thuộc ${known}/${total} thẻ`,
  allKnown: 'Bạn đã thuộc hết. Mai ôn lại một lần nữa để nhớ lâu.',
  goAgain: (missed) => `Ôn lại ${missed} thẻ chưa thuộc. Lặp lại là cách để nhớ.`,
  studyMissed: (missed) => `Ôn lại ${missed} thẻ chưa thuộc`,
  startOver: 'Làm lại từ đầu',
}
