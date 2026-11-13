import { useState } from 'react'
import { LEARNING_STYLES, STYLE_ORDER, STYLE_TIPS, type LearningStyle } from '../../data/plan'
import {
  AI_TOOLS,
  BAD_PROMPT,
  buildPromptTemplates,
  fillTopic,
  GOOD_PROMPT,
  PROMPT_FORMULA,
  type PromptContext,
  type PromptTemplate,
} from '../../data/prompts'
import { wikipediaSearch, youtubeSearch, type Subject } from '../../data/subjects'
import { smallButton } from '../../lib/ui'
import { CopyButton } from '../CopyButton'
import { ExternalLinkIcon } from '../icons'
import { ResourceGrid, SearchLink } from './ResourceCard'

type ResourceTabsProps = {
  subject: Subject
  /** Subject as typed by the learner for "Something else", otherwise the subject's search term. */
  searchName: string
  topic: string | undefined
  preferred: LearningStyle
  promptContext: PromptContext
}

export function ResourceTabs({ subject, searchName, topic, preferred, promptContext }: ResourceTabsProps) {
  const [active, setActive] = useState<LearningStyle>(preferred)
  const order = [preferred, ...STYLE_ORDER.filter((s) => s !== preferred)]

  return (
    <div>
      <div
        role="tablist"
        aria-label="Learning style"
        className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/25 p-1"
      >
        {order.map((id) => {
          const style = LEARNING_STYLES[id]
          const selected = active === id
          return (
            <button
              key={id}
              id={`tab-${id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`panel-${id}`}
              onClick={() => setActive(id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-accent-400/50 focus-visible:outline-none sm:flex-row sm:gap-2 ${
                selected ? 'bg-white/[0.12] text-white shadow-sm' : 'text-white/55 hover:text-white/85'
              }`}
            >
              <span aria-hidden>{style.emoji}</span>
              <span>{style.label}</span>
              {id === preferred && (
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-accent-300" title="Your pick" />
              )}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-center text-xs text-white/45">
        <span className="mr-1 inline-block size-1.5 rounded-full bg-accent-300 align-middle" /> Your pick
      </p>

      <div id={`panel-${active}`} role="tabpanel" aria-labelledby={`tab-${active}`} className="mt-6">
        {active === 'video' && <VideoPanel subject={subject} searchName={searchName} topic={topic} />}
        {active === 'ai' && <AiPanel subject={subject} topic={topic} promptContext={promptContext} />}
        {active === 'reading' && <ReadingPanel subject={subject} topic={topic} />}
      </div>
    </div>
  )
}

function PanelHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-base font-semibold">{title}</h3>
      {sub && <p className="mt-0.5 text-sm text-pretty text-white/55">{sub}</p>}
    </div>
  )
}

function TipsBox({ style }: { style: LearningStyle }) {
  const { title, tips } = STYLE_TIPS[style]
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <h3 className="text-sm font-semibold">💡 {title}</h3>
      <ol className="mt-3 space-y-2.5 text-sm text-white/70">
        {tips.map((tip, i) => (
          <li key={tip} className="flex gap-3">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-semibold text-white/80">
              {i + 1}
            </span>
            <span className="text-pretty">{tip}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function VideoPanel({ subject, searchName, topic }: { subject: Subject; searchName: string; topic?: string }) {
  const focus = topic || searchName
  const searches = [
    `${focus} explained`,
    topic ? `${topic} ${searchName} practice problems` : `${searchName} final exam review`,
    topic ? `${topic} in 10 minutes` : `${searchName} crash course`,
  ]

  return (
    <div className="space-y-7">
      <section>
        <PanelHeading
          title={topic ? `Videos for “${topic}”` : 'Search YouTube in one tap'}
          sub="Hand-picked searches that surface the best explainers first."
        />
        <div className="flex flex-wrap gap-2">
          {searches.map((q) => (
            <SearchLink key={q} href={youtubeSearch(q)} query={q} where="YouTube" />
          ))}
        </div>
      </section>

      <section>
        <PanelHeading title="Teachers worth your time" sub={`Top channels and courses for ${searchName}.`} />
        <ResourceGrid resources={subject.videos} />
      </section>

      <TipsBox style="video" />
    </div>
  )
}

function ReadingPanel({ subject, topic }: { subject: Subject; topic?: string }) {
  return (
    <div className="space-y-7">
      <section>
        <PanelHeading
          title="Free textbooks, articles & guides"
          sub="All free to read online. Start with the textbook chapter for your weakest topic."
        />
        <ResourceGrid resources={subject.reading} />
      </section>

      {topic && (
        <section>
          <PanelHeading title="Quick look-up" sub="A fast overview before you dive into the textbook." />
          <SearchLink href={wikipediaSearch(topic)} query={topic} where="Wikipedia" />
        </section>
      )}

      <TipsBox style="reading" />
    </div>
  )
}

function PromptCard({ prompt, highlight }: { prompt: PromptTemplate; highlight?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <li
      className={`rounded-2xl border p-4 ${
        highlight ? 'border-accent-300/30 bg-accent-400/[0.06]' : 'border-white/10 bg-white/[0.04]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{prompt.title}</p>
          <p className="text-xs text-white/50">{prompt.when}</p>
        </div>
        <CopyButton text={prompt.text} />
      </div>
      <div className="mt-3 rounded-xl border border-white/5 bg-black/30 p-3.5">
        <p className={`text-sm leading-relaxed text-pretty text-white/80 ${expanded ? '' : 'line-clamp-3'}`}>
          {prompt.text}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mt-2 rounded-md text-xs font-medium text-accent-200/80 transition hover:text-accent-100 focus-visible:ring-2 focus-visible:ring-accent-400/50 focus-visible:outline-none"
      >
        {expanded ? 'Show less' : 'Show full prompt'}
      </button>
    </li>
  )
}

function AiPanel({ subject, topic, promptContext }: { subject: Subject; topic?: string; promptContext: PromptContext }) {
  const templates = buildPromptTemplates(promptContext)
  const special: PromptTemplate = {
    id: 'special',
    title: subject.specialPrompt.title,
    when: `Made for ${subject.id === 'other' ? 'your subject' : subject.name}`,
    text: fillTopic(subject.specialPrompt.text, promptContext.topic),
  }
  // The subject-specific prompt goes right after the diagnostic one.
  const prompts = [templates[0], special, ...templates.slice(1)]

  return (
    <div className="space-y-8">
      <section>
        <PanelHeading
          title="Write prompts like a pro"
          sub="Every great prompt has the same 4 parts. Learn them once, use them for every class."
        />
        <ol className="grid gap-3 sm:grid-cols-2">
          {PROMPT_FORMULA.map((item, i) => (
            <li key={item.part} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-7 place-items-center rounded-lg bg-accent-500 text-xs font-bold text-on-accent">
                  {i + 1}
                </span>
                <span className="font-semibold">{item.part}</span>
              </div>
              <p className="mt-2.5 text-sm text-white/85 italic">“{item.example}”</p>
              <p className="mt-1.5 text-xs text-white/50">{item.why}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <PanelHeading title="See the difference" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-red-400/25 bg-red-400/[0.07] p-4">
            <p className="text-xs font-semibold tracking-wide text-red-300 uppercase">✗ Weak prompt</p>
            <p className="mt-2 font-medium text-white/85">“{BAD_PROMPT}”</p>
            <p className="mt-2 text-sm text-white/55">
              No level, no goal, no format. You get a generic wall of text and learn nothing.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold tracking-wide text-emerald-300 uppercase">✓ Strong prompt</p>
              <CopyButton text={GOOD_PROMPT} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/85">“{GOOD_PROMPT}”</p>
          </div>
        </div>
      </section>

      <section>
        <PanelHeading
          title="Your ready-to-use prompts"
          sub={
            topic
              ? `Already filled in with your subject, topic and goal. Copy, paste, go.`
              : 'Already filled in with your subject and goal. Replace [your weakest topic] before sending.'
          }
        />
        <ul className="space-y-3">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} highlight={prompt.id === 'diagnose'} />
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-white/55">Paste into:</span>
          {AI_TOOLS.map((tool) => (
            <a key={tool.name} href={tool.url} target="_blank" rel="noopener noreferrer" className={smallButton}>
              {tool.name}
              <ExternalLinkIcon className="size-3.5 text-white/50" />
            </a>
          ))}
        </div>
      </section>

      <TipsBox style="ai" />

      <p className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-pretty text-amber-100/85">
        <span className="font-semibold text-amber-200">Use AI to learn, not to cheat.</span> Don't paste graded
        assignments or take-home exam questions unless your teacher allows it. Practice prompts like these are
        always fair game.
      </p>
    </div>
  )
}
