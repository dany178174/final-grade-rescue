import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { SectionCard } from '../../components/SectionCard'
import { SessionLinks } from '../../components/SessionLinks'
import { ArrowLeftIcon, CheckIcon, ShareIcon } from '../../components/icons'
import { ScoreInput } from '../../components/vn/ScoreInput'
import { MODE_EMOJI, PHASE_LABELS, sessionContent, type SessionLink } from '../../data/vn/sessionContent'
import { getVnSubject, levelOf, subjectsFor, VN_GRADES, type VnSubject } from '../../data/vn/subjects'
import type { TierId } from '../../lib/grade'
import { hrefFor } from '../../lib/router'
import { copyText, primaryButton, secondaryButton, selectableCard, smallButton } from '../../lib/ui'
import { formatVi, parseScore } from '../../lib/vnGrade'
import {
  addDays,
  buildSchedule,
  checkRow,
  daysBetween,
  decodeSettings,
  DEFAULT_SETTINGS,
  encodeSettings,
  EXAM_KINDS,
  formatDay,
  MAX_SUBJECTS,
  newSubjectRow,
  SESSION_MIN,
  todayIso,
  toIcs,
  type ExamKind,
  type IcsEvent,
  type MultiSettings,
  type MultiStyle,
  type MultiSubject,
  type Session,
} from '../../lib/vnSchedule'

const STORAGE_KEY = 'fgr-vn-multi'
const DONE_KEY = 'fgr-vn-multi-done'
const INITIAL_DAYS = 7

const COLORS = [
  'border-sky-300/30 bg-sky-400/10 text-sky-200',
  'border-accent-300/30 bg-accent-400/10 text-accent-200',
  'border-emerald-300/30 bg-emerald-400/10 text-emerald-200',
  'border-amber-300/30 bg-amber-400/10 text-amber-200',
  'border-violet-300/30 bg-violet-400/10 text-violet-200',
  'border-rose-300/30 bg-rose-400/10 text-rose-200',
  'border-cyan-300/30 bg-cyan-400/10 text-cyan-200',
  'border-lime-300/30 bg-lime-400/10 text-lime-200',
]

const STYLE_OPTIONS: { id: MultiStyle; label: string }[] = [
  { id: 'mix', label: '🔀 Kết hợp cả ba' },
  { id: 'video', label: '🎬 Xem video' },
  { id: 'ai', label: '🤖 Học với AI' },
  { id: 'reading', label: '📚 Đọc tài liệu' },
]

const PRIORITY: Record<TierId, { label: string; className: string }> = {
  impossible: { label: 'Ưu tiên cao nhất', className: 'text-red-300' },
  cram: { label: 'Ưu tiên cao', className: 'text-orange-300' },
  focus: { label: 'Cần tập trung', className: 'text-yellow-200' },
  easy: { label: 'Vừa sức', className: 'text-emerald-300' },
  secured: { label: 'Đã an toàn', className: 'text-emerald-300' },
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage blocked: the timetable just won't be remembered.
  }
}

/** Shared link (?p=) first, then this device's saved timetable, plus a subject sent from the calculator (?them=). */
function initialSettings(params: URLSearchParams): MultiSettings {
  const shared = params.get('p')
  const decoded = shared ? decodeSettings(shared) : null
  if (decoded) return decoded

  const saved = readJson<MultiSettings>(STORAGE_KEY)
  const base: MultiSettings = saved?.subjects ? { ...DEFAULT_SETTINGS, ...saved } : { ...DEFAULT_SETTINGS, subjects: [] }

  if (params.has('them') || params.has('mon')) {
    const kind = params.get('loai')
    const row = newSubjectRow({
      mon: params.get('mon') ?? '',
      khac: params.get('khac') ?? '',
      need: params.get('them') ?? '',
      topic: params.get('cd') ?? '',
      kind: kind && kind in EXAM_KINDS ? (kind as ExamKind) : 'ck',
    })
    const grade = Number(params.get('lop'))
    if (grade >= 6 && grade <= 12 && !base.grade) base.grade = grade
    const blank = base.subjects.findIndex((s) => !s.mon && !s.date && !s.need)
    base.subjects = blank >= 0 ? base.subjects.map((s, i) => (i === blank ? row : s)) : [...base.subjects, row].slice(0, MAX_SUBJECTS)
  }
  if (!base.subjects.length) base.subjects = [newSubjectRow()]
  return base
}

