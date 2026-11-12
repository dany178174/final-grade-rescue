import type { ReactNode } from 'react'
import { courseGradeWith, formatPercent } from '../lib/grade'

type WhyProps = { label: string; score: number; current: number; desired: number; weight: number }

const n = (value: number) => formatPercent(value)

function Step({ index, title, math }: { index: number; title: ReactNode; math: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white/80">
        {index}
      </span>
      <span className="min-w-0">
        <span className="block text-white/75">{title}</span>
        <span className="mt-1 block font-medium text-white tabular-nums">{math}</span>
      </span>
    </li>
  )
}

/** Walks through the formula with the student's own numbers, so the result feels trustworthy. */
export function WhyThisNumber({ label, score, current, desired, weight }: WhyProps) {
  const w = weight / 100
  const rest = 1 - w
  const banked = current * rest
  const needed = desired - banked
  const ifTarget = courseGradeWith(current, weight, desired)
  const maxGrade = courseGradeWith(current, weight, 100)

  let steps: ReactNode
  let insight: ReactNode

  if (weight === 100) {
    steps = (
      <Step
        index={1}
        title="The final is your whole grade, so whatever you score on it is your final grade."
        math={<>You need {n(desired)}% on the final.</>}
      />
    )
    insight = null
  } else {
    steps = (
      <>
        <Step
          index={1}
          title={
            <>
              Your current grade counts for <strong className="text-white">{n(100 - weight)}%</strong> of the class.
            </>
          }
          math={
            <>
              {n(current)} × {n(rest)} = {n(banked)} points
            </>
          }
        />
        {needed > 0 ? (
          <>
            <Step
              index={2}
              title={<>Points still needed to finish at {n(desired)}%:</>}
              math={
                <>
                  {n(desired)} − {n(banked)} = {n(needed)} points
                </>
              }
            />
            <Step
              index={3}
              title={
                <>
                  The final is worth <strong className="text-white">{n(weight)}%</strong>, so divide by {n(w)}:
                </>
              }
              math={
                <>
                  {n(needed)} ÷ {n(w)} = {n(score)}% on the final
                </>
              }
            />
          </>
        ) : (
          <Step
            index={2}
            title={<>That's already at or above the {n(desired)} points you need.</>}
            math={<>Even 0% on the final leaves you at {n(banked)}%.</>}
          />
        )}
      </>
    )

    if (needed <= 0) {
      insight = "Your grade is safe on paper, but still take the exam: skipping a final can mean an incomplete or a failing grade."
    } else if (score > 100) {
      insight = (
        <>
          That's more than 100%, so the final alone can't get you there. A perfect score would bring you to{' '}
          <strong className="text-white">{n(maxGrade)}%</strong>.
        </>
      )
    } else if (current < desired) {
      insight = (
        <>
          <strong className="text-white">Why more than {n(desired)}%?</strong> Your current {n(current)}% is below
          your target and makes up {n(100 - weight)}% of your grade, so the final has to score above{' '}
          {n(desired)}% to pull your average up. Scoring exactly {n(desired)}% would leave you at{' '}
          <strong className="text-white">{n(ifTarget)}%</strong>.
        </>
      )
    } else if (current > desired) {
      insight = (
        <>
          <strong className="text-white">Why less than {n(desired)}%?</strong> Your current {n(current)}% is already
          above your target, so it gives you a cushion. Scoring exactly {n(desired)}% would put you at{' '}
          <strong className="text-white">{n(ifTarget)}%</strong>.
        </>
      )
    } else {
      insight = 'Your current grade already matches your target, so you just need to match it on the final.'
    }
  }

  return (
    <details className="group mt-3 text-left">
      <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-white/60 transition hover:text-white focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        Why {label}?
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 transition group-open:rotate-180"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">
        <ol className="space-y-3">{steps}</ol>
        {insight && (
          <p className="mt-4 border-t border-white/10 pt-3 text-pretty text-white/70">
            <span aria-hidden>💡 </span>
            {insight}
          </p>
        )}
      </div>
    </details>
  )
}
