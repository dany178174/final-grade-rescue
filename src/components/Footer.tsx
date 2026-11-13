import { useFeedback } from './feedback/FeedbackContext'

const COPY = {
  en: { tagline: 'Built to save your GPA.', feedback: 'Feedback', switchLabel: '🇻🇳 Học sinh Việt Nam', switchHref: '#/vn' },
  vi: { tagline: 'Được làm ra để cứu điểm cho bạn.', feedback: 'Góp ý', switchLabel: '🇺🇸 US grading (English)', switchHref: '#/' },
}

const linkClass =
  'rounded-md font-medium text-white/75 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-accent-300/70 focus-visible:ring-2 focus-visible:ring-accent-400/50 focus-visible:outline-none'

export function Footer({ lang = 'en' }: { lang?: 'en' | 'vi' }) {
  const feedback = useFeedback()
  const t = COPY[lang]
  return (
    <footer className="mt-8 flex flex-col items-center gap-2 text-sm text-white/55">
      <p>{t.tagline}</p>
      <nav aria-label="More" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        <a href={t.switchHref} lang={lang === 'vi' ? 'en' : 'vi'} className={linkClass}>
          {t.switchLabel}
        </a>
        {feedback.enabled && (
          <>
            <span aria-hidden className="text-white/25">
              •
            </span>
            <button type="button" onClick={() => feedback.open()} className={linkClass}>
              {t.feedback}
            </button>
          </>
        )}
      </nav>
    </footer>
  )
}
