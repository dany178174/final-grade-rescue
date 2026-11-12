import { useEffect, useState, type ReactNode } from 'react'
import {
  HABITS,
  LEARNING_STYLES,
  SCHEDULES,
  STYLE_ACTIONS,
  TIER_PLANS,
  type DaysId,
  type LearningStyle,
} from '../../data/plan'
import type { PromptContext } from '../../data/prompts'
import { STUDY_TOOLS, type Subject } from '../../data/subjects'
import { courseGradeWith, formatPercent, type TierId } from '../../lib/grade'
import { TIER_STYLES } from '../../lib/tierStyles'
import { copyText, smallButton } from '../../lib/ui'
import { CheckIcon, ShareIcon } from '../icons'
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
  onEdit: () => void
}

function Section({ emoji, title, sub, children }: { emoji: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="glass-card p-5 sm:p-8">
      <h2 className="flex items-start gap-2.5 text-lg leading-snug font-semibold tracking-tight sm:text-xl">
        <span aria-hidden>{emoji}</span>
        {title}
      </h2>
      {sub && <p className="mt-1 text-sm text-pretty text-white/55">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Stat({ label, value, valueClass = 'text-white' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
      <dt className="text-[11px] font-medium tracking-wide text-white/50 uppercase">{label}</dt>
      <dd className={`mt-1 text-lg font-semibold tracking-tight tabular-nums ${valueClass}`}>{value}</dd>
    </div>
  )
}

function ShareButton() {
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
        await navigator.share({ title: 'My final exam study plan', url })
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
      {copied ? 'Link copied!' : 'Share plan'}
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
            <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-white/75">
              <span aria-hidden>{subject.emoji}</span> {subjectName}
            </span>
            <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-white/75">
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
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 text-xs font-bold">
                {i + 1}
              </span>
              <span className="pt-0.5 text-pretty">{item}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section emoji="🗓️" title="Day-by-day schedule" sub={`Built for ${daysLabel.toLowerCase()}. Steps marked ${styleInfo.emoji} use your ${styleInfo.label} resources below.`}>
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/80">
          ⏱️ Daily target: <span className="font-semibold text-white">{plan.hours}</span>
        </p>
        <Schedule daysId={daysId} style={style} />
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
    </div>
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

function Schedule({ daysId, style }: { daysId: DaysId; style: LearningStyle }) {
  const actions = STYLE_ACTIONS[style]
  const styleEmoji = LEARNING_STYLES[style].emoji

  return (
    <ol className="relative ml-1.5 space-y-6 border-l border-white/15 pl-6">
      {SCHEDULES[daysId].map((phase) => (
        <li key={phase.when} className="relative">
          <span
            aria-hidden
            className="absolute top-1 -left-[1.95rem] size-3.5 rounded-full border-2 border-fuchsia-300 bg-[#0b0c24] shadow-[0_0_12px_rgb(240_171_252/0.6)]"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-xs font-semibold text-fuchsia-200">
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
                  <span className={`text-pretty ${styled ? 'text-white/90' : ''}`}>{text}</span>
                </li>
              )
            })}
          </ul>
        </li>
      ))}
    </ol>
  )
}