const fieldClass =
  'h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white transition outline-none placeholder:text-white/30 hover:border-white/25 focus:border-accent-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-accent-500/20 disabled:opacity-50'

function Card({ step, title, sub, children }: { step: number; title: string; sub?: string; children: ReactNode }) {
  return (
    <SectionCard step={step} title={title} sub={sub}>
      {children}
    </SectionCard>
  )
}

function Chips<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.id)}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`${selectableCard(value === o.id)} px-3 py-2 text-sm font-medium`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const hoursLabel = (h: number) => `${formatVi(h)} giờ`

export default function VnMultiPlanPage({ params }: { params: URLSearchParams }) {
  const [settings, setSettings] = useState<MultiSettings>(() => initialSettings(params))
  const [done, setDone] = useState<Record<string, boolean>>(() => readJson(DONE_KEY) ?? {})
  const [showAll, setShowAll] = useState(false)
  const [shared, setShared] = useState(false)
  const today = todayIso()

  // Drop ?them=/?p= from the address bar so a reload doesn't add the subject twice.
  useEffect(() => {
    if (params.toString()) history.replaceState(null, '', '#/vn/lich-on')
  }, [params])

  useEffect(() => writeJson(STORAGE_KEY, settings), [settings])
  useEffect(() => writeJson(DONE_KEY, done), [done])

  useEffect(() => {
    if (!shared) return
    const timer = setTimeout(() => setShared(false), 2000)
    return () => clearTimeout(timer)
  }, [shared])

  const set = (patch: Partial<MultiSettings>) => setSettings((prev) => ({ ...prev, ...patch }))
  const setRow = (id: string, patch: Partial<MultiSubject>) =>
    setSettings((prev) => ({ ...prev, subjects: prev.subjects.map((s) => (s.id === id ? { ...s, ...patch } : s)) }))
  const removeRow = (id: string) =>
    setSettings((prev) => {
      const subjects = prev.subjects.filter((s) => s.id !== id)
      return { ...prev, subjects: subjects.length ? subjects : [newSubjectRow()] }
    })

  const grade = settings.grade
  const gradeSubjects = grade ? subjectsFor(grade) : []
  const schedule = useMemo(() => (grade ? buildSchedule(settings, today) : null), [settings, today, grade])

  const rowInfo = (row: MultiSubject) => {
    const subject = getVnSubject(row.mon)
    const valid = subject && grade && subject.levels.includes(levelOf(grade)) ? subject : undefined
    const name = valid?.id === 'khac' ? row.khac.trim() || 'Môn khác' : (valid?.name ?? '')
    return { subject: valid, name }
  }
  const colorOf = (id: string) => COLORS[Math.max(0, settings.subjects.findIndex((s) => s.id === id)) % COLORS.length]

  const sessionDetails = (session: Session) => {
    const row = settings.subjects.find((s) => s.id === session.subjectId)!
    const { subject, name } = rowInfo(row)
    const need = parseScore(row.need)
    const kind = EXAM_KINDS[row.kind]
    const content = sessionContent({
      phase: session.phase,
      mode: session.mode,
      subjectName: name,
      grade,
      topic: row.topic.trim() || undefined,
      examShort: kind.short,
      flashcardsHref: hrefFor('/vn/the-ghi-nho', { lop: String(grade), mon: row.mon, khac: row.khac, cd: row.topic, tu: 'lich-on' }),
      prompt: {
        subject: `${name} lớp ${grade}`,
        topic: row.topic.trim() || '[phần bạn thấy khó nhất]',
        exam: kind.name,
        goal: need.status === 'valid' ? `Mình cần được ít nhất ${formatVi(need.value)} điểm.` : 'Mình muốn đạt điểm cao nhất có thể.',
        when: `vào ${formatDay(row.date)}`,
        hours: hoursLabel(settings.weekdayHours),
        upperSecondary: grade >= 10,
      },
    })
    return { row, subject, name, content }
  }

  const visibleDays = schedule ? (showAll ? schedule.days : schedule.days.slice(0, INITIAL_DAYS)) : []
  const allSessions = schedule?.days.flatMap((d) => d.sessions) ?? []
  const doneCount = allSessions.filter((s) => done[s.id]).length

  const share = async () => {
    const url = `${location.origin}${location.pathname}#/vn/lich-on?p=${encodeSettings(settings)}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Thời gian biểu ôn thi của mình', url })
      } catch {
        // Share sheet closed.
      }
      return
    }
    setShared(await copyText(url))
  }

  const exportIcs = () => {
    if (!schedule) return
    const events: IcsEvent[] = []
    for (const day of schedule.days) {
      for (const session of day.sessions) {
        const { name, content } = sessionDetails(session)
        const links = content.links
          .map((l) => (l.kind === 'link' ? `• ${l.label}: ${new URL(l.href, location.origin).href}` : `• ${l.label}: mở thời gian biểu trên web để sao chép`))
          .join('\n')
        events.push({
          kind: 'session',
          uid: session.id,
          date: day.date,
          start: session.start,
          end: session.end,
          title: `${MODE_EMOJI[session.mode]} ${name}: ${PHASE_LABELS[session.phase].label}`,
          description: `${content.task}\n${links}\n\nThời gian biểu: ${location.origin}/#/vn/lich-on`,
        })
      }
      for (const id of day.exams) {
        const row = settings.subjects.find((s) => s.id === id)!
        events.push({
          kind: 'exam',
          uid: `exam-${id}-${day.date}`,
          date: day.date,
          title: `📝 Thi ${rowInfo(row).name} (${EXAM_KINDS[row.kind].label})`,
          description: 'Ăn sáng đầy đủ, mang đủ đồ dùng, làm câu dễ trước. Chúc thi tốt!',
        })
      }
    }
    const blob = new Blob([toIcs(events)], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'lich-on-thi.ics'
    link.click()
    URL.revokeObjectURL(url)
  }

  const lowTime = schedule
    ? settings.subjects.filter((row) => {
        const info = schedule.summary[row.id]
        return info && info.tier && ['focus', 'cram', 'impossible'].includes(info.tier) && info.sessions < 3
      })
    : []

  return (
    <main className="w-full max-w-3xl">
      <nav className="mb-4">
        <a href="#/vn" className={smallButton}>
          <ArrowLeftIcon className="size-3.5" />
          Máy tính điểm
        </a>
      </nav>

      <header className="mb-6 px-1 sm:mb-8">
        <div>
          <p className="inline-flex items-center rounded-full border border-accent-300/20 bg-accent-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-[0.1em] text-accent-200 uppercase">Lịch ôn nhiều môn</p>
          <h1 className="mt-3 text-[1.75rem] leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Thời gian biểu ôn thi cho tất cả các môn
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-pretty text-white/60 sm:text-base">
            Nhập các môn sắp kiểm tra, web tự chia lịch theo ngày thi, điểm cần đạt và thời gian rảnh của bạn. Mỗi buổi đều
            có sẵn video, đề luyện hoặc câu lệnh AI để học ngay.
          </p>
        </div>
      </header>

      <div className="space-y-4 sm:space-y-5">
        <Card step={1} title="Thông tin chung">
          <p className="mb-2 text-sm font-medium text-white/85">Lớp</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {VN_GRADES.map(({ grade: g, level }) => (
              <button
                key={g}
                type="button"
                aria-pressed={grade === g}
                onClick={() => set({ grade: g })}
                className={`${selectableCard(grade === g)} flex h-14 flex-col items-center justify-center`}
              >
                <span className="text-base font-semibold">Lớp {g}</span>
                <span className="text-[10px] tracking-wide text-white/45 uppercase">{level === 'thcs' ? 'THCS' : 'THPT'}</span>
              </button>
            ))}
          </div>

          <p className="mt-5 mb-2 text-sm font-medium text-white/85">Cách học cho từng buổi</p>
          <Chips label="Cách học" options={STYLE_OPTIONS} value={settings.style} onChange={(style) => set({ style })} />

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {(
              [
                { key: 'weekday', title: 'Ngày thường (T2–T6)', hours: [1, 1.5, 2, 3, 4] },
                { key: 'weekend', title: 'Cuối tuần (T7, CN)', hours: [2, 3, 4, 5, 6] },
              ] as const
            ).map((group) => {
              const hoursKey = group.key === 'weekday' ? 'weekdayHours' : 'weekendHours'
              const startKey = group.key === 'weekday' ? 'weekdayStart' : 'weekendStart'
              return (
                <div key={group.key}>
                  <p className="mb-2 text-sm font-medium text-white/85">{group.title}</p>
                  <Chips
                    label={`Số giờ học ${group.title}`}
                    options={group.hours.map((h) => ({ id: h, label: hoursLabel(h) }))}
                    value={settings[hoursKey]}
                    onChange={(h) => set({ [hoursKey]: h } as Partial<MultiSettings>)}
                  />
                  <label className="mt-2.5 flex items-center gap-2 text-sm text-white/65">
                    Bắt đầu lúc
                    <input
                      type="time"
                      value={settings[startKey]}
                      onChange={(e) => e.target.value && set({ [startKey]: e.target.value } as Partial<MultiSettings>)}
                      className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-white outline-none focus:border-accent-300/60 focus:ring-4 focus:ring-accent-500/20"
                    />
                  </label>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-white/45">
            Mỗi buổi {SESSION_MIN} phút, nghỉ 10 phút. Ngày có môn thi sẽ được bớt một nửa số buổi.
          </p>
        </Card>

        <Card step={2} title="Các môn sắp kiểm tra" sub="Thêm tất cả các môn trong đợt thi để web chia thời gian cho cân đối.">
          {!grade && <p className="mb-4 rounded-xl border border-amber-300/25 bg-amber-300/[0.07] px-3.5 py-2.5 text-sm text-amber-100/85">Chọn lớp ở bước 1 trước nhé.</p>}
          <ol className="space-y-3">
            {settings.subjects.map((row, index) => {
              const check = checkRow(row, today)
              const info = rowInfo(row)
              return (
                <li key={row.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorOf(row.id)}`}>
                      {info.subject ? `${info.subject.emoji} ${info.name}` : `Môn ${index + 1}`}
                    </span>
                    <button type="button" onClick={() => removeRow(row.id)} className={smallButton} aria-label={`Xóa môn ${index + 1}`}>
                      ✕ Xóa
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-white/65">Môn học</span>
                      <select
                        value={info.subject ? row.mon : ''}
                        disabled={!grade}
                        onChange={(e) => setRow(row.id, { mon: e.target.value })}
                        className={`${fieldClass} appearance-none`}
                      >
                        <option value="">Chọn môn…</option>
                        {gradeSubjects.map((s: VnSubject) => (
                          <option key={s.id} value={s.id}>
                            {s.emoji} {s.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {row.mon === 'khac' && (
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-white/65">Tên môn</span>
                        <input value={row.khac} maxLength={40} onChange={(e) => setRow(row.id, { khac: e.target.value })} placeholder="VD: Tiếng Pháp" className={fieldClass} />
                      </label>
                    )}
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-white/65">Ngày kiểm tra</span>
                      <input
                        type="date"
                        value={row.date}
                        min={addDays(today, 1)}
                        onChange={(e) => setRow(row.id, { date: e.target.value })}
                        aria-invalid={Boolean(check.dateError) || undefined}
                        className={`${fieldClass} ${check.dateError ? 'border-red-400/70' : ''}`}
                      />
                      {check.dateError && <span className="mt-1.5 block text-xs text-red-300">{check.dateError}</span>}
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-white/65">Loại bài</span>
                      <select value={row.kind} onChange={(e) => setRow(row.id, { kind: e.target.value as ExamKind })} className={`${fieldClass} appearance-none`}>
                        {(Object.keys(EXAM_KINDS) as ExamKind[]).map((k) => (
                          <option key={k} value={k}>
                            {EXAM_KINDS[k].label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <ScoreInput
                      id={`need-${row.id}`}
                      label="Điểm cần đạt"
                      placeholder="VD: 8,5"
                      value={row.need}
                      error={check.needError}
                      field
                      onChange={(v) => setRow(row.id, { need: v })}
                    />
                    <label className="block sm:col-span-2 lg:col-span-4">
                      <span className="mb-1.5 block text-xs font-medium text-white/65">Chủ đề khó nhất (không bắt buộc)</span>
                      <input
                        value={row.topic}
                        maxLength={60}
                        onChange={(e) => setRow(row.id, { topic: e.target.value })}
                        placeholder={info.subject?.topicExample ?? 'VD: chủ đề bạn thấy khó nhất'}
                        className={fieldClass}
                      />
                    </label>
                  </div>
                </li>
              )
            })}
          </ol>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={settings.subjects.length >= MAX_SUBJECTS}
              onClick={() => set({ subjects: [...settings.subjects, newSubjectRow()] })}
              className={`${secondaryButton} h-11`}
            >
              ＋ Thêm môn
            </button>
            <a href="#/vn" className={secondaryButton}>
              🧮 Tính điểm cần đạt
            </a>
          </div>
        </Card>

        <Card step={3} title="Thời gian biểu của bạn" sub="Tick “Xong” sau mỗi buổi để theo dõi tiến độ. Lịch tự cập nhật khi bạn sửa thông tin.">
          {!schedule || !allSessions.length ? (
            <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-sm text-white/55">
              Chọn lớp và thêm ít nhất một môn có ngày kiểm tra để xem thời gian biểu.
            </p>
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Số ngày', value: String(Math.max(1, schedule.days.filter((d) => d.sessions.length).length)) },
                  { label: 'Tổng giờ ôn', value: hoursLabel(Math.round((schedule.totalMinutes / 60) * 10) / 10) },
                  { label: 'Đã xong', value: `${doneCount}/${allSessions.length}` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
                    <dt className="text-[11px] font-medium tracking-wide text-white/50 uppercase">{stat.label}</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums">{stat.value}</dd>
                  </div>
                ))}
              </dl>

              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {settings.subjects.map((row) => {
                  const info = schedule.summary[row.id]
                  if (!info) return null
                  const sessionsDone = allSessions.filter((s) => s.subjectId === row.id && done[s.id]).length
                  const priority = info.tier ? PRIORITY[info.tier] : { label: 'Chưa nhập điểm cần đạt', className: 'text-white/45' }
                  return (
                    <li key={row.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorOf(row.id)}`}>
                          {rowInfo(row).subject?.emoji} {rowInfo(row).name}
                        </span>
                        <span className={`text-xs font-medium ${priority.className}`}>{priority.label}</span>
                      </div>
                      <p className="mt-2 text-sm text-white/70">
                        Thi {formatDay(row.date)} · còn {daysBetween(today, row.date)} ngày · {info.sessions} buổi ({hoursLabel(Math.round((info.minutes / 60) * 10) / 10)})
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
                        <div
                          className="h-full rounded-full bg-accent-400"
                          style={{ width: `${info.sessions ? (sessionsDone / info.sessions) * 100 : 0}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>

              {lowTime.length > 0 && (
                <p className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/[0.07] px-3.5 py-2.5 text-sm text-pretty text-amber-100/85">
                  ⚠️ {lowTime.map((r) => rowInfo(r).name).join(', ')} cần nhiều điểm nhưng chỉ có dưới 3 buổi ôn. Thử tăng số giờ
                  học mỗi ngày, hoặc bắt đầu sớm hơn.
                </p>
              )}
              {schedule.cutOff && (
                <p className="mt-4 text-xs text-white/45">Lịch hiển thị tối đa 6 tuần tới. Môn thi xa hơn sẽ được tiếp tục khi gần ngày hơn.</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={exportIcs} className={`${primaryButton} h-11 px-4`}>
                  📲 Thêm vào lịch điện thoại
                </button>
                <button type="button" onClick={share} className={`${secondaryButton} h-11 px-4`}>
                  {shared ? <CheckIcon className="size-4" /> : <ShareIcon className="size-4" />}
                  {shared ? 'Đã chép link!' : 'Chia sẻ'}
                </button>
              </div>
              <p className="mt-2 text-xs text-white/45">
                Tệp lịch có nhắc nhở 10 phút trước mỗi buổi. iPhone: mở tệp rồi chọn “Thêm tất cả”. Android: mở bằng ứng dụng Lịch.
              </p>

              <ol className="mt-6 space-y-5">
                {visibleDays.map((day) => {
                  const offset = daysBetween(today, day.date)
                  const tag = offset === 0 ? 'Hôm nay' : offset === 1 ? 'Ngày mai' : null
                  return (
                    <li key={day.date}>
                      <div className="mb-2.5 flex items-center gap-2">
                        <h3 className="font-semibold">{formatDay(day.date)}</h3>
                        {tag && <span className="rounded-full bg-accent-400/15 px-2 py-0.5 text-[11px] font-semibold text-accent-200">{tag}</span>}
                        {day.weekend && <span className="text-xs text-white/40">Cuối tuần</span>}
                        {day.sessions.length > 0 && (
                          <span className="ml-auto text-xs text-white/40 tabular-nums">
                            {day.sessions.filter((s) => done[s.id]).length}/{day.sessions.length} buổi
                          </span>
                        )}
                      </div>
                      {day.exams.map((id) => {
                        const row = settings.subjects.find((s) => s.id === id)!
                        return (
                          <p key={id} className="mb-2.5 rounded-2xl border border-pink-300/25 bg-pink-400/[0.08] px-4 py-3 text-sm text-pretty text-pink-100">
                            📝 <strong>Thi {rowInfo(row).name}</strong> ({EXAM_KINDS[row.kind].label.toLowerCase()}). Sáng ôn nhẹ 15 phút, ăn sáng đầy đủ,
                            mang đủ đồ dùng. Chúc thi tốt!
                          </p>
                        )
                      })}
                      <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                        {day.sessions.map((session) => (
                          <SessionItem
                            key={session.id}
                            session={session}
                            details={sessionDetails(session)}
                            color={colorOf(session.subjectId)}
                            done={Boolean(done[session.id])}
                            onToggle={() => setDone((prev) => ({ ...prev, [session.id]: !prev[session.id] }))}
                          />
                        ))}
                      </ul>
                    </li>
                  )
                })}
              </ol>
              {schedule.days.length > INITIAL_DAYS && (
                <button type="button" onClick={() => setShowAll((v) => !v)} className={`${secondaryButton} mt-5 w-full`}>
                  {showAll ? 'Thu gọn' : `Xem thêm ${schedule.days.length - INITIAL_DAYS} ngày`}
                </button>
              )}
            </>
          )}
        </Card>
      </div>
    </main>
  )
}

function SessionItem({
  session,
  details,
  color,
  done,
  onToggle,
}: {
  session: Session
  details: { name: string; subject?: VnSubject; content: { task: string; links: SessionLink[] } }
  color: string
  done: boolean
  onToggle: () => void
}) {
  const phase = PHASE_LABELS[session.phase]
  return (
    <li className={`flex gap-3 px-3.5 py-3.5 transition sm:gap-4 sm:px-4 ${done ? 'opacity-55' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        aria-label={done ? 'Bỏ đánh dấu xong' : 'Đánh dấu xong'}
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border transition focus-visible:ring-2 focus-visible:ring-accent-400/50 focus-visible:outline-none ${
          done ? 'border-emerald-300/60 bg-emerald-400/80 text-ink-950' : 'border-white/25 hover:border-white/50'
        }`}
      >
        {done && <CheckIcon className="size-4" />}
      </button>
      <p className="hidden w-14 shrink-0 pt-0.5 text-sm leading-tight font-semibold text-white tabular-nums sm:block">
        {session.start}
        <span className="block text-xs font-normal text-white/40">{session.end}</span>
      </p>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-white tabular-nums sm:hidden">
            {session.start}–{session.end}
          </span>
          <span className={`rounded-full border px-2 py-0.5 font-semibold ${color}`}>
            {details.subject?.emoji} {details.name}
          </span>
          <span className={`rounded-full border px-2 py-0.5 ${phase.badge}`}>{phase.label}</span>
          <span aria-hidden>{MODE_EMOJI[session.mode]}</span>
        </div>
        <p className={`mt-1.5 text-sm text-pretty text-white/80 ${done ? 'line-through decoration-white/30' : ''}`}>{details.content.task}</p>
        <SessionLinks links={details.content.links} copiedLabel="Đã chép!" />
      </div>
    </li>
  )
}
