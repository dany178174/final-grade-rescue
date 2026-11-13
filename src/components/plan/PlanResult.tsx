import { useEffect, useState, type ReactNode } from 'react'
import { SectionCard } from '../SectionCard'
import {
  HABITS,
  LEARNING_STYLES,
  SCHEDULES,
  STYLE_ACTIONS,
  TIER_PLANS,
  type DaysId,
  type SchedulePhase,
  type LearningStyle,
} from '../../data/plan'
import { buildPromptTemplates, type PromptContext } from '../../data/prompts'
import { STUDY_TOOLS, youtubeSearch, type Subject } from '../../data/subjects'
import { courseGradeWith, formatPercent, type TierId } from '../../lib/grade'
import { TIER_STYLES } from '../../lib/tierStyles'
import { copyText, primaryButton, smallButton } from '../../lib/ui'
import { RATINGS, useFeedback } from '../feedback/FeedbackContext'
import { ArrowRightIcon, CheckIcon, ShareIcon } from '../icons'
import { SessionLinks, type LinkItem } from '../SessionLinks'
import { ResourceCard } from './ResourceCard'
import { ResourceTabs } from './ResourceTabs'

export type PlanResultProps = {
  subject: Subject
  subjectName: string
  searchName: string
  topic?: string
  style: LearningStyle
  daysId: DaysId
  daysLabel: string
  score: number
  tier: TierId
  current: number
  desired: number
  weight: number
  promptContext: PromptContext
  flashcardsHref: string
  onEdit: () => void
}

export function Section({ emoji, title, sub, children }: { emoji: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <SectionCard emoji={emoji} title={title} sub={sub}>
      {children}
    </SectionCard>
  )
}

export function Stat({ label, value, valueClass = 'text-white' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
      <dt className="text-[11px] font-medium tracking-wide text-white/50 uppercase">{label}</dt>
      <dd className={`mt-1 text-lg font-semibold tracking-tight tabular-nums ${valueClass}`}>{value}</dd>
    </div>
  )
}

export function ShareButton({
  title = 'My final exam study plan',
  label = 'Share plan',
  copiedLabel = 'Link copied!',
}: {
  title?: string
  label?: string
  copiedLabel?: string
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // The share sheet was closed; nothing to do.
      }
      return
    }
    setCopied(await copyText(url))
  }

  return (
    <button type="button" onClick={share} className={smallButton}>
      {copied ? <CheckIcon className="size-3.5" /> : <ShareIcon className="size-3.5" />}
      {copied ? copiedLabel : label}
    </button>
  )
}

