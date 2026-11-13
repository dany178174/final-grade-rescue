import { lazy, Suspense, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { AppearanceProvider } from './components/appearance/AppearanceProvider'
import { FeedbackProvider } from './components/feedback/FeedbackProvider'
import { Footer } from './components/Footer'
import { MeshBackground } from './components/MeshBackground'
import { MobileTopBar, SideNav, TabBar } from './components/shell/Navigation'
import { SupportCards } from './components/shell/SupportCards'
import { inputsFromParams, type GradeInputs } from './lib/grade'
import { parseHash, useHashRoute, type Route } from './lib/router'
import { vnInputsFromParams, type VnInputs } from './lib/vnGrade'
import { CalculatorPage } from './pages/CalculatorPage'

// Everything except the US calculator loads only when opened.
const StudyPlanPage = lazy(() => import('./pages/StudyPlanPage'))
const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage'))
const InboxPage = lazy(() => import('./pages/InboxPage'))
const VnCalculatorPage = lazy(() => import('./pages/vn/VnCalculatorPage').then((m) => ({ default: m.VnCalculatorPage })))
const VnPlanPage = lazy(() => import('./pages/vn/VnPlanPage'))
const VnMultiPlanPage = lazy(() => import('./pages/vn/VnMultiPlanPage'))
const VnBoardPage = lazy(() => import('./pages/vn/VnBoardPage'))

const isVietnamese = (path: string) => path === '/vn' || path.startsWith('/vn/')

export default function App() {
  const route = useHashRoute()
  // Numbers from a shared link (e.g. #/plan?c=86&d=90&w=30 or #/vn?n=3&gk=7) prefill the calculators.
  const [inputs, setInputs] = useState<GradeInputs>(() => inputsFromParams(parseHash().params))
  const [vnInputs, setVnInputs] = useState<VnInputs>(() => vnInputsFromParams(parseHash().params))
  const vn = isVietnamese(route.path)
  const lang = vn ? 'vi' : 'en'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route.path])

  useEffect(() => {
    document.documentElement.lang = vn ? 'vi' : 'en'
    document.title = vn ? 'Máy tính Cứu Điểm cho học sinh Việt Nam' : 'Final Grade Rescue Calculator'
  }, [vn])

  return (
    <AppearanceProvider lang={lang}>
    <FeedbackProvider lang={lang}>
      <MeshBackground />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/[0.06] bg-ink-900/75 backdrop-blur-xl xl:block">
        <SideNav lang={lang} path={route.path} />
      </aside>

      <div className="relative z-10 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:pt-5 xl:pt-10 xl:pr-10 xl:pb-12 xl:pl-[calc(16rem+2.5rem)]">
        <MobileTopBar lang={lang} />
        <div className="mx-auto flex min-h-[calc(100dvh-12rem)] max-w-5xl flex-col items-center justify-center xl:min-h-[calc(100dvh-5rem)]">
          <Suspense fallback={<PageLoading vn={vn} />}>
            {renderPage(route, { inputs, setInputs, vnInputs, setVnInputs })}
          </Suspense>
          <div className="contents xl:hidden">
            <SupportCards lang={lang} layout="row" />
          </div>
          <Footer lang={lang} />
        </div>
      </div>

      <TabBar lang={lang} path={route.path} />
    </FeedbackProvider>
    </AppearanceProvider>
  )
}

function renderPage(
  route: Route,
  state: {
    inputs: GradeInputs
    setInputs: Dispatch<SetStateAction<GradeInputs>>
    vnInputs: VnInputs
    setVnInputs: Dispatch<SetStateAction<VnInputs>>
  },
): ReactNode {
  switch (route.path) {
    case '/plan':
      return <StudyPlanPage params={route.params} />
    case '/flashcards':
      return <FlashcardsPage key={route.params.toString()} params={route.params} />
    case '/inbox':
      return <InboxPage />
    case '/vn':
      return <VnCalculatorPage inputs={state.vnInputs} setInputs={state.setVnInputs} />
    case '/vn/ke-hoach':
      return <VnPlanPage params={route.params} />
    case '/vn/lich-on':
      return <VnMultiPlanPage params={route.params} />
    case '/vn/bang-diem':
      return <VnBoardPage />
    case '/vn/the-ghi-nho':
      return <FlashcardsPage key={`vi-${route.params.toString()}`} params={route.params} lang="vi" />
    default:
      return <CalculatorPage inputs={state.inputs} setInputs={state.setInputs} />
  }
}

function PageLoading({ vn }: { vn: boolean }) {
  return (
    <div className="glass-card grid h-64 w-full max-w-3xl place-items-center text-sm text-white/60">
      {vn ? 'Đang tải…' : 'Loading…'}
    </div>
  )
}
