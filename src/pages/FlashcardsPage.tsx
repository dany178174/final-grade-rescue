import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CopyButton } from '../components/CopyButton'
import { StudyDeck } from '../components/flashcards/StudyDeck'
import { ArrowLeftIcon, ExternalLinkIcon } from '../components/icons'
import { SearchLink } from '../components/plan/ResourceCard'
import { AI_TOOLS } from '../data/prompts'
import { getSubject } from '../data/subjects'
import {
  CARD_COUNTS,
  EXAMPLE_DECK,
  fileNameFor,
  flashcardPrompt,
  parseCards,
  QUIZLET_CREATE_URL,
  quizletSearch,
  toAnkiFile,
  toQuizletText,
} from '../lib/flashcards'
import { hrefFor } from '../lib/router'
import { copyText, primaryButton, secondaryButton, selectableCard, smallButton } from '../lib/ui'

const STORAGE_KEY = 'fgr-flashcards'
const PLAN_KEYS = ['c', 'd', 'w', 's', 'o', 't', 'l', 'days'] as const

type Saved = { topic: string; text: string }

function loadSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Saved) : null
  } catch {
    return null
  }
}

function save(value: Saved) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Private mode or blocked storage: the deck just won't survive a reload.
  }
}

function StepCard({ step, title, sub, children }: { step: number; title: string; sub: string; children: ReactNode }) {
  return (
    <section className="glass-card p-5 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 text-sm font-bold">
          {step}
        </span>
        <div>
          <h2 className="text-lg leading-snug font-semibold tracking-tight sm:text-xl">{title}</h2>
          <p className="mt-0.5 text-sm text-pretty text-white/55">{sub}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default function FlashcardsPage({ params }: { params: URLSearchParams }) {
  const subject = getSubject(params.get('s'))
  const subjectName = subject?.id === 'other' ? (params.get('o') ?? '') : (subject?.promptName ?? '')
  const initialTopic = (params.get('t') ?? '').slice(0, 60)

  const [topic, setTopic] = useState(initialTopic)
  const [count, setCount] = useState<number>(20)
  const [text, setText] = useState(() => {
    const saved = loadSaved()
    return saved && saved.topic === initialTopic ? saved.text : ''
  })
  const [quizletCopied, setQuizletCopied] = useState(false)

  useEffect(() => {
    save({ topic, text })
  }, [topic, text])

  useEffect(() => {
    if (!quizletCopied) return
    const timer = setTimeout(() => setQuizletCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [quizletCopied])

  const prompt = flashcardPrompt({ topic: topic.trim(), subject: subjectName, count })
  const { cards, skipped } = useMemo(() => parseCards(text), [text])
  const deckKey = useMemo(() => cards.map((c) => c.term + '\u0000' + c.definition).join('\u0001'), [cards])

  const hasPlan = PLAN_KEYS.every((k) => k === 'o' || k === 't' || params.get(k))
  const backHref = hasPlan
    ? hrefFor('/plan', Object.fromEntries(PLAN_KEYS.map((k) => [k, params.get(k) ?? undefined])))
    : hrefFor('/', { c: params.get('c') ?? undefined, d: params.get('d') ?? undefined, w: params.get('w') ?? undefined })

  const downloadAnki = () => {
    const blob = new Blob([toAnkiFile(cards)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileNameFor(topic)
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="w-full max-w-3xl">
      <nav className="mb-4">
        <a href={backHref} className={smallButton}>
          <ArrowLeftIcon className="size-3.5" />
          {hasPlan ? 'Study plan' : 'Calculator'}
        </a>
      </nav>

      <header className="glass-card relative mb-4 overflow-hidden p-6 sm:mb-5 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/[0.08] to-transparent"
        />
        <div className="relative">
          <p className="text-xs font-semibold tracking-[0.14em] text-fuchsia-200/80 uppercase">🃏 Flashcard Maker</p>
          <h1 className="mt-2 text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
            Turn any topic into a Quizlet set
          </h1>
          <p className="mt-2 text-sm text-pretty text-white/65 sm:text-base">
            AI writes the cards, you study them right here, then send them to Quizlet or Anki with one paste. Takes
            about 2 minutes.
          </p>
        </div>
      </header>

      <div className="space-y-4 sm:space-y-5">
        <StepCard step={1} title="Get your cards from AI" sub="Tell us the topic, copy the prompt, paste it into any AI chat.">
          <label htmlFor="fc-topic" className="mb-2 block text-sm font-medium text-white/85">
            Topic
          </label>
          <input
            id="fc-topic"
            type="text"
            value={topic}
            maxLength={60}
            autoComplete="off"
            placeholder={subject?.topicExample ?? 'e.g. the French Revolution'}
            onChange={(e) => setTopic(e.target.value)}
            className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-base text-white transition outline-none placeholder:text-white/30 hover:border-white/25 focus:border-fuchsia-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-fuchsia-500/20"
          />

          <p className="mt-4 mb-2 text-sm font-medium text-white/85">How many cards?</p>
          <div className="grid grid-cols-3 gap-2">
            {CARD_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={count === n}
                onClick={() => setCount(n)}
                className={`${selectableCard(count === n)} flex h-11 items-center justify-center text-sm font-semibold`}
              >
                {n} cards
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold tracking-wide text-white/50 uppercase">Your prompt</p>
              <CopyButton text={prompt} label="Copy prompt" />
            </div>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-white/80">{prompt}</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-white/55">Paste into:</span>
            {AI_TOOLS.map((tool) => (
              <a key={tool.name} href={tool.url} target="_blank" rel="noopener noreferrer" className={smallButton}>
                {tool.name}
                <ExternalLinkIcon className="size-3.5 text-white/50" />
              </a>
            ))}
          </div>

          {topic.trim() && (
            <div className="mt-5">
              <p className="mb-2 text-sm text-white/55">Or borrow a set other students already made:</p>
              <SearchLink href={quizletSearch(topic.trim())} query={topic.trim()} where="Quizlet" />
            </div>
          )}
        </StepCard>

        <StepCard
          step={2}
          title="Paste the cards here"
          sub="Copy the AI's whole answer and paste it below. Or type your own: one card per line, term | definition."
        >
          <label htmlFor="fc-text" className="sr-only">
            Flashcards, one per line
          </label>
          <textarea
            id="fc-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            spellCheck={false}
            placeholder={'Mitochondria | The organelle that makes most of the cell\'s ATP\nATP | The molecule cells use to store and move energy'}
            className="w-full resize-y rounded-2xl border border-white/15 bg-white/[0.06] p-4 font-mono text-sm leading-relaxed text-white transition outline-none placeholder:text-white/30 hover:border-white/25 focus:border-fuchsia-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-fuchsia-500/20"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm" aria-live="polite">
              {cards.length > 0 ? (
                <span className="font-medium text-emerald-300">
                  ✓ {cards.length} card{cards.length === 1 ? '' : 's'} ready
                </span>
              ) : (
                <span className="text-white/50">No cards yet</span>
              )}
              {skipped > 0 && (
                <span className="ml-2 text-amber-200/80">
                  · {skipped} line{skipped === 1 ? '' : 's'} skipped (no “|” between term and definition)
                </span>
              )}
            </p>
            <div className="flex gap-2">
              {!text && (
                <button type="button" onClick={() => setText(EXAMPLE_DECK)} className={smallButton}>
                  Try an example
                </button>
              )}
              {text && (
                <button type="button" onClick={() => setText('')} className={smallButton}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </StepCard>

        {cards.length > 0 && (
          <>
            <StepCard step={3} title="Study them now" sub="Flip each card, then be honest: got it, or still learning?">
              <StudyDeck key={deckKey} cards={cards} />
            </StepCard>

            <StepCard step={4} title="Send them to Quizlet or Anki" sub="Keep studying on your phone with spaced repetition.">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-semibold">Quizlet</p>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-white/70 marker:text-white/40">
                    <li>Tap “Copy for Quizlet”.</li>
                    <li>
                      On Quizlet, create a new flashcard set and choose <span className="text-white">Import</span>.
                    </li>
                    <li>Paste. Keep “Tab” and “New line” selected, then import.</li>
                  </ol>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => setQuizletCopied(await copyText(toQuizletText(cards)))}
                      className={`${primaryButton} h-10 px-4`}
                    >
                      {quizletCopied ? '✓ Copied!' : 'Copy for Quizlet'}
                    </button>
                    <a href={QUIZLET_CREATE_URL} target="_blank" rel="noopener noreferrer" className={`${secondaryButton} h-10 px-4`}>
                      Open Quizlet
                      <ExternalLinkIcon className="size-3.5 text-white/50" />
                    </a>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-semibold">Anki</p>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-white/70 marker:text-white/40">
                    <li>Download the file.</li>
                    <li>
                      In Anki, choose <span className="text-white">File → Import</span> and pick the file.
                    </li>
                    <li>Check the deck name, then import.</li>
                  </ol>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={downloadAnki} className={`${secondaryButton} h-10 px-4`}>
                      ⬇ Download for Anki
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-white/45">
                Always skim AI-made cards against your notes. AI can get a detail wrong, and a wrong flashcard is worse
                than none.
              </p>
            </StepCard>
          </>
        )}
      </div>
    </main>
  )
}
