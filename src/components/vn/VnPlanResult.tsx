import { type LearningStyle } from '../../data/plan'
import { STUDY_TOOLS } from '../../data/subjects'
import { VN_HABITS, VN_SCHEDULES, VN_STYLE_ACTIONS, VN_STYLES, VN_TIER_PLANS } from '../../data/vn/plan'
import type { VnPromptContext } from '../../data/vn/prompts'
import type { VnSubject } from '../../data/vn/subjects'
import { TIER_STYLES } from '../../lib/tierStyles'
import { primaryButton, smallButton } from '../../lib/ui'
import { averageWith, formatAverage, formatVi, type VnOutcome } from '../../lib/vnGrade'
import { RATINGS, useFeedback } from '../feedback/FeedbackContext'
import { ArrowRightIcon } from '../icons'
import { SessionLinks } from '../SessionLinks'
import { sessionContent } from '../../data/vn/sessionContent'
import { hrefFor } from '../../lib/router'
import { Section, ShareButton, Stat, Timeline } from '../plan/PlanResult'
import { ResourceCard } from '../plan/ResourceCard'
import { VnResourceTabs } from './VnResourceTabs'

type Ready = Extract<VnOutcome, { status: 'ready' }>

export type VnPlanResultProps = {
  outcome: Ready
  subject: VnSubject
  subjectName: string
  grade: number
  topic?: string
  style: LearningStyle
  daysId: string
  daysLabel: string
  exam: { name: string; short: string }
  promptContext: VnPromptContext
  flashcardsHref: string
  onEdit: () => void
}

const TOOL_NOTES: Record<string, string> = {
  Anki: 'Thẻ ghi nhớ miễn phí, tự nhắc ôn đúng lúc bạn sắp quên.',
  Quizlet: 'Tạo thẻ nhanh hoặc dùng bộ thẻ người khác đã làm sẵn. Có giao diện tiếng Việt.',
}

