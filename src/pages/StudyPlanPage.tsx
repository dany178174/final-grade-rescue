import { useEffect } from 'react'
import { ArrowLeftIcon } from '../components/icons'
import { PlanResult } from '../components/plan/PlanResult'
import { DaysStep, StyleStep, SubjectStep } from '../components/plan/WizardSteps'
import { getDayOption, isLearningStyle, TIER_PLANS } from '../data/plan'
import { getSubject } from '../data/subjects'
import { articleFor, evaluateGrades, formatPercent, gradeParams, inputsFromParams, type TierId } from '../lib/grade'
import { hrefFor, navigate } from '../lib/router'
import { TIER_STYLES } from '../lib/tierStyles'
import { primaryButton, smallButton } from '../lib/ui'

type Answers = { s?: string; o?: string; t?: string; l?: string; days?: string }
type Step = 'subject' | 'style' | 'days' | 'plan'

function readAnswers(params: URLSearchParams): Answers {
  const get = (key: string) => params.get(key)?.trim().slice(0, 60) || undefined
  return { s: get('s'), o: get('o'), t: get('t'), l: get('l'), days: get('days') }
}

function goalSentence(score: number, tier: TierId): string {
  if (tier === 'secured') return 'My grade is already safe, but I still want to do well on it.'
  if (tier === 'impossible') return "Even a 100% won't reach my target grade, so I want the highest score I can get."
  return `I need ${articleFor(score)} ${formatPercent(score)}% on it.`
}

export default function StudyPlanPage({ params }: { params: URLSearchParams }) {
  const inputs = inputsFromParams(params)
  const { fields, outcome } = evaluateGrades(inputs)
  const answers = readAnswers(params)

  const subject = getSubject(answers.s ?? null)
  const rawStyle = answers.l ?? null
  const style = isLearningStyle(rawStyle) ? rawStyle : undefined
  const dayOption = getDayOption(answers.days ?? null)
  const subjectDone = Boolean(subject) && (subject?.id !== 'other' || Boolean(answers.o))

  const requested = params.get('step')
  let step: Step = 'plan'
  if (!subjectDone || requested === 'subject') step = 'subject'
  else if (!style || requested === 'style') step = 'style'
  else if (!dayOption || requested === 'days') step = 'days'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  const go = (next: Answers, nextStep?: Step) =>
    navigate(hrefFor('/plan', { ...gradeParams(inputs), ...next, step: nextStep }))

  const calculatorHref = hrefFor('/', gradeParams(inputs))

  if (outcome.status !== 'ready' || fields.current.status !== 'valid' || fields.desired.status !== 'valid' || fields.weight.status !== 'valid') {
    return (
      <main className="glass-card w-full max-w-md p-8 text-center">
        <p aria-hidden className="text-4xl">
          🧮
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">First, run your numbers</h1>
        <p className="mt-2 text-sm text-white/60">
          Your study plan is built around the score you need. Enter your grades in the calculator to get started.
        </p>
        <a href="#/" className={`${primaryButton} mt-6 w-full`}>
          Open the calculator
        </a>
      </main>
    )
  }

  const { score, tier } = outcome
  const tierStyle = TIER_STYLES[tier]
  const stepNumber = step === 'subject' ? 1 : step === 'style' ? 2 : step === 'days' ? 3 : 4

  return (
    <main className="w-full max-w-3xl">
      <nav className="mb-4 flex items-center justify-between gap-3">
        <a href={calculatorHref} className={smallButton}>
          <ArrowLeftIcon className="size-3.5" />
          Calculator
        </a>
        {step !== 'plan' && (
          <div className="flex items-center gap-1.5" aria-label={`Step ${stepNumber} of 3`}>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`h-1.5 w-8 rounded-full transition ${
                  n <= stepNumber ? 'bg-accent-400' : 'bg-white/15'
                }`}
              />
            ))}
          </div>
        )}
      </nav>

      {step === 'plan' && subject && style && dayOption ? (
        <PlanResult
          subject={subject}
          subjectName={subject.id === 'other' ? answers.o! : subject.name}
          searchName={subject.id === 'other' ? answers.o! : subject.searchTerm}
          topic={answers.t}
          style={style}
          daysId={dayOption.id}
          daysLabel={dayOption.label}
          score={score}
          tier={tier}
          current={fields.current.value}
          desired={fields.desired.value}
          weight={fields.weight.value}
          promptContext={{
            subject: subject.id === 'other' ? answers.o! : subject.promptName,
            topic: answers.t ?? '[your weakest topic]',
            goal: goalSentence(score, tier),
            when: dayOption.promptWhen,
            hours: TIER_PLANS[tier].hoursForPrompt,
          }}
          flashcardsHref={hrefFor('/flashcards', { ...gradeParams(inputs), ...answers })}
          onEdit={() => go(answers, 'subject')}
        />
      ) : (
        <section className="glass-card relative overflow-hidden p-6 sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/[0.08] to-transparent"
          />
          <div className="relative">
            <p className={`mb-6 inline-flex flex-wrap items-center gap-x-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${tierStyle.badge}`}>
              <span aria-hidden>{TIER_PLANS[tier].emoji}</span>
              You need {articleFor(Math.max(0, score))}{' '}
              <span className="font-bold tabular-nums">{formatPercent(Math.max(0, score))}%</span> on the final
            </p>

            {step === 'subject' && (
              <SubjectStep
                key="subject"
                initial={{ s: answers.s, o: answers.o, t: answers.t }}
                onContinue={(a) => go({ ...answers, ...a, o: a.o, t: a.t }, 'style')}
              />
            )}
            {step === 'style' && (
              <StyleStep
                key="style"
                selected={answers.l ?? null}
                onSelect={(l) => go({ ...answers, l }, 'days')}
                onBack={() => go(answers, 'subject')}
              />
            )}
            {step === 'days' && (
              <DaysStep
                key="days"
                selected={answers.days ?? null}
                onSelect={(days) => go({ ...answers, days })}
                onBack={() => go(answers, 'style')}
              />
            )}
          </div>
        </section>
      )}

      {step === 'plan' && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a href={calculatorHref} className={`${smallButton} h-12 flex-1 rounded-2xl text-sm`}>
            <ArrowLeftIcon className="size-4" />
            Back to calculator
          </a>
          <button type="button" onClick={() => go({}, 'subject')} className={`${smallButton} h-12 flex-1 rounded-2xl text-sm`}>
            Plan another subject
          </button>
        </div>
      )}
    </main>
  )
}
