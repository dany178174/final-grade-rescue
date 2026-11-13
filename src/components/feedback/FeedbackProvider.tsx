import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { parseHash } from '../../lib/router'
import { primaryButton } from '../../lib/ui'
import { FEEDBACK_API, FeedbackContext, RATINGS } from './FeedbackContext'

type Status = 'idle' | 'sending' | 'sent' | 'error'

const COPY = {
  en: {
    thanks: 'Thank you!',
    sentText: 'Your feedback was sent. Every message is read and helps make this better for the next student.',
    back: 'Back to studying',
    title: 'Send feedback',
    sub: "What's working? What's missing? Tell us anything.",
    close: 'Close',
    rating: "How's it working for you?",
    message: 'Your message',
    messagePlaceholder: 'e.g. Please add a subject for Anatomy!',
    email: 'Email',
    emailNote: '(optional, only if you want a reply)',
    tooMany: 'Too many messages. Please try again in a few minutes.',
    failed: "Couldn't send right now. Check your connection and try again.",
    sending: 'Sending…',
    send: 'Send feedback',
    context: "We also include which page you were on, so we know what you're talking about.",
  },
  vi: {
    thanks: 'Cảm ơn bạn!',
    sentText: 'Góp ý đã được gửi. Mọi tin nhắn đều được đọc và giúp web tốt hơn cho các bạn học sinh khác.',
    back: 'Quay lại học tiếp',
    title: 'Gửi góp ý',
    sub: 'Điều gì hay? Điều gì còn thiếu? Cứ nói thoải mái nhé.',
    close: 'Đóng',
    rating: 'Bạn thấy web thế nào?',
    message: 'Lời nhắn',
    messagePlaceholder: 'VD: Thêm môn Tiếng Pháp giúp mình với!',
    email: 'Email',
    emailNote: '(không bắt buộc, chỉ khi bạn muốn được trả lời)',
    tooMany: 'Bạn gửi hơi nhiều rồi, thử lại sau vài phút nhé.',
    failed: 'Chưa gửi được. Kiểm tra kết nối mạng rồi thử lại nhé.',
    sending: 'Đang gửi…',
    send: 'Gửi góp ý',
    context: 'Web sẽ gửi kèm tên trang bạn đang xem để hiểu đúng góp ý của bạn.',
  },
}

/**
 * A short, non-personal description of where the feedback came from. The subject
 * data is loaded only when a message is sent, to keep it out of the main bundle.
 */
