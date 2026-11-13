import { useCallback, useEffect, useState } from 'react'
import type { Card } from '../../lib/flashcards'
import { EN_DECK_LABELS, type DeckLabels } from './deckLabels'
import { primaryButton, secondaryButton, smallButton } from '../../lib/ui'
import { ArrowLeftIcon, ArrowRightIcon, ResetIcon } from '../icons'

function shuffled(indices: number[]): number[] {
  const out = [...indices]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

export function StudyDeck({ cards, labels = EN_DECK_LABELS }: { cards: Card[]; labels?: DeckLabels }) {
  const [order, setOrder] = useState<number[]>(() => range(cards.length))
  const [position, setPosition] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<number>>(() => new Set())
  const [learning, setLearning] = useState<Set<number>>(() => new Set())

  const finished = position >= order.length
  const cardIndex = order[position]
  const card = finished ? undefined : cards[cardIndex]

  const goTo = useCallback(
    (next: number) => {
      setFlipped(false)
      setPosition(Math.max(0, Math.min(next, order.length)))
    },
    [order.length],
  )

  const mark = useCallback(
    (gotIt: boolean) => {
      if (cardIndex === undefined) return
      setKnown((prev) => {
        const next = new Set(prev)
        if (gotIt) next.add(cardIndex)
        else next.delete(cardIndex)
        return next
      })
      setLearning((prev) => {
        const next = new Set(prev)
        if (gotIt) next.delete(cardIndex)
        else next.add(cardIndex)
        return next
      })
      goTo(position + 1)
    },
    [cardIndex, goTo, position],
  )

  const restart = (indices: number[]) => {
    setOrder(indices)
    setKnown(new Set())
    setLearning(new Set())
    setFlipped(false)
    setPosition(0)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (finished || target?.closest('input, textarea, select, dialog')) return
      // Space/Enter on a focused button already clicks it; don't flip twice.
      const onControl = Boolean(target?.closest('button, a'))
      if ((e.key === ' ' || e.key === 'Enter') && !onControl) {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowRight') {
        goTo(position + 1)
      } else if (e.key === 'ArrowLeft') {
        goTo(position - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finished, goTo, position])

  const progress = Math.round((Math.min(position, order.length) / order.length) * 100)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-white/55">
        <span className="tabular-nums">
          {finished ? labels.done : labels.card(position + 1, order.length)}
        </span>
        <span className="flex items-center gap-3 tabular-nums">
          <span className="text-emerald-300">✓ {known.size}</span>
          <span className="text-orange-300">↻ {learning.size}</span>
        </span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div
          className="h-full rounded-full bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {card ? (
        <>
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? labels.showTerm(card.definition) : labels.showDefinition(card.term)}
            className="flip-card block h-64 w-full rounded-3xl text-left focus-visible:ring-4 focus-visible:ring-fuchsia-500/30 focus-visible:outline-none sm:h-72"
          >
            <span className="flip-card-inner block" data-flipped={flipped}>
              <span className="flip-card-face flex flex-col rounded-3xl border border-white/15 bg-[#161a3d] p-6 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.7)]">
                <span className="text-[11px] font-semibold tracking-[0.14em] text-sky-200/70 uppercase">{labels.term}</span>
                <span className="flex flex-1 items-center justify-center overflow-auto py-3 text-center text-2xl leading-snug font-semibold text-balance sm:text-3xl">
                  {card.term}
                </span>
                <span className="text-center text-xs text-white/40">{labels.tapHint}</span>
              </span>
              <span className="flip-card-face flip-card-back flex flex-col rounded-3xl border border-fuchsia-300/25 bg-[#211a42] p-6 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.7)]">
                <span className="text-[11px] font-semibold tracking-[0.14em] text-fuchsia-200/70 uppercase">
                  {labels.definition}
                </span>
                <span className="flex flex-1 items-center justify-center overflow-auto py-3 text-center text-lg leading-relaxed text-pretty text-white/90 sm:text-xl">
                  {card.definition}
                </span>
                <span className="text-center text-xs text-white/40">{card.term}</span>
              </span>
            </span>
          </button>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => mark(false)}
              className={`${secondaryButton} border-orange-300/30 text-orange-200 hover:border-orange-300/50`}
            >
              {labels.stillLearning}
            </button>
            <button
              type="button"
              onClick={() => mark(true)}
              className={`${secondaryButton} border-emerald-300/30 text-emerald-200 hover:border-emerald-300/50`}
            >
              {labels.gotIt}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button type="button" onClick={() => goTo(position - 1)} disabled={position === 0} className={`${smallButton} disabled:opacity-40`} aria-label={labels.prevAria}>
              <ArrowLeftIcon className="size-3.5" />
              {labels.prev}
            </button>
            <button type="button" onClick={() => restart(shuffled(order))} className={smallButton}>
              {labels.shuffle}
            </button>
            <button type="button" onClick={() => goTo(position + 1)} className={smallButton} aria-label={labels.nextAria}>
              {labels.next}
              <ArrowRightIcon className="size-3.5" />
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-center">
          <p aria-hidden className="text-4xl">
            {learning.size === 0 ? '🎉' : '💪'}
          </p>
          <p className="mt-3 text-xl font-semibold">
            {labels.summary(known.size, order.length)}
          </p>
          <p className="mt-1 text-sm text-white/60">
            {learning.size === 0
              ? labels.allKnown
              : labels.goAgain(learning.size)}
          </p>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            {learning.size > 0 && (
              <button type="button" onClick={() => restart(shuffled([...learning]))} className={primaryButton}>
                {labels.studyMissed(learning.size)}
              </button>
            )}
            <button type="button" onClick={() => restart(range(cards.length))} className={secondaryButton}>
              <ResetIcon className="size-4" />
              {labels.startOver}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
