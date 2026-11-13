export type QuizLabels = {
  progress: (position: number, total: number) => string
  correct: string
  wrong: (answer: string) => string
  next: string
  seeResult: string
  score: (correct: number, total: number) => string
  perfect: string
  keepGoing: string
  retryWrong: (count: number) => string
  restart: string
}

export const EN_QUIZ_LABELS: QuizLabels = {
  progress: (position, total) => `Question ${position} of ${total}`,
  correct: 'Correct! 🎉',
  wrong: (answer) => `Not quite. The answer is: ${answer}`,
  next: 'Next question',
  seeResult: 'See my score',
  score: (correct, total) => `${correct}/${total} correct`,
  perfect: 'Perfect score. You know this cold.',
  keepGoing: 'Redo the ones you missed. Mistakes are where the learning happens.',
  retryWrong: (count) => `Retry the ${count} I missed`,
  restart: 'Start over',
}

export const VI_QUIZ_LABELS: QuizLabels = {
  progress: (position, total) => `Câu ${position}/${total}`,
  correct: 'Chính xác! 🎉',
  wrong: (answer) => `Chưa đúng. Đáp án là: ${answer}`,
  next: 'Câu tiếp theo',
  seeResult: 'Xem kết quả',
  score: (correct, total) => `Đúng ${correct}/${total} câu`,
  perfect: 'Tuyệt đối! Bạn nắm rất chắc phần này.',
  keepGoing: 'Làm lại những câu sai. Câu sai chính là chỗ bạn học được nhiều nhất.',
  retryWrong: (count) => `Làm lại ${count} câu sai`,
  restart: 'Làm lại từ đầu',
}
