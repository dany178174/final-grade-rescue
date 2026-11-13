import { useRef, type Dispatch, type KeyboardEvent, type SetStateAction } from 'react'
import { ArrowRightIcon, LifebuoyIcon, ResetIcon } from '../components/icons'
import { PercentInput } from '../components/PercentInput'
import { ResultPanel } from '../components/ResultPanel'
import { EMPTY_INPUTS, evaluateGrades, gradeParams, type FieldKey, type GradeInputs } from '../lib/grade'
import { hrefFor } from '../lib/router'
import { primaryButton, secondaryButton } from '../lib/ui'

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

type CalculatorPageProps = {
  inputs: GradeInputs
  setInputs: Dispatch<SetStateAction<GradeInputs>>
}

export function CalculatorPage({ inputs, setInputs }: CalculatorPageProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const resultRef = useRef<HTMLDivElement>(null)

  const { fields, outcome } = evaluateGrades(inputs)
  const isEmpty = Object.values(inputs).every((v) => v === '')
  const planReady = outcome.status === 'ready'

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
    <main className="glass-card relative w-full max-w-md overflow-hidden p-6 sm:p-8 lg:max-w-4xl lg:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/[0.08] to-transparent"
      />

      <header className="relative mb-7 flex flex-col items-center text-center lg:mb-9">
        <a
          href="#/vn"
          lang="vi"
          className="mb-5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          🇻🇳 Học sinh Việt Nam? Dùng thang điểm 10 →
        </a>
        <div className="mb-4 grid size-12 place-items-center rounded-2xl border border-accent-300/25 bg-accent-500/15 shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--color-accent-500)_80%,transparent)]">
          <LifebuoyIcon className="size-6 text-accent-200" />
        </div>
        <h1 className="text-[1.65rem] leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
          Final Grade{' '}
          <span className="bg-linear-to-r from-accent-300 via-accent-200 to-accent-100 bg-clip-text text-transparent">
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

          {planReady ? (
            <a href={hrefFor('/plan', gradeParams(inputs))} className={`${primaryButton} mt-4 w-full`}>
              Build my study plan
              <ArrowRightIcon className="size-4" />
            </a>
          ) : (
            <button type="button" disabled className={`${primaryButton} mt-4 w-full`}>
              Build my study plan
              <ArrowRightIcon className="size-4" />
            </button>
          )}

          <button type="button" onClick={reset} disabled={isEmpty} className={`${secondaryButton} mt-3 w-full`}>
            <ResetIcon className="size-4" />
            Reset
          </button>
        </div>
      </div>
    </main>
  )
}
