import { useFeedback } from './feedback/FeedbackContext'
import { InstallButton } from './InstallButton'

const BUY_ME_A_COFFEE_URL = 'https://dungletien.gumroad.com/l/graderescue-coffee'

const linkClass =
  'rounded-md font-medium text-white/75 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-pink-300/70 focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 focus-visible:outline-none'

function Dot() {
  return (
    <span aria-hidden className="hidden text-white/25 sm:inline">
      •
    </span>
  )
}

const COPY = {
  en: { tagline: 'Built to save your GPA.', flashcards: 'Flashcard maker', feedback: 'Feedback', coffee: 'Buy me a coffee ☕', switchLabel: '🇻🇳 Học sinh Việt Nam', switchHref: '#/vn' },
  vi: { tagline: 'Được làm ra để cứu điểm cho bạn.', flashcards: 'Tạo thẻ ghi nhớ', feedback: 'Góp ý', coffee: 'Mời mình ly cà phê ☕', switchLabel: '🇺🇸 US grading (English)', switchHref: '#/' },
}

export function Footer({ lang = 'en' }: { lang?: 'en' | 'vi' }) {
  const feedback = useFeedback()
  const t = COPY[lang]
  return (
    <footer className="mt-8 flex flex-col items-center gap-2 text-sm text-white/55">
      <p>{t.tagline}</p>
      <nav aria-label="More" className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-3">
        <a href={t.switchHref} lang={lang === 'vi' ? 'en' : 'vi'} className={linkClass}>
          {t.switchLabel}
        </a>
        <Dot />
        <a href={lang === 'vi' ? '#/vn/the-ghi-nho' : '#/flashcards'} className={linkClass}>
          {t.flashcards}
        </a>
        {lang === 'vi' && (
          <>
            <Dot />
            <a href="#/vn/lich-on" className={linkClass}>
              Lịch ôn nhiều môn
            </a>
          </>
        )}
        {feedback.enabled && (
          <>
            <Dot />
            <button type="button" onClick={() => feedback.open()} className={linkClass}>
              {t.feedback}
            </button>
          </>
        )}
        <Dot />
        <a href={BUY_ME_A_COFFEE_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {t.coffee}
        </a>
        <InstallButton lang={lang} className={linkClass} separator={<Dot />} />
      </nav>
    </footer>
  )
}
