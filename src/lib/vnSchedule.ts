// Multi-subject study timetable for the Vietnamese section.
// Every day from today until the last exam gets 40-minute sessions (10-minute
// breaks) at real clock times. Each slot goes to the subject that most needs it:
// sooner exams and higher required scores weigh more, and a subject rarely
// takes more than two sessions a day so subjects stay interleaved.

import type { TierId } from './grade'
import { parseScore, vnTierFor } from './vnGrade'

export const SESSION_MIN = 40
export const BREAK_MIN = 10
export const MAX_SUBJECTS = 8
export const HORIZON_DAYS = 42

export type ExamKind = 'ck' | 'gk' | 'tx' | 'khac'

export const EXAM_KINDS: Record<ExamKind, { label: string; short: string; name: string }> = {
  ck: { label: 'Cuối kì', short: 'cuối kì', name: 'bài kiểm tra cuối kì' },
  gk: { label: 'Giữa kì', short: 'giữa kì', name: 'bài kiểm tra giữa kì' },
  tx: { label: '15 phút', short: 'kiểm tra 15 phút', name: 'bài kiểm tra 15 phút' },
  khac: { label: 'Khác', short: 'kiểm tra', name: 'bài kiểm tra' },
}

export type MultiStyle = 'video' | 'ai' | 'reading' | 'mix'
export type Mode = Exclude<MultiStyle, 'mix'>

export type MultiSubject = {
  id: string
  mon: string
  khac: string
  date: string
  kind: ExamKind
  need: string
  topic: string
}

export type MultiSettings = {
  grade: number
  style: MultiStyle
  weekdayHours: number
  weekendHours: number
  weekdayStart: string
  weekendStart: string
  subjects: MultiSubject[]
}

export const newSubjectRow = (patch: Partial<MultiSubject> = {}): MultiSubject => ({
  id: Math.random().toString(36).slice(2, 8),
  mon: '',
  khac: '',
  date: '',
  kind: 'ck',
  need: '',
  topic: '',
  ...patch,
})

export const DEFAULT_SETTINGS: MultiSettings = {
  grade: 0,
  style: 'mix',
  weekdayHours: 2,
  weekendHours: 4,
  weekdayStart: '19:00',
  weekendStart: '08:30',
  subjects: [],
}

// ---------- Dates (local calendar days as YYYY-MM-DD) ----------

const pad = (n: number) => String(n).padStart(2, '0')

