import { useFeedback } from './feedback/FeedbackContext'

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

export function Footer() {
  const feedback = useFeedback()
  return (
    <footer className="mt-8 flex flex-col items-center gap-2 text-sm text-white/55">
      <p>Built to save your GPA.</p>
      <nav aria-label="More" className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-3">
        <a href="#/flashcards" className={linkClass}>
          Flashcard maker
        </a>
        {feedback.enabled && (
          <>
            <Dot />
            <button type="button" onClick={() => feedback.open()} className={linkClass}>
              Feedback
            </button>
          </>
        )}
        <Dot />
        <a href={BUY_ME_A_COFFEE_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Buy me a coffee ☕
        </a>
      </nav>
    </footer>
  )
}
