import { useState, type ReactNode } from 'react'
import { DAY_OPTIONS, LEARNING_STYLES, STYLE_ORDER, type DaysId, type LearningStyle } from '../../data/plan'
import { getSubject, SUBJECTS } from '../../data/subjects'
import { primaryButton, selectableCard } from '../../lib/ui'
import { ArrowLeftIcon, ArrowRightIcon } from '../icons'

export type SubjectAnswer = { s: string; o?: string; t?: string }

function StepHeading({ step, title, sub }: { step: number; title: string; sub: string }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold tracking-[0.14em] text-accent-200/80 uppercase">Step {step} of 3</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
      <p className="mt-1.5 text-sm text-pretty text-white/60 sm:text-base">{sub}</p>
    </div>
  )
}

function TextField({
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
  autoFocus,
}: {
  id: string
  label: ReactNode
  hint?: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-white/85">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={60}
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white transition outline-none placeholder:text-white/30 hover:border-white/25 focus:border-accent-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-accent-500/20"
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-white/50">
          {hint}
        </p>
      )}
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-white/60 transition hover:text-white focus-visible:ring-2 focus-visible:ring-accent-400/50 focus-visible:outline-none"
    >
      <ArrowLeftIcon className="size-4" />
      Back
    </button>
  )
}

export function SubjectStep({
  initial,
  onContinue,
}: {
  initial: Partial<SubjectAnswer>
  onContinue: (answer: SubjectAnswer) => void
}) {
  const [subjectId, setSubjectId] = useState(initial.s ?? '')
  const [other, setOther] = useState(initial.o ?? '')
  const [topic, setTopic] = useState(initial.t ?? '')

  const subject = getSubject(subjectId)
  const isOther = subject?.id === 'other'
  const canContinue = Boolean(subject) && (!isOther || other.trim().length > 0)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!canContinue) return
        onContinue({ s: subjectId, o: isOther ? other.trim() : undefined, t: topic.trim() || undefined })
      }}
    >
      <StepHeading step={1} title="What's the final for?" sub="Pick a subject and we'll match the best resources to it." />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {SUBJECTS.map((s) => {
          const selected = s.id === subjectId
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setSubjectId(s.id)}
              className={`${selectableCard(selected)} flex min-h-[6.25rem] flex-col items-start gap-1 p-3.5`}
            >
              <span aria-hidden className="text-2xl leading-none">
                {s.emoji}
              </span>
              <span className="mt-1 text-sm leading-tight font-semibold">{s.name}</span>
              <span className="text-xs leading-snug text-white/50">{s.examples}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 space-y-4">
        {isOther && (
          <TextField
            id="other-subject"
            label="Which subject?"
            placeholder="e.g. Anatomy, Accounting, Art History"
            value={other}
            onChange={setOther}
            autoFocus
          />
        )}
        <TextField
          id="topic"
          label={
            <>
              Weakest topic <span className="font-normal text-white/45">(optional)</span>
            </>
          }
          hint="We'll use it to find videos and write your AI prompts."
          placeholder={subject?.topicExample ?? 'e.g. the topic you fear most'}
          value={topic}
          onChange={setTopic}
        />
      </div>

      <button type="submit" disabled={!canContinue} className={`${primaryButton} mt-6 w-full`}>
        Continue
        <ArrowRightIcon className="size-4" />
      </button>
    </form>
  )
}

export function StyleStep({
  selected,
  onSelect,
  onBack,
}: {
  selected: string | null
  onSelect: (style: LearningStyle) => void
  onBack: () => void
}) {
  return (
    <div>
      <StepHeading step={2} title="How do you learn best?" sub="Pick one. You can switch anytime on your plan." />
      <div className="grid gap-3 sm:grid-cols-3">
        {STYLE_ORDER.map((id) => {
          const style = LEARNING_STYLES[id]
          const isSelected = selected === id
          return (
            <button
              key={id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(id)}
              className={`${selectableCard(isSelected)} flex items-center gap-4 p-4 sm:flex-col sm:items-start sm:p-5`}
            >
              <span
                aria-hidden
                className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-accent-500/[0.12] text-2xl"
              >
                {style.emoji}
              </span>
              <span>
                <span className="block text-base font-semibold">{style.label}</span>
                <span className="block text-[11px] font-semibold tracking-[0.12em] text-accent-200/70 uppercase">
                  {style.tagline}
                </span>
                <span className="mt-1.5 block text-sm text-pretty text-white/60">{style.description}</span>
              </span>
            </button>
          )
        })}
      </div>
      <BackButton onClick={onBack} />
    </div>
  )
}

export function DaysStep({
  selected,
  onSelect,
  onBack,
}: {
  selected: string | null
  onSelect: (days: DaysId) => void
  onBack: () => void
}) {
  return (
    <div>
      <StepHeading step={3} title="When's your final?" sub="We'll build a day-by-day schedule that fits." />
      <div className="grid gap-2.5 sm:grid-cols-5">
        {DAY_OPTIONS.map((option) => {
          const isSelected = selected === option.id
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(option.id)}
              className={`${selectableCard(isSelected)} flex items-center justify-between gap-3 px-4 py-3.5 sm:flex-col sm:justify-center sm:px-3 sm:py-5 sm:text-center`}
            >
              <span className="text-base font-semibold">{option.label}</span>
              <span className="text-xs text-white/50">{option.sub}</span>
            </button>
          )
        })}
      </div>
      <BackButton onClick={onBack} />
    </div>
  )
}
