import { useState, type ReactNode } from 'react'
import { STYLE_ORDER, type LearningStyle } from '../../data/plan'
import { VN_DAY_OPTIONS, VN_STYLES } from '../../data/vn/plan'
import { getVnSubject, levelOf, subjectsFor, VN_GRADES } from '../../data/vn/subjects'
import { primaryButton, selectableCard } from '../../lib/ui'
import { ArrowLeftIcon, ArrowRightIcon } from '../icons'

export type VnSubjectAnswer = { lop: string; mon: string; khac?: string; cd?: string }

function StepHeading({ step, title, sub }: { step: number; title: string; sub: string }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold tracking-[0.14em] text-accent-200/80 uppercase">Bước {step}/3</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
      <p className="mt-1.5 text-sm text-pretty text-white/60 sm:text-base">{sub}</p>
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
      Quay lại
    </button>
  )
}

function TextField({
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
}: {
  id: string
  label: ReactNode
  hint?: string
  placeholder: string
  value: string
  onChange: (value: string) => void
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

export function VnSubjectStep({
  initial,
  onContinue,
}: {
  initial: Partial<VnSubjectAnswer>
  onContinue: (answer: VnSubjectAnswer) => void
}) {
  const [grade, setGrade] = useState(Number(initial.lop) || 0)
  const [subjectId, setSubjectId] = useState(initial.mon ?? '')
  const [other, setOther] = useState(initial.khac ?? '')
  const [topic, setTopic] = useState(initial.cd ?? '')

  const subjects = grade ? subjectsFor(grade) : []
  const subject = getVnSubject(subjectId)
  const subjectValid = Boolean(subject && grade && subject.levels.includes(levelOf(grade)))
  const isOther = subject?.id === 'khac'
  const canContinue = subjectValid && (!isOther || other.trim().length > 0)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!canContinue) return
        onContinue({
          lop: String(grade),
          mon: subjectId,
          khac: isOther ? other.trim() : undefined,
          cd: topic.trim() || undefined,
        })
      }}
    >
      <StepHeading step={1} title="Bạn học lớp mấy, môn gì?" sub="Mình sẽ chọn tài liệu đúng chương trình cho bạn." />

      <p className="mb-2 text-sm font-medium text-white/85">Lớp</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {VN_GRADES.map(({ grade: g, level }) => (
          <button
            key={g}
            type="button"
            aria-pressed={grade === g}
            onClick={() => setGrade(g)}
            className={`${selectableCard(grade === g)} flex h-14 flex-col items-center justify-center`}
          >
            <span className="text-base font-semibold">Lớp {g}</span>
            <span className="text-[10px] tracking-wide text-white/45 uppercase">{level === 'thcs' ? 'THCS' : 'THPT'}</span>
          </button>
        ))}
      </div>

      {grade > 0 && (
        <>
          <p className="mt-6 mb-2 text-sm font-medium text-white/85">Môn học</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {subjects.map((s) => {
              const selected = s.id === subjectId
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSubjectId(s.id)}
                  className={`${selectableCard(selected)} flex min-h-[5.5rem] flex-col items-start gap-1 p-3.5`}
                >
                  <span aria-hidden className="text-2xl leading-none">
                    {s.emoji}
                  </span>
                  <span className="mt-1 text-sm leading-tight font-semibold">{s.name}</span>
                  <span className="text-xs leading-snug text-white/50">{s.note}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {subjectValid && (
        <div className="mt-6 space-y-4">
          {isOther && (
            <TextField id="other-subject" label="Tên môn" placeholder="VD: Tiếng Pháp, Ngoại ngữ 2" value={other} onChange={setOther} />
          )}
          <TextField
            id="topic"
            label={
              <>
                Chủ đề hoặc bài bạn thấy khó nhất <span className="font-normal text-white/45">(không bắt buộc)</span>
              </>
            }
            hint="Dùng để tìm đúng video, tài liệu và soạn câu lệnh AI cho bạn."
            placeholder={subject?.topicExample ?? 'VD: chủ đề bạn thấy khó nhất'}
            value={topic}
            onChange={setTopic}
          />
        </div>
      )}

      <button type="submit" disabled={!canContinue} className={`${primaryButton} mt-6 w-full`}>
        Tiếp tục
        <ArrowRightIcon className="size-4" />
      </button>
    </form>
  )
}

export function VnStyleStep({
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
      <StepHeading step={2} title="Bạn học kiểu nào hiệu quả nhất?" sub="Chọn một cách. Bạn vẫn đổi được trong kế hoạch." />
      <div className="grid gap-3 sm:grid-cols-3">
        {STYLE_ORDER.map((id) => {
          const style = VN_STYLES[id]
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

export function VnDaysStep({
  selected,
  onSelect,
  onBack,
}: {
  selected: string | null
  onSelect: (days: string) => void
  onBack: () => void
}) {
  return (
    <div>
      <StepHeading step={3} title="Còn bao lâu đến ngày kiểm tra?" sub="Mình sẽ chia lịch ôn từng ngày cho vừa." />
      <div className="grid gap-2.5 sm:grid-cols-5">
        {VN_DAY_OPTIONS.map((option) => {
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
