import { lazy, Suspense, useEffect, useState } from 'react'
import { FeedbackProvider } from './components/feedback/FeedbackProvider'
import { Footer } from './components/Footer'
import { MeshBackground } from './components/MeshBackground'
import { inputsFromParams, type GradeInputs } from './lib/grade'
import { parseHash, useHashRoute } from './lib/router'
import { CalculatorPage } from './pages/CalculatorPage'

// The plan and flashcard pages carry most of the content, so they load only when opened.
const StudyPlanPage = lazy(() => import('./pages/StudyPlanPage'))
const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage'))
const InboxPage = lazy(() => import('./pages/InboxPage'))

export default function App() {
  const route = useHashRoute()
  // Numbers from a shared link (e.g. #/plan?c=86&d=90&w=30) prefill the calculator.
  const [inputs, setInputs] = useState<GradeInputs>(() => inputsFromParams(parseHash().params))

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route.path])

  return (
    <FeedbackProvider>
      <MeshBackground />

      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-12">
        {route.path === '/plan' || route.path === '/flashcards' || route.path === '/inbox' ? (
          <Suspense fallback={<PageLoading />}>
            {route.path === '/plan' && <StudyPlanPage params={route.params} />}
            {route.path === '/flashcards' && (
              <FlashcardsPage key={route.params.toString()} params={route.params} />
            )}
            {route.path === '/inbox' && <InboxPage />}
          </Suspense>
        ) : (
          <CalculatorPage inputs={inputs} setInputs={setInputs} />
        )}

        <Footer />
      </div>
    </FeedbackProvider>
  )
}

function PageLoading() {
  return (
    <div className="glass-card grid h-64 w-full max-w-3xl place-items-center text-sm text-white/60">
      Loading…
    </div>
  )
}
