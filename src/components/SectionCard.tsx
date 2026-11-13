import type { ReactNode } from 'react'

type Props = {
  /** Numbered step (wizards and multi-step pages). */
  step?: number
  /** Emoji shown in a tile when there is no step number. */
  emoji?: string
  title: string
  sub?: string
  /** Controls placed on the right of the heading. */
  aside?: ReactNode
  className?: string
  children: ReactNode
}

/** The card every page section uses: an icon or step tile, a title, a short line under it. */
export function SectionCard({ step, emoji, title, sub, aside, className = '', children }: Props) {
  return (
    <section className={`glass-card p-5 sm:p-7 ${className}`}>
      <div className="flex flex-wrap items-start gap-x-3.5 gap-y-3">
        {step !== undefined ? (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-accent-300/25 bg-accent-500/15 text-sm font-bold text-accent-200 tabular-nums">
            {step}
          </span>
        ) : (
          emoji && (
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-lg">
              {emoji}
            </span>
          )
        )}
        <div className="min-w-0 flex-1 basis-48 pt-0.5">
          <h2 className="text-lg leading-snug font-semibold tracking-tight text-balance sm:text-xl">{title}</h2>
          {sub && <p className="mt-0.5 text-sm text-pretty text-white/55">{sub}</p>}
        </div>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}
