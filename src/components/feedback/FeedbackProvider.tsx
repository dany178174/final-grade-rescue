import { useCallback, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { WEB3FORMS_ACCESS_KEY } from '../../config'
import { LEARNING_STYLES, getDayOption, isLearningStyle, TIER_PLANS } from '../../data/plan'
import { getSubject } from '../../data/subjects'
import { evaluateGrades, inputsFromParams } from '../../lib/grade'
import { parseHash } from '../../lib/router'
import { primaryButton } from '../../lib/ui'
import { FEEDBACK_ENABLED, FeedbackContext, RATINGS } from './FeedbackContext'

type Status = 'idle' | 'sending' | 'sent' | 'error'

/** A short, non-personal description of where the feedback came from. */
function describePage(): string {
  const { path, params } = parseHash()
  const page = path === '/plan' ? 'Study plan' : path === '/flashcards' ? 'Flashcards' : 'Calculator'
  const parts: string[] = [page]
  const subject = getSubject(params.get('s'))
  if (subject) parts.push(subject.id === 'other' ? (params.get('o') ?? 'Other') : subject.name)
  const style = params.get('l')
  if (isLearningStyle(style)) parts.push(LEARNING_STYLES[style].label)
  const days = getDayOption(params.get('days'))
  if (days) parts.push(days.label)
  const { outcome } = evaluateGrades(inputsFromParams(params))
  if (outcome.status === 'ready') parts.push(`${TIER_PLANS[outcome.tier].mode} mode`)
  return parts.join(' · ')
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [botcheck, setBotcheck] = useState(false)
  const [status, setStatus] = useState<Status>('idle')

  const open = useCallback(
    (initialRating?: number) => {
      if (!FEEDBACK_ENABLED) return
      if (status === 'sent') {
        setMessage('')
        setEmail('')
        setRating(null)
        setStatus('idle')
      }
      if (initialRating) setRating(initialRating)
      dialogRef.current?.showModal()
    },
    [status],
  )

  const close = () => dialogRef.current?.close()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim() && rating === null) return
    setStatus('sending')
    const ratingInfo = RATINGS.find((r) => r.value === rating)
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `${ratingInfo?.emoji ?? '💬'} New feedback on Final Grade Rescue`,
          from_name: 'Final Grade Rescue',
          rating: ratingInfo ? `${ratingInfo.emoji} ${ratingInfo.label} (${ratingInfo.value}/5)` : 'No rating',
          message: message.trim() || '(no message)',
          email: email.trim() || undefined,
          page: describePage(),
          botcheck,
        }),
      })
      const data = (await response.json().catch(() => ({}))) as { success?: boolean }
      setStatus(response.ok && data.success ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const value = useMemo(() => ({ enabled: FEEDBACK_ENABLED, open }), [open])
  const canSend = (message.trim().length > 0 || rating !== null) && status !== 'sending'

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {FEEDBACK_ENABLED && (
        <dialog
          ref={dialogRef}
          aria-labelledby="feedback-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
          className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-white/15 bg-[#12142e]/95 p-0 text-white shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] backdrop:bg-[#05061a]/70 backdrop:backdrop-blur-sm"
        >
          <div className="p-6 sm:p-7">
            {status === 'sent' ? (
              <div className="py-4 text-center">
                <p aria-hidden className="text-5xl">
                  💜
                </p>
                <h2 id="feedback-title" className="mt-4 text-xl font-semibold">
                  Thank you!
                </h2>
                <p className="mt-2 text-sm text-white/65">
                  Your feedback was sent. Every message is read and helps make this better for the next student.
                </p>
                <button type="button" onClick={close} className={`${primaryButton} mt-6 w-full`}>
                  Back to studying
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 id="feedback-title" className="text-xl font-semibold tracking-tight">
                      Send feedback
                    </h2>
                    <p className="mt-1 text-sm text-white/60">What's working? What's missing? Tell us anything.</p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="grid size-9 shrink-0 place-items-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 focus-visible:outline-none"
                  >
                    ✕
                  </button>
                </div>

                <fieldset className="mt-5">
                  <legend className="mb-2 text-sm font-medium text-white/85">How's it working for you?</legend>
                  <div className="grid grid-cols-5 gap-2">
                    {RATINGS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        aria-pressed={rating === r.value}
                        aria-label={r.label}
                        title={r.label}
                        onClick={() => setRating(r.value)}
                        className={`grid h-12 place-items-center rounded-2xl border text-2xl transition focus-visible:ring-4 focus-visible:ring-fuchsia-500/25 focus-visible:outline-none ${
                          rating === r.value
                            ? 'scale-105 border-fuchsia-300/60 bg-white/[0.12]'
                            : 'border-white/12 bg-white/[0.05] opacity-75 hover:opacity-100'
                        }`}
                      >
                        {r.emoji}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label htmlFor="feedback-message" className="mt-5 mb-2 block text-sm font-medium text-white/85">
                  Your message
                </label>
                <textarea
                  id="feedback-message"
                  rows={4}
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Please add a subject for Anatomy!"
                  className="w-full resize-y rounded-2xl border border-white/15 bg-white/[0.06] p-4 text-base text-white transition outline-none placeholder:text-white/30 hover:border-white/25 focus:border-fuchsia-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-fuchsia-500/20"
                />

                <label htmlFor="feedback-email" className="mt-4 mb-2 block text-sm font-medium text-white/85">
                  Email <span className="font-normal text-white/45">(optional, only if you want a reply)</span>
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-base text-white transition outline-none placeholder:text-white/30 hover:border-white/25 focus:border-fuchsia-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-fuchsia-500/20"
                />

                {/* Honeypot: hidden from people, bots tick it and get filtered out. */}
                <input
                  type="checkbox"
                  name="botcheck"
                  tabIndex={-1}
                  aria-hidden
                  checked={botcheck}
                  onChange={(e) => setBotcheck(e.target.checked)}
                  className="hidden"
                />

                {status === 'error' && (
                  <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3.5 py-2.5 text-sm text-red-200">
                    Couldn't send right now. Check your connection and try again.
                  </p>
                )}

                <button type="submit" disabled={!canSend} className={`${primaryButton} mt-5 w-full`}>
                  {status === 'sending' ? 'Sending…' : 'Send feedback'}
                </button>
                <p className="mt-3 text-center text-xs text-white/40">
                  We also include which page you were on, so we know what you're talking about.
                </p>
              </form>
            )}
          </div>
        </dialog>
      )}
    </FeedbackContext.Provider>
  )
}