async function describePage(): Promise<string> {
  const { path, params } = parseHash()
  const [{ LEARNING_STYLES, getDayOption, isLearningStyle, TIER_PLANS }, { getSubject }] = await Promise.all([
    import('../../data/plan'),
    import('../../data/subjects'),
  ])
  if (path === '/vn' || path.startsWith('/vn/')) {
    const [{ VN_STYLES }, { getVnSubject }, { evaluateVn, vnInputsFromParams }] = await Promise.all([
      import('../../data/vn/plan'),
      import('../../data/vn/subjects'),
      import('../../lib/vnGrade'),
    ])
    const page = path === '/vn/ke-hoach' ? 'VN · Kế hoạch ôn' : path === '/vn/the-ghi-nho' ? 'VN · Thẻ ghi nhớ' : 'VN · Máy tính điểm'
    const parts: string[] = [page]
    const subject = getVnSubject(params.get('mon'))
    if (subject) parts.push(`${subject.id === 'khac' ? (params.get('khac') ?? 'Môn khác') : subject.name} lớp ${params.get('lop') ?? '?'}`)
    const style = params.get('cach')
    if (isLearningStyle(style)) parts.push(VN_STYLES[style].label)
    const { outcome } = evaluateVn(vnInputsFromParams(params))
    if (outcome.status === 'ready') parts.push(`cần ${outcome.score}`)
    return parts.join(' · ')
  }
  const { evaluateGrades, inputsFromParams } = await import('../../lib/grade')
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

export function FeedbackProvider({ children, lang = 'en' }: { children: ReactNode; lang?: 'en' | 'vi' }) {
  const t = COPY[lang]
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [botcheck, setBotcheck] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [errorText, setErrorText] = useState('')
  const [enabled, setEnabled] = useState(false)

  // Show the feedback UI only when the API says storage is connected, so the
  // site never shows a form that can't save anything.
  useEffect(() => {
    let cancelled = false
    fetch(FEEDBACK_API)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { ready?: boolean } | null) => {
        if (!cancelled) setEnabled(Boolean(data?.ready))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const open = useCallback(
    (initialRating?: number) => {
      if (!enabled) return
      if (status === 'sent') {
        setMessage('')
        setEmail('')
        setRating(null)
        setStatus('idle')
      }
      if (initialRating) setRating(initialRating)
      dialogRef.current?.showModal()
    },
    [enabled, status],
  )

  const close = () => dialogRef.current?.close()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim() && rating === null) return
    setStatus('sending')
    try {
      const response = await fetch(FEEDBACK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          message: message.trim(),
          email: email.trim(),
          page: await describePage().catch(() => ''),
          botcheck,
        }),
      })
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean }
      if (response.ok && data.ok) {
        setStatus('sent')
      } else {
        setErrorText(response.status === 429 ? t.tooMany : '')
        setStatus('error')
      }
    } catch {
      setErrorText('')
      setStatus('error')
    }
  }

  const value = useMemo(() => ({ enabled, open }), [enabled, open])
  const canSend = (message.trim().length > 0 || rating !== null) && status !== 'sending'

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {enabled && (
        <dialog
          ref={dialogRef}
          aria-labelledby="feedback-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
          className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-white/15 bg-ink-800/95 p-0 text-white shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] backdrop:bg-ink-950/70 backdrop:backdrop-blur-sm"
        >
          <div className="p-6 sm:p-7">
            {status === 'sent' ? (
              <div className="py-4 text-center">
                <p aria-hidden className="text-5xl">
                  💜
                </p>
                <h2 id="feedback-title" className="mt-4 text-xl font-semibold">
                  {t.thanks}
                </h2>
                <p className="mt-2 text-sm text-white/65">
                  {t.sentText}
                </p>
                <button type="button" onClick={close} className={`${primaryButton} mt-6 w-full`}>
                  {t.back}
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 id="feedback-title" className="text-xl font-semibold tracking-tight">
                      {t.title}
                    </h2>
                    <p className="mt-1 text-sm text-white/60">{t.sub}</p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    aria-label={t.close}
                    className="grid size-9 shrink-0 place-items-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-accent-400/50 focus-visible:outline-none"
                  >
                    ✕
                  </button>
                </div>

                <fieldset className="mt-5">
                  <legend className="mb-2 text-sm font-medium text-white/85">{t.rating}</legend>
                  <div className="grid grid-cols-5 gap-2">
                    {RATINGS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        aria-pressed={rating === r.value}
                        aria-label={lang === 'vi' ? r.labelVi : r.label}
                        title={lang === 'vi' ? r.labelVi : r.label}
                        onClick={() => setRating(r.value)}
                        className={`grid h-12 place-items-center rounded-2xl border text-2xl transition focus-visible:ring-4 focus-visible:ring-accent-500/25 focus-visible:outline-none ${
                          rating === r.value
                            ? 'scale-105 border-accent-300/60 bg-white/[0.12]'
                            : 'border-white/12 bg-white/[0.05] opacity-75 hover:opacity-100'
                        }`}
                      >
                        {r.emoji}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label htmlFor="feedback-message" className="mt-5 mb-2 block text-sm font-medium text-white/85">
                  {t.message}
                </label>
                <textarea
                  id="feedback-message"
                  rows={4}
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.messagePlaceholder}
                  className="w-full resize-y rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-base text-white transition outline-none placeholder:text-white/30 hover:border-white/25 focus:border-accent-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-accent-500/20"
                />

                <label htmlFor="feedback-email" className="mt-4 mb-2 block text-sm font-medium text-white/85">
                  {t.email} <span className="font-normal text-white/45">{t.emailNote}</span>
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white transition outline-none placeholder:text-white/30 hover:border-white/25 focus:border-accent-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-accent-500/20"
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
                    {errorText || t.failed}
                  </p>
                )}

                <button type="submit" disabled={!canSend} className={`${primaryButton} mt-5 w-full`}>
                  {status === 'sending' ? t.sending : t.send}
                </button>
                <p className="mt-3 text-center text-xs text-white/40">
                  {t.context}
                </p>
              </form>
            )}
          </div>
        </dialog>
      )}
    </FeedbackContext.Provider>
  )
}
