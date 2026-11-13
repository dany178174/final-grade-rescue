import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { FEEDBACK_API, RATINGS } from '../components/feedback/FeedbackContext'
import { ArrowLeftIcon, ResetIcon } from '../components/icons'
import { primaryButton, smallButton } from '../lib/ui'

type Entry = { id: string; at: string; rating: number | null; message: string; email: string; page: string }

const SESSION_KEY = 'fgr-inbox-password'

function readSession(): string {
  try {
    return sessionStorage.getItem(SESSION_KEY) ?? ''
  } catch {
    return ''
  }
}

function writeSession(value: string) {
  try {
    if (value) sessionStorage.setItem(SESSION_KEY, value)
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // Storage blocked: you'll just need to type the password again.
  }
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

type InboxResult = { entries?: Entry[]; error?: string }

async function fetchInbox(password: string): Promise<InboxResult> {
  try {
    const response = await fetch(FEEDBACK_API, { headers: { Authorization: `Bearer ${password}` } })
    const data = (await response.json().catch(() => ({}))) as InboxResult
    if (response.ok && data.entries) return { entries: data.entries }
    return { error: data.error ?? `Couldn't load the inbox (error ${response.status}).` }
  } catch {
    return { error: "Couldn't reach the server. Check your connection." }
  }
}

function timeAgo(iso: string, now: number): string {
  const seconds = (new Date(iso).getTime() - now) / 1000
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

export default function InboxPage() {
  const [password, setPassword] = useState(readSession)
  const [draft, setDraft] = useState('')
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(() => Boolean(readSession()))
  const [loadedAt, setLoadedAt] = useState(0)
  const [confirming, setConfirming] = useState<string | null>(null)

  const apply = useCallback((pw: string, result: InboxResult) => {
    setLoading(false)
    setLoadedAt(Date.now())
    if (result.entries) {
      setEntries(result.entries)
      setPassword(pw)
      setError('')
      writeSession(pw)
    } else {
      setEntries(null)
      setPassword('')
      setError(result.error ?? '')
      writeSession('')
    }
  }, [])

  const load = (pw: string) => {
    setLoading(true)
    setError('')
    void fetchInbox(pw).then((result) => apply(pw, result))
  }

  // Reopen the inbox automatically if the password is remembered for this tab.
  useEffect(() => {
    const saved = readSession()
    if (!saved) return
    let cancelled = false
    void fetchInbox(saved).then((result) => {
      if (!cancelled) apply(saved, result)
    })
    return () => {
      cancelled = true
    }
  }, [apply])

  const remove = async (id: string) => {
    setConfirming(null)
    const response = await fetch(`${FEEDBACK_API}?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${password}` },
    }).catch(() => null)
    if (response?.ok) setEntries((prev) => prev?.filter((e) => e.id !== id) ?? null)
    else setError("Couldn't delete that message. Try again.")
  }

  const signOut = () => {
    writeSession('')
    setPassword('')
    setEntries(null)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (draft) load(draft)
  }

  const rated = entries?.filter((e) => e.rating !== null) ?? []
  const average = rated.length ? rated.reduce((sum, e) => sum + (e.rating ?? 0), 0) / rated.length : null
  const lastWeek = entries?.filter((e) => loadedAt - new Date(e.at).getTime() < 7 * 86400000).length ?? 0
  const averageEmoji = average === null ? '–' : RATINGS[Math.min(4, Math.max(0, Math.round(average) - 1))].emoji

  return (
    <main className="w-full max-w-3xl">
      <nav className="mb-4 flex items-center justify-between gap-3">
        <a href="#/" className={smallButton}>
          <ArrowLeftIcon className="size-3.5" />
          Calculator
        </a>
        {entries && (
          <div className="flex gap-2">
            <button type="button" onClick={() => load(password)} disabled={loading} className={smallButton}>
              <ResetIcon className="size-3.5" />
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            <button type="button" onClick={signOut} className={smallButton}>
              Sign out
            </button>
          </div>
        )}
      </nav>

      <header className="glass-card relative overflow-hidden p-6 sm:p-8">
        <div
          aria-hidden
          className="card-sheen pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/[0.08] to-transparent"
        />
        <div className="relative">
          <p className="text-xs font-semibold tracking-[0.14em] text-accent-200/80 uppercase">📬 Owner only</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Feedback inbox</h1>

          {entries ? (
            <dl className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
              {[
                { label: 'Messages', value: String(entries.length) },
                { label: 'Avg rating', value: average === null ? '–' : `${averageEmoji} ${average.toFixed(1)}` },
                { label: 'Last 7 days', value: String(lastWeek) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
                  <dt className="text-[11px] font-medium tracking-wide text-white/50 uppercase">{stat.label}</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums">{stat.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <form onSubmit={submit} className="mt-5">
              <label htmlFor="inbox-password" className="mb-2 block text-sm font-medium text-white/85">
                Inbox password
              </label>
              <input
                id="inbox-password"
                type="password"
                autoComplete="current-password"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white transition outline-none hover:border-white/25 focus:border-accent-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-accent-500/20"
              />
              <p className="mt-1.5 text-xs text-white/50">
                The FEEDBACK_ADMIN_PASSWORD you set in Vercel. It's remembered until you close this tab.
              </p>
              <button type="submit" disabled={!draft || loading} className={`${primaryButton} mt-5 w-full`}>
                {loading ? 'Opening…' : 'Open inbox'}
              </button>
            </form>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3.5 py-2.5 text-sm text-red-200">
              {error}
            </p>
          )}
        </div>
      </header>

      {entries && (
        <section className="mt-4 space-y-3 sm:mt-5">
          {entries.length === 0 && (
            <div className="glass-card p-8 text-center text-white/60">
              <p aria-hidden className="text-4xl">
                📭
              </p>
              <p className="mt-3">No feedback yet. Share your site and it'll show up here.</p>
            </div>
          )}
          {entries.map((entry) => {
            const rating = RATINGS.find((r) => r.value === entry.rating)
            return (
              <article key={entry.id} className="glass-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="text-3xl leading-none">
                      {rating?.emoji ?? '💬'}
                    </span>
                    <div>
                      <p className="font-semibold">{rating ? rating.label : 'No rating'}</p>
                      <p className="text-xs text-white/50" title={new Date(entry.at).toLocaleString()}>
                        {timeAgo(entry.at, loadedAt)}
                      </p>
                    </div>
                  </div>
                  {confirming === entry.id ? (
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => remove(entry.id)} className={`${smallButton} border-red-400/40 text-red-200`}>
                        Delete
                      </button>
                      <button type="button" onClick={() => setConfirming(null)} className={smallButton}>
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirming(entry.id)} className={smallButton} aria-label="Delete message">
                      🗑
                    </button>
                  )}
                </div>

                {entry.message && (
                  <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-white/85">{entry.message}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {entry.page && (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-white/60">
                      {entry.page}
                    </span>
                  )}
                  {entry.email && (
                    <a
                      href={`mailto:${entry.email}?subject=${encodeURIComponent('Re: your Final Grade Rescue feedback')}`}
                      className="rounded-full border border-sky-300/30 bg-sky-400/10 px-2.5 py-1 font-medium text-sky-200 transition hover:bg-sky-400/20"
                    >
                      ↩ Reply to {entry.email}
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
