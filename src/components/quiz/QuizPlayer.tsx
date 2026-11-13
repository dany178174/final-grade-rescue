import { useState } from 'react'
import type { Question } from '../../lib/quiz'
import { primaryButton, secondaryButton } from '../../lib/ui'
import { ResetIcon } from '../icons'
import type { QuizLabels } from './quizLabels'

const LETTERS = ['A', 'B', 'C', 'D', 'E']
const range = (n: number) => Array.from({ length: n }, (_, i) => i)

export function QuizPlayer({ questions, labels }: { questions: Question[]; labels: QuizLabels }) {
  const [order, setOrder] = useState(() => range(questions.length))
  const [position, setPosition] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [wrong, setWrong] = useState<number[]>([])

  const finished = position >= order.length
  const question = finished ? undefined : questions[order[position]]
  const correctCount = Math.min(position, order.length) - wrong.length

  const pick = (index: number) => {
    if (picked !== null || !question) return
    setPicked(index)
    if (index !== question.answer) setWrong((w) => [...w, order[position]])
  }

  const next = () => {
    setPicked(null)
    setPosition((p) => p + 1)
  }

  const restart = (indices: number[]) => {
    setOrder(indices)
    setPosition(0)
    setPicked(null)
    setWrong([])
  }

  if (!question) {
    const total = order.length
    const score = total - wrong.length
    return (
      <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-center">
        <p aria-hidden className="text-4xl">
          {wrong.length === 0 ? '🏆' : '💪'}
        </p>
        <p className="mt-3 text-2xl font-bold tabular-nums">{labels.score(score, total)}</p>
        <p className="mt-1 text-sm text-white/60">{wrong.length === 0 ? labels.perfect : labels.keepGoing}</p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          {wrong.length > 0 && (
            <button type="button" onClick={() => restart(wrong)} className={primaryButton}>
              {labels.retryWrong(wrong.length)}
            </button>
          )}
          <button type="button" onClick={() => restart(range(questions.length))} className={secondaryButton}>
            <ResetIcon className="size-4" />
            {labels.restart}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-white/55">
        <span className="tabular-nums">{labels.progress(position + 1, order.length)}</span>
        <span className="text-emerald-300 tabular-nums">✓ {Math.max(0, correctCount)}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div
          className="h-full rounded-full bg-accent-400 transition-[width] duration-300"
          style={{ width: `${(position / order.length) * 100}%` }}
        />
      </div>

      <p className="rounded-2xl border border-white/10 bg-[#161a3d] p-5 text-lg leading-snug font-semibold text-pretty">{question.q}</p>

      <ul className="mt-3 grid gap-2">
        {question.options.map((option, i) => {
          const isAnswer = i === question.answer
          const state =
            picked === null
              ? 'border-white/12 bg-white/[0.05] hover:border-white/25 hover:bg-white/[0.08]'
              : isAnswer
                ? 'border-emerald-300/60 bg-emerald-400/15 text-emerald-100'
                : i === picked
                  ? 'border-red-400/60 bg-red-400/15 text-red-100'
                  : 'border-white/10 bg-white/[0.03] opacity-60'
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(i)}
                disabled={picked !== null}
                className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition focus-visible:ring-4 focus-visible:ring-accent-500/25 focus-visible:outline-none ${state}`}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-white/10 text-xs font-bold">{LETTERS[i]}</span>
                <span className="pt-0.5 text-pretty">{option}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {picked !== null && (
        <div className="mt-4" aria-live="polite">
          <p className={`text-sm font-medium ${picked === question.answer ? 'text-emerald-300' : 'text-red-300'}`}>
            {picked === question.answer ? labels.correct : labels.wrong(question.options[question.answer])}
          </p>
          <button type="button" onClick={next} className={`${primaryButton} mt-3 w-full`}>
            {position + 1 < order.length ? labels.next : labels.seeResult}
          </button>
        </div>
      )}
    </div>
  )
}