export function PlanResult(props: PlanResultProps) {
  const { subject, subjectName, searchName, topic, style, daysId, daysLabel, score, tier, current, desired, weight } =
    props
  const plan = TIER_PLANS[tier]
  const tierStyle = TIER_STYLES[tier]
  const styleInfo = LEARNING_STYLES[style]
  const maxGrade = courseGradeWith(current, weight, 100)

  // Each learning step in the schedule carries the resources to do it right away.
  const prompts = Object.fromEntries(buildPromptTemplates(props.promptContext).map((p) => [p.id, p.text]))
  const focus = topic || searchName
  const learnLinks: LinkItem[] =
    style === 'video'
      ? [{ kind: 'link', label: '🎬 Watch videos', href: youtubeSearch(`${focus} explained`) }]
      : style === 'ai'
        ? [{ kind: 'copy', label: '🤖 Copy prompt', text: prompts.explain }]
        : subject.reading.slice(0, 1).map((r) => ({ kind: 'link' as const, label: `📚 ${r.title}`, href: r.url }))
  const reviewLinks: LinkItem[] = [
    { kind: 'link', label: '🃏 Flashcards', href: props.flashcardsHref },
    style === 'video'
      ? { kind: 'link', label: '🎬 Review videos', href: youtubeSearch(`${searchName} final exam review`) }
      : style === 'ai'
        ? { kind: 'copy', label: '🤖 Copy prompt', text: prompts.fix }
        : { kind: 'link', label: '📝 Practice', href: youtubeSearch(`${focus} practice problems`) },
  ]
  const scheduleActions = {
    learn: (
      <>
        {STYLE_ACTIONS[style].learn}
        <SessionLinks links={learnLinks} copiedLabel="Copied!" />
      </>
    ),
    review: (
      <>
        {STYLE_ACTIONS[style].review}
        <SessionLinks links={reviewLinks} copiedLabel="Copied!" />
      </>
    ),
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Overview */}
      <section className="glass-card relative overflow-hidden p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/[0.08] to-transparent"
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold ${tierStyle.badge}`}>
              <span aria-hidden>{plan.emoji}</span> {plan.mode} mode
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/75">
              <span aria-hidden>{subject.emoji}</span> {subjectName}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/75">
              <span aria-hidden>{styleInfo.emoji}</span> {styleInfo.label}
            </span>
          </div>

          <h1 className="mt-4 text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
            Your {subjectName} game plan
          </h1>
          <p className={`mt-1.5 text-lg font-medium ${tierStyle.text}`}>{plan.headline}</p>
          <p className="mt-3 text-sm text-pretty text-white/70 sm:text-base">{plan.summary}</p>

          <dl className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            <Stat label="Need on final" value={`${formatPercent(Math.max(0, score))}%`} valueClass={tierStyle.text} />
            <Stat label="Study time" value={plan.hours} />
            <Stat label="Time left" value={daysLabel} />
            {tier === 'impossible' ? (
              <Stat label="Max grade possible" value={`${formatPercent(maxGrade)}%`} valueClass="text-sky-300" />
            ) : (
              <Stat label="Target grade" value={`${formatPercent(desired)}%`} />
            )}
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <ShareButton />
            <button type="button" onClick={props.onEdit} className={smallButton}>
              Edit answers
            </button>
          </div>
        </div>
      </section>

      <Section emoji="🔮" title="What your final score does to your grade" sub="Your course grade for each possible final exam score.">
        <ScenarioTable current={current} desired={desired} weight={weight} />
      </Section>

      <Section emoji="🧭" title="Your strategy" sub={`What to focus on in ${plan.mode.toLowerCase()} mode.`}>
        <ol className="space-y-3">
          {plan.strategy.map((item, i) => (
            <li key={item} className="flex gap-3.5 text-sm text-white/80 sm:text-base">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-500 text-xs font-bold">
                {i + 1}
              </span>
              <span className="pt-0.5 text-pretty">{item}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section emoji="🗓️" title="Day-by-day schedule" sub={`Built for ${daysLabel.toLowerCase()}. Steps marked ${styleInfo.emoji} use your ${styleInfo.label} resources below.`}>
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80">
          ⏱️ Daily target: <span className="font-semibold text-white">{plan.hours}</span>
        </p>
        <Timeline phases={SCHEDULES[daysId]} actions={scheduleActions} styleEmoji={styleInfo.emoji} />
      </Section>

      <Section
        emoji="🎒"
        title="Your study resources"
        sub="Free, trusted picks for your subject. Tap a tab to switch how you learn."
      >
        <ResourceTabs
          subject={subject}
          searchName={searchName}
          topic={topic}
          preferred={style}
          promptContext={props.promptContext}
        />
      </Section>

      <Section
        emoji="🃏"
        title={topic ? `Flashcards for “${topic}”` : 'Make flashcards in 2 minutes'}
        sub="AI writes the cards, you study them here, then import them to Quizlet or Anki with one paste."
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <ul className="space-y-1.5 text-sm text-white/70">
            <li>✨ A ready-made prompt for any AI chat</li>
            <li>🔄 Flip cards with “got it” and “still learning”</li>
            <li>📲 One-tap export for Quizlet and Anki</li>
          </ul>
          <a href={props.flashcardsHref} className={`${primaryButton} shrink-0`}>
            Open Flashcard Maker
            <ArrowRightIcon className="size-4" />
          </a>
        </div>
      </Section>

      <Section emoji="⚡" title="Study smarter, not longer" sub="Habits that work for every subject and every learner.">
        <ul className="grid gap-3 sm:grid-cols-2">
          {HABITS.map((habit) => (
            <li key={habit.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="font-semibold">
                <span aria-hidden className="mr-2">
                  {habit.emoji}
                </span>
                {habit.title}
              </p>
              <p className="mt-1 text-sm text-pretty text-white/65">{habit.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 mb-3 text-sm font-semibold text-white/80">Free flashcard apps</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {STUDY_TOOLS.map((tool) => (
            <li key={tool.url}>
              <ResourceCard resource={tool} />
            </li>
          ))}
        </ul>
      </Section>

      <PlanFeedback />
    </div>
  )
}

function PlanFeedback() {
  const feedback = useFeedback()
  if (!feedback.enabled) return null
  return (
    <section className="glass-card flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:justify-between sm:p-6 sm:text-left">
      <div>
        <h2 className="font-semibold">Was this plan helpful?</h2>
        <p className="text-sm text-white/55">Tap a face. It takes 5 seconds and helps us improve.</p>
      </div>
      <div className="flex gap-1.5">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            type="button"
            aria-label={r.label}
            title={r.label}
            onClick={() => feedback.open(r.value)}
            className="grid size-11 place-items-center rounded-2xl border border-white/12 bg-white/[0.05] text-2xl transition hover:scale-110 hover:bg-white/[0.1] focus-visible:ring-4 focus-visible:ring-accent-500/25 focus-visible:outline-none"
          >
            {r.emoji}
          </button>
        ))}
      </div>
    </section>
  )
}

function ScenarioTable({ current, desired, weight }: { current: number; desired: number; weight: number }) {
  const scores = [60, 70, 80, 90, 100]
  const columns = 'grid grid-cols-[2.75rem_1fr_3.5rem_4.75rem] items-center gap-2 sm:grid-cols-[3.5rem_1fr_4rem_5.5rem] sm:gap-3'
  return (
    <div>
      <div className={`${columns} mb-2 text-[11px] font-medium tracking-wide text-white/45 uppercase`}>
        <span>Final</span>
        <span />
        <span className="text-right">Grade</span>
        <span />
      </div>
      <ul className="space-y-2.5">
        {scores.map((finalScore) => {
          const grade = Math.round(courseGradeWith(current, weight, finalScore) * 100) / 100
          const reached = grade >= desired
          const gap = Math.round((desired - grade) * 100) / 100
          return (
            <li key={finalScore} className={`${columns} text-sm`}>
              <span className="font-semibold tabular-nums">{finalScore}%</span>
              <span className="relative h-2 overflow-hidden rounded-full bg-white/10" aria-hidden>
                <span
                  className={`absolute inset-y-0 left-0 rounded-full ${reached ? 'bg-emerald-400' : 'bg-white/35'}`}
                  style={{ width: `${Math.min(100, Math.max(0, grade))}%` }}
                />
              </span>
              <span className={`text-right font-semibold tabular-nums ${reached ? 'text-emerald-300' : 'text-white/80'}`}>
                {formatPercent(grade)}%
              </span>
              <span
                className={`justify-self-end rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase ${
                  reached ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/[0.06] text-white/45'
                }`}
              >
                {reached ? 'Target ✓' : `${formatPercent(gap)} short`}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** A vertical schedule. Tasks written as {learn} or {review} become the learner's style-specific actions. */
export function Timeline({
  phases,
  actions,
  styleEmoji,
}: {
  phases: SchedulePhase[]
  actions: { learn: ReactNode; review: ReactNode }
  styleEmoji: string
}) {
  return (
    <ol className="relative ml-1.5 space-y-6 border-l border-white/15 pl-6">
      {phases.map((phase) => (
        <li key={phase.when} className="relative">
          <span
            aria-hidden
            className="absolute top-1 -left-[1.95rem] size-3.5 rounded-full border-2 border-accent-300 bg-ink-950 shadow-[0_0_12px_rgb(240_171_252/0.6)]"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-xs font-semibold text-accent-200">
              {phase.when}
            </span>
            <h3 className="font-semibold">{phase.title}</h3>
          </div>
          <ul className="mt-2.5 space-y-2 text-sm text-white/75">
            {phase.tasks.map((task) => {
              const styled = task === '{learn}' || task === '{review}'
              const text = task === '{learn}' ? actions.learn : task === '{review}' ? actions.review : task
              return (
                <li key={task} className="flex gap-2.5">
                  {styled ? (
                    <span aria-hidden className="shrink-0 text-base leading-5">
                      {styleEmoji}
                    </span>
                  ) : (
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-white/35" />
                  )}
                  <span className={`min-w-0 text-pretty ${styled ? 'text-white/90' : ''}`}>{text}</span>
                </li>
              )
            })}
          </ul>
        </li>
      ))}
    </ol>
  )
}