export function todayIso(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function toUtc(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function addDays(iso: string, days: number): string {
  const date = new Date(toUtc(iso) + days * 86400000)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86400000)
}

export function weekday(iso: string): number {
  return new Date(toUtc(iso)).getUTCDay()
}

const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

export function formatDay(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${WEEKDAYS[weekday(iso)]}, ${Number(d)}/${Number(m)}`
}

export const isWeekend = (iso: string) => weekday(iso) === 0 || weekday(iso) === 6

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = (h * 60 + m + minutes) % (24 * 60)
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

export function sessionsForHours(hours: number): number {
  return Math.max(1, Math.floor((hours * 60 + BREAK_MIN) / (SESSION_MIN + BREAK_MIN)))
}

// ---------- Validation ----------

export type RowCheck = { ok: boolean; dateError?: string; needError?: string }

export function checkRow(row: MultiSubject, today: string): RowCheck {
  let dateError: string | undefined
  if (row.date) {
    const until = daysBetween(today, row.date)
    if (until < 1) dateError = 'Chọn ngày thi từ ngày mai trở đi.'
    else if (until > 120) dateError = 'Chọn ngày thi trong vòng 4 tháng tới.'
  }
  const need = parseScore(row.need)
  const needError = need.status === 'invalid' ? need.error : undefined
  const ok = Boolean(row.mon) && (row.mon !== 'khac' || row.khac.trim().length > 0) && Boolean(row.date) && !dateError && !needError
  return { ok, dateError, needError }
}

// ---------- Scheduling ----------

export type Phase = 'diagnose' | 'learn' | 'practice' | 'review' | 'eve'

export type Session = {
  id: string
  subjectId: string
  phase: Phase
  mode: Mode
  start: string
  end: string
}

export type Day = { date: string; weekend: boolean; sessions: Session[]; exams: string[] }

export type SubjectSummary = { sessions: number; minutes: number; tier: TierId | null; daysLeft: number }

export type Schedule = {
  days: Day[]
  summary: Record<string, SubjectSummary>
  totalMinutes: number
  cutOff: boolean
}

const PHASE_CYCLE: Phase[] = ['learn', 'practice', 'review']

/**
 * What a session should do: start with a diagnostic, learn early, practice in the
 * middle, review near the exam (one last timed test the day before). A second or
 * third session of the same subject on one day moves on to the next phase.
 */
function phaseFor(assigned: number, examDay: number, day: number, sameDayIndex: number): Phase {
  const daysLeft = examDay - day
  if (assigned === 0 && examDay >= 4) return 'diagnose'
  const progress = examDay > 0 ? day / examDay : 1
  const base: Phase =
    daysLeft === 1 ? 'practice' : daysLeft <= 2 || progress >= 0.85 ? 'review' : progress >= 0.5 ? 'practice' : 'learn'
  return sameDayIndex === 0 ? base : PHASE_CYCLE[(PHASE_CYCLE.indexOf(base) + sameDayIndex) % PHASE_CYCLE.length]
}

const TIER_WEIGHT: Record<TierId, number> = { secured: 1, easy: 2, focus: 3, cram: 4, impossible: 4 }
const MODES: Mode[] = ['video', 'reading', 'ai']

export function buildSchedule(settings: MultiSettings, today: string): Schedule {
  const rows = settings.subjects.filter((row) => checkRow(row, today).ok)
  const state = rows.map((row) => {
    const need = parseScore(row.need)
    const tier = need.status === 'valid' ? vnTierFor(need.value) : null
    return {
      row,
      examDay: daysBetween(today, row.date),
      tier,
      weight: tier ? TIER_WEIGHT[tier] : 2.5,
      assigned: 0,
    }
  })

  const lastExam = Math.max(0, ...state.map((s) => s.examDay))
  const horizon = Math.min(lastExam, HORIZON_DAYS)
  const days: Day[] = []
  const summary: Record<string, SubjectSummary> = {}
  for (const s of state) summary[s.row.id] = { sessions: 0, minutes: 0, tier: s.tier, daysLeft: s.examDay }

  for (let d = 0; d <= horizon; d++) {
    const date = addDays(today, d)
    const weekend = isWeekend(date)
    const exams = state.filter((s) => s.examDay === d).map((s) => s.row.id)
    const active = state.filter((s) => s.examDay > d)
    if (!active.length) {
      if (exams.length) days.push({ date, weekend, sessions: [], exams })
      continue
    }

    let slots = sessionsForHours(weekend ? settings.weekendHours : settings.weekdayHours)
    // Exam days are tiring: plan half as much for the other subjects.
    if (exams.length) slots = Math.max(1, Math.ceil(slots / 2))
    const perDayCap = active.length >= 3 ? 2 : active.length === 2 ? Math.max(2, Math.ceil(slots / 2)) : slots

    type Pick = { s: (typeof state)[number]; phase: Phase }
    // The evening before an exam always ends with a light review of that subject.
    const eves = active.filter((a) => a.examDay === d + 1).slice(0, slots)
    const regularSlots = slots - eves.length
    const picks: Pick[] = []
    const countToday = (s: (typeof state)[number]) => picks.filter((p) => p.s === s).length + (eves.includes(s) ? 1 : 0)

    while (picks.length < regularSlots) {
      const open = active.filter((s) => countToday(s) < perDayCap)
      const pool = open.length ? open : active
      let best = pool[0]
      let bestScore = -Infinity
      for (const s of pool) {
        const daysLeft = s.examDay - d
        const score = (s.weight * (1 + 5 / daysLeft)) / (1 + s.assigned * 0.35) - countToday(s) * 1.5
        if (score > bestScore + 1e-9 || (Math.abs(score - bestScore) < 1e-9 && s.examDay < best.examDay)) {
          best = s
          bestScore = score
        }
      }
      picks.push({ s: best, phase: phaseFor(best.assigned, best.examDay, d, picks.filter((p) => p.s === best).length) })
      best.assigned++
    }

    // Avoid the same subject twice in a row when another order is possible.
    const ordered: Pick[] = []
    const rest = [...picks]
    while (rest.length) {
      const prev = ordered[ordered.length - 1]
      const index = rest.findIndex((p) => p.s !== prev?.s)
      ordered.push(...rest.splice(index === -1 ? 0 : index, 1))
    }
    for (const s of eves) {
      ordered.push({ s, phase: 'eve' })
      s.assigned++
    }

    let clock = weekend ? settings.weekendStart : settings.weekdayStart
    const sessions: Session[] = ordered.map((p, i) => {
      const counter = summary[p.s.row.id].sessions
      const mode: Mode = settings.style === 'mix' ? MODES[counter % MODES.length] : settings.style
      summary[p.s.row.id].sessions++
      summary[p.s.row.id].minutes += SESSION_MIN
      const start = clock
      const end = addMinutes(start, SESSION_MIN)
      clock = addMinutes(end, BREAK_MIN)
      return { id: `${date}-${i}-${p.s.row.id}-${p.phase}`, subjectId: p.s.row.id, phase: p.phase, mode, start, end }
    })
    days.push({ date, weekend, sessions, exams })
  }

  // Exams beyond the planning window still appear at the end.
  for (const s of state.filter((x) => x.examDay > horizon)) {
    days.push({ date: s.row.date, weekend: isWeekend(s.row.date), sessions: [], exams: [s.row.id] })
  }

  const totalMinutes = Object.values(summary).reduce((sum, x) => sum + x.minutes, 0)
  return { days, summary, totalMinutes, cutOff: lastExam > HORIZON_DAYS }
}

// ---------- Calendar export (.ics) ----------

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Folds lines at 75 bytes as the iCalendar spec requires, without splitting a character. */
function fold(line: string): string {
  const encoder = new TextEncoder()
  const parts: string[] = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    if (bytes + size > (parts.length ? 74 : 75)) {
      parts.push(current)
      current = ''
      bytes = 0
    }
    current += char
    bytes += size
  }
  parts.push(current)
  return parts.join('\r\n ')
}

const icsDate = (iso: string) => iso.replace(/-/g, '')
const icsDateTime = (iso: string, time: string) => `${icsDate(iso)}T${time.replace(':', '')}00`

export type IcsEvent =
  | { kind: 'session'; uid: string; date: string; start: string; end: string; title: string; description: string }
  | { kind: 'exam'; uid: string; date: string; title: string; description: string }

export function toIcs(events: IcsEvent[], stamp = new Date()): string {
  const dtstamp = stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Final Grade Rescue//Lich on thi//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:${e.uid}@final-grade-rescue`, `DTSTAMP:${dtstamp}`)
    if (e.kind === 'session') {
      lines.push(`DTSTART:${icsDateTime(e.date, e.start)}`, `DTEND:${icsDateTime(e.date, e.end)}`)
    } else {
      lines.push(`DTSTART;VALUE=DATE:${icsDate(e.date)}`, `DTEND;VALUE=DATE:${icsDate(addDays(e.date, 1))}`)
    }
    lines.push(`SUMMARY:${escapeIcs(e.title)}`, `DESCRIPTION:${escapeIcs(e.description)}`)
    if (e.kind === 'session') {
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeIcs(e.title)}`, 'TRIGGER:-PT10M', 'END:VALARM')
    }
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}

// ---------- Sharing (settings in the URL) ----------

export function encodeSettings(settings: MultiSettings): string {
  const json = JSON.stringify(settings)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeSettings(value: string): MultiSettings | null {
  try {
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<MultiSettings>
    if (!parsed || !Array.isArray(parsed.subjects)) return null
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      subjects: parsed.subjects.slice(0, MAX_SUBJECTS).map((s) => newSubjectRow({ ...s })),
    }
  } catch {
    return null
  }
}
