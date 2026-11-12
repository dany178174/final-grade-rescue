import type { Ref } from 'react'
import { articleFor, formatPercent, TIER_MESSAGES, type Outcome, type TierId } from '../lib/grade'
import { TIER_STYLES } from '../lib/tierStyles'
import { WhyThisNumber } from './WhyThisNumber'

// Long numbers (e.g. "1,234.5%") step down in size so they never overflow a phone screen.
function numberSize(label: string): string {
  if (label.length <= 6) return 'text-6xl sm:text-7xl'
  if (label.length <= 8) return 'text-5xl sm:text-6xl'
  return 'text-4xl sm:text-5xl'
}

type ResultPanelProps = {
  outcome: Outcome
  ref?: Ref<HTMLDivElement>
}

export function ResultPanel({ outcome, ref }: ResultPanelProps) {
  return (
    <div ref={ref} aria-live="polite" aria-atomic="true" className="flex flex-1 scroll-mt-6 flex-col">
      {outcome.status === 'incomplete' ? <EmptyState hasErrors={outcome.hasErrors} /> : <Result {...outcome} />}
    </div>
  )
}

function EmptyState({ hasErrors }: { hasErrors: boolean }) {
  return (
    <div className="flex min-h-60 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
      <p aria-hidden className="text-6xl font-bold tracking-tight text-white/15">
        –%
      </p>
      <p className="mt-4 max-w-64 text-sm text-pretty text-white/55">
        {hasErrors
          ? 'Fix the highlighted field to see your result.'
          : 'Fill in all three fields to see what you need on the final.'}
      </p>
    </div>
  )
}

type ResultProps = { score: number; tier: TierId; current: number; desired: number; weight: number }

function Result({ score, tier, current, desired, weight }: ResultProps) {
  const shown = Math.max(0, score)
  const label = `${formatPercent(shown)}%`
  const styles = TIER_STYLES[tier]

  return (
    <div className="flex min-h-60 flex-1 flex-col justify-center rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
      <p className="text-base text-white/70">
        <span className="block">You need {articleFor(shown)}</span>{' '}
        <span
          className={`my-1 block font-bold tracking-tight tabular-nums transition-colors duration-300 [text-shadow:0_0_40px_color-mix(in_oklab,currentColor_45%,transparent)] ${numberSize(label)} ${styles.text}`}
        >
          {label}
        </span>{' '}
        <span className="block">on the final.</span>
      </p>

      <div aria-hidden className="mt-5">
        <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
          <div className="absolute inset-y-0 left-0 w-[80%] bg-emerald-400/15" />
          <div className="absolute inset-y-0 left-[80%] w-[15%] bg-yellow-300/15" />
          <div className="absolute inset-y-0 left-[95%] w-[5%] bg-orange-400/20" />
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-500 ease-out ${styles.fill}`}
            style={{ width: `${Math.min(shown, 100)}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-white/40 tabular-nums">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <p className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium text-pretty ${styles.message}`}>
        {TIER_MESSAGES[tier]}
      </p>

      <WhyThisNumber label={label} score={score} current={current} desired={desired} weight={weight} />
    </div>
  )
}