export function VnPlanResult(props: VnPlanResultProps) {
  const { outcome, subject, subjectName, grade, topic, style, daysId, daysLabel, exam } = props
  const plan = VN_TIER_PLANS[outcome.tier]
  const tierStyle = TIER_STYLES[outcome.tier]
  const styleInfo = VN_STYLES[style]
  const isYear = exam.short === 'học kì 2'
  const contentArgs = {
    mode: style,
    subjectName,
    grade,
    topic,
    examShort: exam.short === 'học kì 2' ? 'cuối kì' : exam.short,
    prompt: props.promptContext,
    flashcardsHref: props.flashcardsHref,
  }
  // Each learning step in the schedule carries the resources to do it right away.
  const scheduleActions = {
    learn: (
      <>
        {VN_STYLE_ACTIONS[style].learn}
        <SessionLinks links={sessionContent({ ...contentArgs, phase: 'learn' }).links} copiedLabel="Đã chép!" />
      </>
    ),
    review: (
      <>
        {VN_STYLE_ACTIONS[style].review}
        <SessionLinks links={sessionContent({ ...contentArgs, phase: 'review' }).links} copiedLabel="Đã chép!" />
      </>
    ),
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="glass-card relative overflow-hidden p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/[0.08] to-transparent"
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold ${tierStyle.badge}`}>
              <span aria-hidden>{plan.emoji}</span> Chế độ {plan.mode}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/75">
              <span aria-hidden>{subject.emoji}</span> {subjectName} lớp {grade}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/75">
              <span aria-hidden>{styleInfo.emoji}</span> {styleInfo.label}
            </span>
          </div>

          <h1 className="mt-4 text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
            Kế hoạch ôn {subjectName} lớp {grade}
          </h1>
          <p className={`mt-1.5 text-lg font-medium ${tierStyle.text}`}>{plan.headline}</p>
          <p className="mt-3 text-sm text-pretty text-white/70 sm:text-base">{plan.summary}</p>

          <dl className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            <Stat label={`Cần ở ${exam.short}`} value={`${formatVi(Math.max(0, outcome.score))} điểm`} valueClass={tierStyle.text} />
            <Stat label="Thời gian học" value={plan.hours} />
            <Stat label="Còn lại" value={daysLabel} />
            {outcome.tier === 'impossible' ? (
              <Stat label="ĐTB cao nhất có thể" value={formatAverage(averageWith(outcome, 10))} valueClass="text-sky-300" />
            ) : (
              <Stat label="Mục tiêu ĐTB" value={formatAverage(outcome.target)} />
            )}
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <ShareButton title="Kế hoạch ôn thi của mình" label="Chia sẻ kế hoạch" copiedLabel="Đã chép link!" />
            <button type="button" onClick={props.onEdit} className={smallButton}>
              Sửa câu trả lời
            </button>
          </div>
        </div>
      </section>

      <Section
        emoji="🔮"
        title="Điểm bài tới ảnh hưởng thế nào?"
        sub={
          outcome.remaining.length === 1
            ? `Điểm trung bình ${isYear ? 'cả năm' : 'môn học kì'} của bạn ứng với từng mức điểm ở ${outcome.remaining[0].short}.`
            : `Điểm trung bình môn học kì của bạn nếu ${outcome.remaining.length} bài còn lại đều được mức điểm đó.`
        }
      >
        <VnScenarioTable outcome={outcome} />
      </Section>

      <Section emoji="🧭" title="Chiến lược của bạn" sub={`Cần tập trung vào đâu ở chế độ ${plan.mode.toLowerCase()}.`}>
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

      <Section
        emoji="🗓️"
        title="Lịch ôn từng ngày"
        sub={`Chia cho ${daysLabel.toLowerCase()}. Những việc có biểu tượng ${styleInfo.emoji} dùng tài liệu "${styleInfo.label}" bên dưới.`}
      >
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80">
          ⏱️ Mỗi ngày: <span className="font-semibold text-white">{plan.hours}</span>
        </p>
        <Timeline phases={VN_SCHEDULES[daysId]} actions={scheduleActions} styleEmoji={styleInfo.emoji} />
      </Section>

      <Section emoji="🎒" title="Tài liệu học" sub="Toàn bộ bằng tiếng Việt. Bấm từng tab để đổi cách học.">
        <VnResourceTabs
          subject={subject}
          subjectName={subjectName}
          grade={grade}
          topic={topic}
          examShort={exam.short}
          preferred={style}
          promptContext={props.promptContext}
        />
      </Section>

      <Section
        emoji="🃏"
        title={topic ? `Thẻ ghi nhớ cho “${topic}”` : 'Tạo thẻ ghi nhớ trong 2 phút'}
        sub="AI soạn thẻ, bạn học ngay trên web, rồi đưa sang Quizlet hoặc Anki chỉ bằng một lần dán."
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <ul className="space-y-1.5 text-sm text-white/70">
            <li>✨ Câu lệnh soạn sẵn cho mọi ứng dụng AI</li>
            <li>🔄 Lật thẻ, đánh dấu “đã thuộc” và “chưa thuộc”</li>
            <li>📲 Xuất sang Quizlet, Anki trong một chạm</li>
          </ul>
          <a href={props.flashcardsHref} className={`${primaryButton} shrink-0`}>
            Mở trang tạo thẻ
            <ArrowRightIcon className="size-4" />
          </a>
        </div>
      </Section>

      <Section
        emoji="🗓️"
        title="Có nhiều môn cùng thi?"
        sub="Lập một thời gian biểu chung cho tất cả các môn, có giờ cụ thể, ưu tiên môn thi sớm và môn cần nhiều điểm."
      >
        <a
          href={hrefFor('/vn/lich-on', {
            lop: String(grade),
            mon: subject.id,
            khac: subject.id === 'khac' ? subjectName : undefined,
            cd: topic,
            them: String(Math.max(0, outcome.score)),
            loai: exam.short === 'giữa kì' ? 'gk' : exam.short === 'kiểm tra 15 phút' ? 'tx' : 'ck',
          })}
          className={`${primaryButton} w-full sm:w-auto`}
        >
          Lập lịch ôn nhiều môn
          <ArrowRightIcon className="size-4" />
        </a>
      </Section>

      <Section emoji="⚡" title="Học thông minh, không cần học lâu" sub="Thói quen hiệu quả với mọi môn và mọi người.">
        <ul className="grid gap-3 sm:grid-cols-2">
          {VN_HABITS.map((habit) => (
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
        <p className="mt-6 mb-3 text-sm font-semibold text-white/80">Ứng dụng thẻ ghi nhớ miễn phí</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {STUDY_TOOLS.map((tool) => (
            <li key={tool.url}>
              <ResourceCard resource={{ ...tool, kind: 'Công cụ', note: TOOL_NOTES[tool.title] ?? tool.note }} />
            </li>
          ))}
        </ul>
      </Section>

      <VnPlanFeedback />
    </div>
  )
}

function VnPlanFeedback() {
  const feedback = useFeedback()
  if (!feedback.enabled) return null
  return (
    <section className="glass-card flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:justify-between sm:p-6 sm:text-left">
      <div>
        <h2 className="font-semibold">Kế hoạch này có hữu ích không?</h2>
        <p className="text-sm text-white/55">Chạm một biểu tượng. Chỉ mất 5 giây và giúp web tốt hơn.</p>
      </div>
      <div className="flex gap-1.5">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            type="button"
            aria-label={r.labelVi}
            title={r.labelVi}
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

function VnScenarioTable({ outcome }: { outcome: Ready }) {
  const scores = [5, 6, 7, 8, 9, 10]
  const columns = 'grid grid-cols-[3rem_1fr_2.75rem_5.25rem] items-center gap-2 sm:grid-cols-[4rem_1fr_3.5rem_6rem] sm:gap-3'
  return (
    <div>
      <div className={`${columns} mb-2 text-[11px] font-medium tracking-wide text-white/45 uppercase`}>
        <span>Được</span>
        <span />
        <span className="text-right">ĐTB</span>
        <span />
      </div>
      <ul className="space-y-2.5">
        {scores.map((score) => {
          const average = averageWith(outcome, score)
          const reached = average >= outcome.target
          const gap = Math.round((outcome.target - average) * 10) / 10
          return (
            <li key={score} className={`${columns} text-sm`}>
              <span className="font-semibold tabular-nums">{score} điểm</span>
              <span className="relative h-2 overflow-hidden rounded-full bg-white/10" aria-hidden>
                <span
                  className={`absolute inset-y-0 left-0 rounded-full ${reached ? 'bg-emerald-400' : 'bg-white/35'}`}
                  style={{ width: `${Math.min(100, average * 10)}%` }}
                />
              </span>
              <span className={`text-right font-semibold tabular-nums ${reached ? 'text-emerald-300' : 'text-white/80'}`}>
                {formatAverage(average)}
              </span>
              <span
                className={`justify-self-end rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase ${
                  reached ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/[0.06] text-white/45'
                }`}
              >
                {reached ? 'Đạt ✓' : `Thiếu ${formatVi(gap)}`}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
