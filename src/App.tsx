import { useRef, useState, type KeyboardEvent } from 'react'
import { LifebuoyIcon, ResetIcon } from './components/icons'
import { MeshBackground } from './components/MeshBackground'
import { PercentInput } from './components/PercentInput'
import { ResultPanel } from './components/ResultPanel'
import { evaluateGrades, type FieldKey, type GradeInputs } from './lib/grade'

// Placeholder: swap in your Buy Me a Coffee page URL.
const BUY_ME_A_COFFEE_URL = '#'

const EMPTY_INPUTS: GradeInputs = { current: '', desired: '', weight: '' }

const FIELDS: { key: FieldKey; label: string; hint: string; placeholder: string }[] = [
  {
    key: 'current',
    label: 'Current Grade (%)',
    hint: 'Your standing in the class right now.',
    placeholder: 'e.g. 84',
  },
  {
    key: 'desired',
    label: 'Desired Grade (%)',
    hint: 'Aiming for an A? Enter 90.',
    placeholder: 'e.g. 90',
  },
  {
    key: 'weight',
    label: 'Final Exam Weight (%)',
    hint: 'How much the final counts in the syllabus.',
    placeholder: 'e.g. 25',
  },
]

export default function App() {
  const [inputs, setInputs] = useState<GradeInputs>(EMPTY_INPUTS)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const resultRef = useRef<HTMLDivElement>(null)

  const { fields, outcome } = evaluateGrades(inputs)
  const isEmpty = Object.values(inputs).every((v) => v === '')

  // Enter moves to the next field; on the last one it closes the mobile
  // keyboard and brings the result into view.
  const handleEnter = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const next = inputRefs.current[index + 1]
    if (next) {
      next.focus()
    } else {
      e.currentTarget.blur()
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  const reset = () => {
    setInputs(EMPTY_INPUTS)
    inputRefs.current[0]?.focus()
  }

  return (
    <>
      <MeshBackground />

      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-12">
        <main className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-white/[0.07] p-6 shadow-[0_24px_64px_-16px_rgb(0_0_0/0.6)] backdrop-blur-2xl sm:p-8 lg:max-w-4xl lg:p-10">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/[0.08] to-transparent" />

          <header className="relative mb-7 flex lg:mb-9 flex-col items-center text-center">
            <div className="mb-4 grid size-12 place-items-center rounded-2xl border border-white/15 bg-linear-to-br from-blue-500/30 via-purple-500/25 to-pink-500/30 shadow-lg shadow-purple-950/40">
              <LifebuoyIcon className="size-6 text-white" />
            </div>
            <h1 className="text-[1.65rem] leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
              Final Grade{' '}
              <span className="bg-linear-to-r from-sky-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
                Rescue
              </span>{' '}
              Calculator
            </h1>
            <p className="mt-2 text-sm text-pretty text-white/60 sm:text-base">
              Find out exactly what you need on the final.
            </p>
          </header>

          <div className="relative lg:grid lg:grid-cols-2 lg:gap-8">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()} noValidate>
              {FIELDS.map((field, index) => {
                const state = fields[field.key]
                return (
                  <PercentInput
                    key={field.key}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    id={field.key}
                    label={field.label}
                    hint={field.hint}
                    placeholder={field.placeholder}
                    value={inputs[field.key]}
                    error={state.status === 'invalid' ? state.error : undefined}
                    enterKeyHint={index === FIELDS.length - 1 ? 'done' : 'next'}
                    onChange={(value) => setInputs((prev) => ({ ...prev, [field.key]: value }))}
                    onKeyDown={handleEnter(index)}
                  />
                )
              })}
            </form>

            <div className="mt-6 flex flex-col lg:mt-0">
              <ResultPanel ref={resultRef} outcome={outcome} />

              <button
                type="button"
                onClick={reset}
                disabled={isEmpty}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] text-sm font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/[0.1] focus-visible:ring-4 focus-visible:ring-fuchsia-500/25 focus-visible:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/15 disabled:hover:bg-white/[0.06]"
              >
                <ResetIcon className="size-4" />
                Reset
              </button>
            </div>
          </div>
        </main>

        <footer className="mt-8 flex flex-col items-center gap-1.5 text-sm text-white/55 sm:flex-row sm:gap-3">
          <p>Built to save your GPA.</p>
          <span aria-hidden className="hidden text-white/25 sm:inline">
            •
          </span>
          <a
            href={BUY_ME_A_COFFEE_URL}
            className="rounded-md font-medium text-white/75 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-pink-300/70 focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 focus-visible:outline-none"
          >
            Buy me a coffee ☕
          </a>
        </footer>
      </div>
    </>
  )
}
