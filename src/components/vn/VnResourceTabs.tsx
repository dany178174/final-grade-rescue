import { useState } from 'react'
import { STYLE_ORDER, type LearningStyle } from '../../data/plan'
import { AI_TOOLS, fillTopic, type PromptTemplate } from '../../data/prompts'
import { youtubeSearch } from '../../data/subjects'
import { VN_STYLE_TIPS, VN_STYLES } from '../../data/vn/plan'
import {
  buildVnPromptTemplates,
  VN_BAD_PROMPT,
  VN_GOOD_PROMPT,
  VN_PROMPT_FORMULA,
  type VnPromptContext,
} from '../../data/vn/prompts'
import {
  googleSiteSearch,
  levelOf,
  vnReadingResources,
  vnVideoResources,
  wikiViSearch,
  type VnSubject,
} from '../../data/vn/subjects'
import { smallButton } from '../../lib/ui'
import { CopyButton } from '../CopyButton'
import { ExternalLinkIcon } from '../icons'
import { ResourceGrid, SearchLink } from '../plan/ResourceCard'

type Props = {
  subject: VnSubject
  subjectName: string
  grade: number
  topic?: string
  examShort: string
  preferred: LearningStyle
  promptContext: VnPromptContext
}

export function VnResourceTabs({ subject, subjectName, grade, topic, examShort, preferred, promptContext }: Props) {
  const [active, setActive] = useState<LearningStyle>(preferred)
  const order = [preferred, ...STYLE_ORDER.filter((s) => s !== preferred)]

  return (
    <div>
      <div role="tablist" aria-label="Cách học" className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/25 p-1">
        {order.map((id) => {
          const style = VN_STYLES[id]
          const selected = active === id
          return (
            <button
              key={id}
              id={`vn-tab-${id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`vn-panel-${id}`}
              onClick={() => setActive(id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 focus-visible:outline-none sm:flex-row sm:gap-2 ${
                selected ? 'bg-white/[0.12] text-white shadow-sm' : 'text-white/55 hover:text-white/85'
              }`}
            >
              <span aria-hidden>{style.emoji}</span>
              <span>{style.label}</span>
              {id === preferred && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-fuchsia-300" />}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-center text-xs text-white/45">
        <span className="mr-1 inline-block size-1.5 rounded-full bg-fuchsia-300 align-middle" /> Cách học bạn chọn
      </p>

      <div id={`vn-panel-${active}`} role="tabpanel" aria-labelledby={`vn-tab-${active}`} className="mt-6">
        {active === 'video' && (
          <VideoPanel subjectName={subjectName} grade={grade} topic={topic} examShort={examShort} />
        )}
        {active === 'ai' && <AiPanel subject={subject} topic={topic} promptContext={promptContext} />}
        {active === 'reading' && <ReadingPanel subject={subject} subjectName={subjectName} grade={grade} topic={topic} />}
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
  const { title, tips } = VN_STYLE_TIPS[style]
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

function VideoPanel({ subjectName, grade, topic, examShort }: { subjectName: string; grade: number; topic?: string; examShort: string }) {
  const what = `${subjectName} lớp ${grade}`
  const searches = [
    topic ? `${topic} ${what}` : `${what} bài giảng`,
    `ôn tập ${examShort} ${what}`,
    `chữa đề kiểm tra ${examShort} ${what}`,
  ]
  return (
    <div className="space-y-7">
      <section>
        <PanelHeading
          title={topic ? `Video cho “${topic}”` : 'Tìm video trong một chạm'}
          sub="Các tìm kiếm đã soạn sẵn đúng môn, đúng lớp, kết quả là video tiếng Việt."
        />
        <div className="flex flex-wrap gap-2">
          {searches.map((q) => (
            <SearchLink key={q} href={youtubeSearch(q)} query={q} where="YouTube" prefix="trên" />
          ))}
        </div>
      </section>
      <section>
        <PanelHeading title="Kênh và nền tảng bài giảng tiếng Việt" sub={`Đã lọc sẵn cho ${what}.`} />
        <ResourceGrid resources={vnVideoResources(subjectName, grade)} />
      </section>
      <TipsBox style="video" />
    </div>
  )
}

function ReadingPanel({ subject, subjectName, grade, topic }: { subject: VnSubject; subjectName: string; grade: number; topic?: string }) {
  const query = `${topic || 'lý thuyết'} ${subjectName} lớp ${grade}`
  return (
    <div className="space-y-7">
      <section>
        <PanelHeading
          title={topic ? `Tài liệu cho “${topic}”` : 'Tìm đúng bài trong một chạm'}
          sub="Mở thẳng kết quả tìm kiếm trên các trang lời giải quen thuộc."
        />
        <div className="flex flex-wrap gap-2">
          <SearchLink href={googleSiteSearch(query, 'loigiaihay.com')} query={query} where="Loigiaihay" prefix="trên" />
          <SearchLink href={googleSiteSearch(query, 'vietjack.com')} query={query} where="VietJack" prefix="trên" />
          {topic && <SearchLink href={wikiViSearch(topic)} query={topic} where="Wikipedia" prefix="trên" />}
        </div>
      </section>
      <section>
        <PanelHeading title="SGK điện tử, lời giải, đề luyện và báo" sub="Tất cả bằng tiếng Việt, đọc miễn phí trên web." />
        <ResourceGrid resources={[...subject.extras, ...vnReadingResources(levelOf(grade))]} />
      </section>
      <TipsBox style="reading" />
    </div>
  )
}

function PromptCard({ prompt, highlight }: { prompt: PromptTemplate; highlight?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <li className={`rounded-2xl border p-4 ${highlight ? 'border-fuchsia-300/30 bg-fuchsia-400/[0.06]' : 'border-white/10 bg-white/[0.04]'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{prompt.title}</p>
          <p className="text-xs text-white/50">{prompt.when}</p>
        </div>
        <CopyButton text={prompt.text} label="Sao chép" copiedLabel="Đã chép!" />
      </div>
      <div className="mt-3 rounded-xl border border-white/5 bg-black/30 p-3.5">
        <p className={`text-sm leading-relaxed text-pretty text-white/80 ${expanded ? '' : 'line-clamp-3'}`}>{prompt.text}</p>
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mt-2 rounded-md text-xs font-medium text-fuchsia-200/80 transition hover:text-fuchsia-100 focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 focus-visible:outline-none"
      >
        {expanded ? 'Thu gọn' : 'Xem toàn bộ câu lệnh'}
      </button>
    </li>
  )
}

function AiPanel({ subject, topic, promptContext }: { subject: VnSubject; topic?: string; promptContext: VnPromptContext }) {
  const templates = buildVnPromptTemplates(promptContext)
  const special: PromptTemplate = {
    id: 'special',
    title: subject.specialPrompt.title,
    when: subject.id === 'khac' ? 'Dành cho môn của bạn' : `Dành riêng cho môn ${subject.name}`,
    text: fillTopic(subject.specialPrompt.text, promptContext.topic),
  }
  const prompts = [templates[0], special, ...templates.slice(1)]

  return (
    <div className="space-y-8">
      <section>
        <PanelHeading
          title="Viết câu lệnh (prompt) như người giỏi"
          sub="Câu lệnh tốt luôn có 4 phần. Học một lần, dùng cho mọi môn."
        />
        <ol className="grid gap-3 sm:grid-cols-2">
          {VN_PROMPT_FORMULA.map((item, i) => (
            <li key={item.part} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 text-xs font-bold">
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
        <PanelHeading title="Thấy ngay sự khác biệt" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-red-400/25 bg-red-400/[0.07] p-4">
            <p className="text-xs font-semibold tracking-wide text-red-300 uppercase">✗ Câu lệnh yếu</p>
            <p className="mt-2 font-medium text-white/85">“{VN_BAD_PROMPT}”</p>
            <p className="mt-2 text-sm text-white/55">
              Không có trình độ, mục tiêu hay định dạng. AI trả về một đoạn chung chung và bạn chẳng nhớ được gì.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold tracking-wide text-emerald-300 uppercase">✓ Câu lệnh tốt</p>
              <CopyButton text={VN_GOOD_PROMPT} label="Sao chép" copiedLabel="Đã chép!" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/85">“{VN_GOOD_PROMPT}”</p>
          </div>
        </div>
      </section>

      <section>
        <PanelHeading
          title="Câu lệnh soạn sẵn cho bạn"
          sub={
            topic
              ? 'Đã điền sẵn môn, lớp, chủ đề và điểm cần đạt. Sao chép, dán, bắt đầu học.'
              : 'Đã điền sẵn môn, lớp và điểm cần đạt. Thay [phần bạn thấy khó nhất] trước khi gửi.'
          }
        />
        <ul className="space-y-3">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} highlight={prompt.id === 'diagnose'} />
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-white/55">Dán vào:</span>
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
        <span className="font-semibold text-amber-200">Dùng AI để học, không phải để chép bài.</span> Đừng dán đề kiểm tra
        đang làm hay bài tập lấy điểm vào AI, trừ khi thầy cô cho phép. Những câu lệnh luyện tập như trên thì luôn được.
      </p>
    </div>
  )
}
